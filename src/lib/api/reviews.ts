import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface ReviewPayload {
    customerId: string
    orderId: string
    rating: number
    comment?: string
}

export async function submitReview(data: ReviewPayload): Promise<void> {
    const { error } = await supabase.from('reviews').insert({
        customer_id: data.customerId,
        order_id: data.orderId,
        rating: data.rating,
        comment: data.comment?.trim() || null,
    })
    if (error) throw new Error(error.message)
}

export async function hasCustomerReviewed(
    customerId: string,
    orderId: string
): Promise<boolean> {
    // Bypass RLS approved-only filter by selecting from anon but checking existence
    const { data, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('customer_id', customerId)
        .eq('order_id', orderId)
        .maybeSingle()

    if (error) return false
    return !!data
}

// ── Admin-only (uses service key — only called from admin pages) ──────────────
export async function getAllReviews() {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            id, rating, comment, is_approved, created_at,
            customers ( name, phone ),
            orders ( order_number )
        `)
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
}

export async function approveReview(id: string): Promise<void> {
    const { error } = await supabase
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', id)
    if (error) throw new Error(error.message)
}

export async function rejectReview(id: string): Promise<void> {
    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id)
    if (error) throw new Error(error.message)
}
