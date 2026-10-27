import { adminCall } from '@/lib/api/adminClient'

export interface AdminReview {
    id: string
    rating: number
    comment: string | null
    is_approved: boolean
    created_at: string
    customers: { name: string; phone?: string }
    orders?: { order_number: string }
}

/** Review a delivered order. Only works from the device the order was placed on. */
export async function submitReview(data: { orderId: string; rating: number; comment?: string }): Promise<void> {
    const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Could not save your review.')
    }
}

export async function hasCustomerReviewed(orderId: string): Promise<boolean> {
    const res = await fetch(`/api/reviews?orderId=${encodeURIComponent(orderId)}`)
    if (!res.ok) return false
    return !!(await res.json()).reviewed
}

/** Public — approved reviews, first names only. */
export async function getApprovedReviews(): Promise<AdminReview[]> {
    const res = await fetch('/api/reviews')
    if (!res.ok) throw new Error('Could not load reviews')
    return (await res.json()).reviews ?? []
}

// ── Admin ────────────────────────────────────────────────────────────────────
export const getAllReviews = () => adminCall<AdminReview[]>('reviews.list')
export const approveReview = (id: string) => adminCall('reviews.approve', id)
export const rejectReview = (id: string) => adminCall('reviews.delete', id)
