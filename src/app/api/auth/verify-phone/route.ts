import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuth } from 'firebase-admin/auth'
import { initAdminApp } from '@/lib/firebase-admin'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { idToken, name } = await req.json()

  // Verify Firebase ID token
  initAdminApp()
  const decoded = await getAuth().verifyIdToken(idToken)
  const phone = decoded.phone_number

  if (!phone) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Get or create customer in Supabase
  let { data: customer } = await adminSupabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single()

  if (!customer) {
    // New customer
    const referralCode = Math.random().toString(36)
      .substring(2, 10).toUpperCase()
    const { data: newCustomer } = await adminSupabase
      .from('customers')
      .insert({
        phone,
        name:          name || 'Customer',
        referral_code: referralCode,
        loyalty_points: 0,
        tier:          'bronze',
      })
      .select()
      .single()
    customer = newCustomer
  } else if (name && customer.name !== name) {
    // Update name if provided
    await adminSupabase
      .from('customers')
      .update({ name })
      .eq('id', customer.id)
    customer.name = name
  }

  return NextResponse.json({ customer })
}
