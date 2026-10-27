import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { getSessionCustomerId } from '@/lib/server/customerSession'

/**
 * GET /api/reviews                 → approved reviews for the home page (first names only)
 * GET /api/reviews?orderId=<uuid>  → { reviewed } for the customer verified on this device
 */
export async function GET(req: NextRequest) {
    const orderId = req.nextUrl.searchParams.get('orderId')

    if (orderId) {
        const customerId = await getSessionCustomerId()
        if (!customerId) return NextResponse.json({ reviewed: false })
        const { data } = await adminSupabase
            .from('reviews').select('id').eq('customer_id', customerId).eq('order_id', orderId).maybeSingle()
        return NextResponse.json({ reviewed: !!data })
    }

    const { data, error } = await adminSupabase
        .from('reviews')
        .select('id, rating, comment, is_approved, created_at, customers ( name )')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20)
    if (error) return NextResponse.json({ reviews: [] })

    // First name only on the public site
    const reviews = (data ?? []).map(r => {
        const c = r.customers as unknown as { name?: string } | null
        return { ...r, customers: { name: c?.name?.trim().split(/\s+/)[0] ?? '' } }
    })
    return NextResponse.json({ reviews })
}

/** POST /api/reviews { orderId, rating, comment } — one review per delivered order, by its owner. */
export async function POST(req: NextRequest) {
    const customerId = await getSessionCustomerId()
    if (!customerId) return NextResponse.json({ error: 'Reviews can be left from the device you ordered on.' }, { status: 401 })

    const { orderId, rating, comment } = await req.json()
    const stars = Number(rating)
    if (typeof orderId !== 'string' || !Number.isInteger(stars) || stars < 1 || stars > 5) {
        return NextResponse.json({ error: 'Choose a rating from 1 to 5.' }, { status: 400 })
    }

    const { data: order } = await adminSupabase
        .from('orders').select('id, status, customer_id').eq('id', orderId).maybeSingle()
    if (!order || order.customer_id !== customerId) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    if (order.status !== 'delivered') return NextResponse.json({ error: 'You can review an order once it has been delivered.' }, { status: 409 })

    const { data: existing } = await adminSupabase
        .from('reviews').select('id').eq('customer_id', customerId).eq('order_id', orderId).maybeSingle()
    if (existing) return NextResponse.json({ error: 'You have already reviewed this order.' }, { status: 409 })

    const { error } = await adminSupabase.from('reviews').insert({
        customer_id: customerId,
        order_id: orderId,
        rating: stars,
        comment: typeof comment === 'string' ? comment.trim().slice(0, 300) || null : null,
        is_approved: true, // auto-approved; owners can remove it from the Reviews panel
    })
    if (error) return NextResponse.json({ error: 'Could not save your review.' }, { status: 500 })
    return NextResponse.json({ success: true })
}
