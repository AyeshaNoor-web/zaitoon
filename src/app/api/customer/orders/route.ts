import { NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { getSessionCustomerId } from '@/lib/server/customerSession'

/** GET /api/customer/orders — order history for the customer verified on this device. */
export async function GET() {
    const customerId = await getSessionCustomerId()
    if (!customerId) return NextResponse.json({ error: 'Not signed in on this device' }, { status: 401 })

    const { data, error } = await adminSupabase
        .from('orders')
        .select('id, order_number, status, total, order_type, created_at, order_items ( name, quantity )')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) return NextResponse.json({ error: 'Could not load orders' }, { status: 500 })
    return NextResponse.json({ orders: data ?? [] })
}
