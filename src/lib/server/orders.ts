import 'server-only'
import { adminSupabase } from '@/lib/supabase/admin'

export interface IncomingItem {
    menuItemId: string
    variantId?: string | null
    size?: 'small' | 'large' | null
    quantity: number
}

export interface PricedItem {
    menu_item_id: string
    name: string
    size: 'small' | 'large' | null
    quantity: number
    unit_price: number
    subtotal: number
}

interface MenuRow {
    id: string
    name: string
    price: number | null
    price_large: number | null
    has_sizes: boolean
    is_available: boolean
    price_on_request: boolean
    item_variants: { id: string; label: string; price: number }[] | null
}

export class OrderError extends Error {
    constructor(message: string, public status = 400) { super(message) }
}

/** Re-price a cart from the database. Client prices are never trusted. */
export async function priceItems(items: unknown): Promise<{ priced: PricedItem[]; subtotal: number }> {
    if (!Array.isArray(items) || items.length === 0) throw new OrderError('Your cart is empty.')
    if (items.length > 60) throw new OrderError('Too many items in one order.')

    const clean: IncomingItem[] = items.map((raw: Record<string, unknown>) => {
        const quantity = Number(raw?.quantity)
        if (typeof raw?.menuItemId !== 'string' || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
            throw new OrderError('One of the items in your cart is invalid.')
        }
        return {
            menuItemId: raw.menuItemId,
            variantId: typeof raw.variantId === 'string' ? raw.variantId : null,
            size: raw.size === 'large' ? 'large' : raw.size === 'small' ? 'small' : null,
            quantity,
        }
    })

    const ids = [...new Set(clean.map(i => i.menuItemId))]
    const { data, error } = await adminSupabase
        .from('menu_items')
        .select('id, name, price, price_large, has_sizes, is_available, price_on_request, item_variants(id, label, price)')
        .in('id', ids)
    if (error) throw error

    const byId = new Map((data as MenuRow[]).map(r => [r.id, r]))
    const priced = clean.map(item => {
        const row = byId.get(item.menuItemId)
        if (!row) throw new OrderError('An item in your cart is no longer on the menu. Please remove it and try again.')
        if (!row.is_available) throw new OrderError(`${row.name} is sold out right now. Please remove it to continue.`)
        if (row.price_on_request) throw new OrderError(`${row.name} is priced on request — please order it through the branch.`)

        let unit: number | null
        let name = row.name
        const variants = row.item_variants ?? []
        if (variants.length > 0) {
            const v = variants.find(x => x.id === item.variantId) ?? null
            if (!v) throw new OrderError(`Please choose an option for ${row.name}.`)
            unit = v.price
            name = `${row.name} (${v.label})`
        } else if (row.has_sizes && item.size === 'large' && row.price_large) {
            unit = row.price_large
        } else {
            unit = row.price
        }
        if (unit == null) throw new OrderError(`${row.name} has no price set.`)

        return {
            menu_item_id: row.id,
            name,
            size: row.has_sizes ? item.size ?? 'small' : item.size ?? null,
            quantity: item.quantity,
            unit_price: unit,
            subtotal: unit * item.quantity,
        }
    })

    return { priced, subtotal: priced.reduce((s, i) => s + i.subtotal, 0) }
}

/** Insert an order and its items; rolls the order back if the items fail. */
export async function insertOrder(order: Record<string, unknown>, items: PricedItem[]) {
    const { data: created, error } = await adminSupabase.from('orders').insert(order).select().single()
    if (error) throw error

    const { error: itemsError } = await adminSupabase
        .from('order_items')
        .insert(items.map(i => ({ ...i, order_id: created.id })))
    if (itemsError) {
        await adminSupabase.from('orders').delete().eq('id', created.id)
        throw itemsError
    }
    return created
}

/** Deduct points for an order. Re-reads the balance so it can never go negative. */
export async function redeemPoints(customerId: string, orderId: string, points: number) {
    if (points <= 0) return
    const { data: c } = await adminSupabase.from('customers').select('loyalty_points').eq('id', customerId).single()
    const balance = c?.loyalty_points ?? 0
    const spend = Math.min(points, balance)
    if (spend <= 0) return
    await adminSupabase.from('customers').update({ loyalty_points: balance - spend }).eq('id', customerId)
    await adminSupabase.from('loyalty_transactions').insert({
        customer_id: customerId,
        order_id: orderId,
        type: 'redeemed',
        points: -spend,
        description: 'Redeemed for discount',
    })
}

const REFERRAL_BONUS = 50

/** Award both sides of a referral, once, on the referred customer's first order. */
export async function applyReferral(customerId: string, code: string) {
    const { data: me } = await adminSupabase
        .from('customers').select('id, loyalty_points, referred_by').eq('id', customerId).single()
    if (!me || me.referred_by) return

    const { data: referrer } = await adminSupabase
        .from('customers').select('id, loyalty_points').eq('referral_code', code.toUpperCase().slice(0, 32)).maybeSingle()
    if (!referrer || referrer.id === customerId) return

    // Claim the referral first so a retried request can't award it twice
    const { data: claimed } = await adminSupabase
        .from('customers')
        .update({ referred_by: referrer.id, loyalty_points: (me.loyalty_points ?? 0) + REFERRAL_BONUS })
        .eq('id', customerId)
        .is('referred_by', null)
        .select('id')
    if (!claimed?.length) return

    await adminSupabase.from('customers').update({ loyalty_points: (referrer.loyalty_points ?? 0) + REFERRAL_BONUS }).eq('id', referrer.id)
    await adminSupabase.from('loyalty_transactions').insert([
        { customer_id: referrer.id, type: 'bonus', points: REFERRAL_BONUS, description: 'Referral bonus — friend placed first order' },
        { customer_id: customerId, type: 'bonus', points: REFERRAL_BONUS, description: 'Welcome bonus — referred by a friend' },
    ])
}
