import { createClient } from '@/lib/supabase/client'
import { Review, ReviewInsert, ReviewUpdate } from '@/types/reviews'

const supabase = createClient()

// ── Public: Fetch all published reviews ──────────────────────────────────────
export async function getPublishedReviews(): Promise<Review[]> {
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true })

    if (error) throw new Error(error.message)
    return (data as Review[]) ?? []
}

// ── Admin: Fetch ALL reviews ──────────────────────────────────────────────────
export async function getAllReviews(): Promise<Review[]> {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            *,
            customers ( name, phone ),
            orders ( order_number )
        `)
        .order('display_order', { ascending: true })

    if (error) throw new Error(error.message)
    return (data as Review[]) ?? []
}

// ── Admin: Create new review ──────────────────────────────────────────────────
export async function createReview(data: ReviewInsert): Promise<Review> {
    const { data: newReview, error } = await supabase
        .from('reviews')
        .insert(data)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return newReview as Review
}

// ── Admin: Update review ──────────────────────────────────────────────────────
export async function updateReview(id: string, data: ReviewUpdate): Promise<Review> {
    const { data: updatedReview, error } = await supabase
        .from('reviews')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return updatedReview as Review
}

// ── Admin: Delete review ──────────────────────────────────────────────────────
export async function deleteReview(id: string): Promise<void> {
    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
}

// ── Admin: Toggle published status ───────────────────────────────────────────
export async function toggleReviewPublished(
    id: string,
    is_published: boolean
): Promise<void> {
    const { error } = await supabase
        .from('reviews')
        .update({ is_published, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) throw new Error(error.message)
}

// ── Legacy/Support for ReviewModal ───────────────────────────────────────────
export interface ReviewPayload {
    customerId: string
    orderId: string
    rating: number
    comment?: string
}

export async function submitReview(data: ReviewPayload): Promise<void> {
    // Sync with new schema: comment -> review_text, is_approved -> is_published
    const { error } = await supabase.from('reviews').insert({
        customer_id: data.customerId,
        order_id: data.orderId,
        rating: data.rating,
        review_text: data.comment?.trim() || null,
        is_published: false, // Wait for admin approval
        is_verified: true,
        customer_name: 'Customer', // Fallback, will be synced in SQL or on load
    })
    if (error) throw new Error(error.message)
}

export async function hasCustomerReviewed(
    customerId: string,
    orderId: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('customer_id', customerId)
        .eq('order_id', orderId)
        .maybeSingle()

    if (error) return false
    return !!data
}
