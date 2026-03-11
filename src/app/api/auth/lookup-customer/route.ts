import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { phone, name } = await req.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number required' },
        { status: 400 }
      )
    }

    // Try to find existing customer
    const { data: existing } = await adminSupabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle()  // Using maybeSingle to avoid errors if not found

    if (existing) {
      // Returning customer — update name if provided and different
      if (name && name.trim() && existing.name !== name.trim()) {
        await adminSupabase
          .from('customers')
          .update({ name: name.trim() })
          .eq('id', existing.id)
        existing.name = name.trim()
      }
      return NextResponse.json({ customer: existing, isNew: false })
    }

    // New customer — create account silently
    const referralCode = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase()

    const { data: newCustomer, error } = await adminSupabase
      .from('customers')
      .insert({
        phone,
        name:           name?.trim() || 'Customer',
        referral_code:  referralCode,
        loyalty_points: 0,
        tier:           'bronze',
        total_orders:   0,
        total_spent:    0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ customer: newCustomer, isNew: true })

  } catch (err: any) {
    console.error('Customer lookup error:', err)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
