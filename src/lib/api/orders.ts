import { adminCall } from '@/lib/api/adminClient'
import type { CartItem } from '@/store/useCartStore'
import type { Order } from '@/types'

type OrderLine = Pick<CartItem, 'menuItemId' | 'variantId' | 'size' | 'quantity'>

// ── Customer ─────────────────────────────────────────────────────────────────

export interface PlaceOrderPayload {
    name: string
    phone: string
    orderType: 'delivery' | 'takeaway' | 'dine-in'
    branchId?: string
    coords?: { lat: number; lng: number }
    address?: string
    items: OrderLine[]
    paymentMethod: 'jazzcash' | 'cod'
    notes?: string
    redeemPoints?: number
    referralCode?: string | null
}

export interface PlacedOrder {
    orderNumber: string
    total: number
    pointsEarned: number
    whatsappURL: string
    verified: boolean
}

/** Place an order. Prices, fees and discounts are worked out on the server. */
export async function placeOrder(payload: PlaceOrderPayload): Promise<PlacedOrder> {
    const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error ?? 'We could not place your order. Please try again.')
    return body as PlacedOrder
}

/** Tracking lookup. Personal details are only included for the device that placed the order. */
export async function getOrderByNumber(orderNumber: string): Promise<{ order: Order; isOwner: boolean } | null> {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`, { cache: 'no-store' })
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Could not load the order')
    return res.json()
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function updateOrderStatus(orderId: string, status: string) {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include', // sends admin_session cookie
    })

    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Failed to update order status (${res.status})`)
    }
}

export const getAllOrders = (page = 1, limit = 30, branchId?: string | null) =>
    adminCall<{ orders: Order[]; total: number }>('orders.list', page, limit, branchId ?? null)

/** Counter / phone orders entered by staff. Items are re-priced on the server. */
export const createCounterOrder = (input: {
    customerName?: string
    customerPhone?: string
    branchId: string
    orderType: 'delivery' | 'takeaway' | 'dine-in'
    items: OrderLine[]
    notes?: string
}) => adminCall<Order>('orders.create', input)
