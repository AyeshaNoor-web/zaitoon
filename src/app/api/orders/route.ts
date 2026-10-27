import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { adminSupabase } from '@/lib/supabase/admin'
import { getDeliverySettings } from '@/lib/api/settings'
import { getDeliveryFeeDetails, haversineDistance } from '@/lib/distance'
import { applyTierPerks, calculateEarnedPoints, maxRedeemablePoints } from '@/lib/utils/loyalty'
import { buildWhatsAppURL } from '@/lib/whatsapp'
import { getRouteDistance } from '@/lib/server/routeDistance'
import { getSessionCustomerId, setCustomerSession, rememberDeviceOrder, normalizePhone } from '@/lib/server/customerSession'
import { priceItems, insertOrder, redeemPoints, applyReferral, OrderError } from '@/lib/server/orders'
import { SITE } from '@/lib/site'
import type { Branch } from '@/types'

const ORDER_TYPES = ['delivery', 'takeaway', 'dine-in'] as const
type OrderType = typeof ORDER_TYPES[number]

/**
 * POST /api/orders — place a customer order.
 * Everything that affects money is computed here: item prices, the branch,
 * delivery fee, member discount and points. The client only sends choices.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : ''
        const phone = typeof body.phone === 'string' ? normalizePhone(body.phone) : null
        const orderType = ORDER_TYPES.includes(body.orderType) ? body.orderType as OrderType : null
        const paymentMethod = body.paymentMethod === 'jazzcash' ? 'jazzcash' : 'cod'
        const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) || null : null

        if (name.length < 2) throw new OrderError('Please enter your name.')
        if (!phone) throw new OrderError('Please enter a valid Pakistani mobile number.')
        if (!orderType) throw new OrderError('Please choose delivery, takeaway or dine-in.')

        const { priced, subtotal } = await priceItems(body.items)
        if (subtotal < SITE.minOrder) throw new OrderError(`The minimum order is Rs. ${SITE.minOrder}.`)

        // ── Branch & delivery ──────────────────────────────────
        const { data: branchRows, error: bErr } = await adminSupabase.from('branches').select('*').eq('is_active', true)
        if (bErr) throw bErr
        const branches = (branchRows ?? []) as Branch[]
        if (branches.length === 0) throw new OrderError('No branches are taking orders right now.', 503)

        let branch: Branch | undefined
        let deliveryFee = 0
        let distanceKm: number | null = null
        let address: string | null = null
        let lat: number | null = null
        let lng: number | null = null
        const config = await getDeliverySettings()

        if (orderType === 'delivery') {
            lat = Number(body.coords?.lat)
            lng = Number(body.coords?.lng)
            address = typeof body.address === 'string' ? body.address.trim().slice(0, 300) : ''
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new OrderError('Please set your delivery location.')
            if (!address || address.length < 5) throw new OrderError('Please enter your house and street address.')

            branch = branches.reduce((best, b) =>
                haversineDistance(lat!, lng!, b.lat, b.lng) < haversineDistance(lat!, lng!, best.lat, best.lng) ? b : best)
            const route = await getRouteDistance(lat, lng, branch.lat, branch.lng)
            distanceKm = route.distanceKm
            const fee = getDeliveryFeeDetails(route.distanceKm, config)
            if (fee.outOfRange) throw new OrderError('That address is outside our delivery range. Choose takeaway or dine-in instead.')
            deliveryFee = config.freeAbove > 0 && subtotal >= config.freeAbove ? 0 : fee.fee ?? 0
        } else {
            branch = branches.find(b => b.id === body.branchId)
            if (!branch) throw new OrderError('Please choose a branch.')
        }

        // ── Customer ───────────────────────────────────────────
        // Orders always earn points for the phone's owner, but discounts and
        // redemption only apply when this device is verified for that customer.
        const sessionId = await getSessionCustomerId()
        let { data: customer } = await adminSupabase.from('customers').select('*').eq('phone', phone).maybeSingle()
        let verified = !!customer && customer.id === sessionId

        if (!customer) {
            const { data: created, error } = await adminSupabase.from('customers').insert({
                phone, name, referral_code: randomUUID().split('-')[0].toUpperCase(),
                loyalty_points: 0, tier: 'bronze', total_orders: 0, total_spent: 0,
            }).select().single()
            if (error) throw error
            customer = created
            verified = true
            await setCustomerSession(created.id)
        }

        const tier = verified ? customer.tier ?? 'bronze' : 'bronze'
        const { tierDiscount, finalDeliveryFee } = applyTierPerks(tier, subtotal, deliveryFee)
        const requested = Math.max(0, Math.floor(Number(body.redeemPoints) || 0))
        const loyaltyDiscount = verified ? Math.min(requested, maxRedeemablePoints(subtotal, customer.loyalty_points ?? 0)) : 0
        const total = Math.max(0, subtotal + finalDeliveryFee - tierDiscount - loyaltyDiscount)

        const order = await insertOrder({
            customer_name: name,
            customer_phone: phone,
            customer_id: customer.id,
            branch_id: branch.id,
            order_type: orderType,
            delivery_address: address,
            delivery_lat: lat,
            delivery_lng: lng,
            distance_km: distanceKm,
            subtotal,
            delivery_fee: finalDeliveryFee,
            loyalty_discount: loyaltyDiscount,
            tier_discount: tierDiscount,
            total,
            payment_method: paymentMethod,
            notes,
            status: 'pending',
            payment_status: 'pending',
        }, priced)

        if (loyaltyDiscount > 0) await redeemPoints(customer.id, order.id, loyaltyDiscount)
        if (verified && typeof body.referralCode === 'string' && (customer.total_orders ?? 0) === 0) {
            await applyReferral(customer.id, body.referralCode).catch(err => console.error('Referral failed:', err))
        }
        await rememberDeviceOrder(order.id)

        const pointsEarned = calculateEarnedPoints(total)
        const whatsappURL = buildWhatsAppURL(branch.whatsapp, {
            orderNumber: order.order_number,
            customerName: name,
            customerPhone: phone,
            orderType,
            deliveryAddress: address ?? undefined,
            deliveryLat: lat ?? undefined,
            deliveryLng: lng ?? undefined,
            distanceKm: distanceKm ?? undefined,
            branchName: branch.name,
            items: priced.map(i => ({ name: i.name, size: i.size, quantity: i.quantity, unitPrice: i.unit_price, subtotal: i.subtotal })),
            subtotal,
            deliveryFee: finalDeliveryFee,
            loyaltyDiscount,
            tierDiscount,
            customerTier: tier,
            baseDeliveryFee: deliveryFee,
            total,
            paymentMethod,
            pointsEarned,
            notes: notes ?? undefined,
        })

        return NextResponse.json({ orderNumber: order.order_number, total, pointsEarned, whatsappURL, verified })
    } catch (err) {
        if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: err.status })
        console.error('Order failed:', err)
        return NextResponse.json({ error: 'We could not place your order. Please try again.' }, { status: 500 })
    }
}
