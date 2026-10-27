import { NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { getSessionCustomer, publicCustomer } from '@/lib/server/customerSession'

/** GET /api/customer/loyalty — balance, tier and recent point history for this device's customer. */
export async function GET() {
    const customer = await getSessionCustomer()
    if (!customer) return NextResponse.json({ error: 'Not signed in on this device' }, { status: 401 })

    const { data: history } = await adminSupabase
        .from('loyalty_transactions')
        .select('id, created_at, description, points, type')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(20)

    return NextResponse.json({ customer: publicCustomer(customer), history: history ?? [] })
}
