import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { getSessionCustomerId, getDeviceOrderIds } from '@/lib/server/customerSession'

/**
 * GET /api/orders/:number — order status for the tracking page.
 * Anyone with the number sees status, items and totals. Personal details
 * (name, phone, address) only go to the device that placed the order or the
 * customer verified on this device — order numbers are easy to guess.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ number: string }> }) {
    const { number } = await params
    const orderNumber = decodeURIComponent(number).trim().toUpperCase().slice(0, 40)

    const { data: order, error } = await adminSupabase
        .from('orders')
        .select(`
            id, order_number, status, order_type, created_at, updated_at,
            customer_id, customer_name, customer_phone, delivery_address,
            subtotal, delivery_fee, loyalty_discount, tier_discount, total, payment_method, branch_id,
            branches ( name, address, phone, whatsapp ),
            order_items ( id, name, size, quantity, unit_price, subtotal )
        `)
        .eq('order_number', orderNumber)
        .maybeSingle()

    if (error) return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const [sessionId, deviceOrders] = await Promise.all([getSessionCustomerId(), getDeviceOrderIds()])
    const isOwner = (!!sessionId && sessionId === order.customer_id) || deviceOrders.includes(order.id)

    const rest: Record<string, unknown> = { ...order }
    delete rest.customer_id
    return NextResponse.json({
        isOwner,
        order: isOwner
            ? rest
            : { ...rest, customer_name: null, customer_phone: null, delivery_address: null },
    })
}
