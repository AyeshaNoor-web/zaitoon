import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { getSessionCustomerId, publicCustomer } from '@/lib/server/customerSession'

/** POST /api/auth/update-profile { name } — renames the customer verified on this device. */
export async function POST(req: NextRequest) {
  try {
    const customerId = await getSessionCustomerId()
    if (!customerId) return NextResponse.json({ error: 'Not signed in on this device' }, { status: 401 })

    const { name } = await req.json()
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Valid name required' }, { status: 400 })
    }

    const { data: customer, error } = await adminSupabase
      .from('customers')
      .update({ name: name.trim().slice(0, 100) })
      .eq('id', customerId)
      .select()
      .single()

    if (error || !customer) return NextResponse.json({ error: 'Customer update failed' }, { status: 500 })
    return NextResponse.json({ customer: publicCustomer(customer) })
  } catch (err) {
    console.error('Update profile error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
