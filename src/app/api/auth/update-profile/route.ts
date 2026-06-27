import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { customerId, name } = await req.json()
    
    if (!customerId || typeof customerId !== 'string' || !name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Valid customer ID and name required' }, { status: 400 })
    }

    const cleanName = name.trim().slice(0, 100)

    const { data: customer, error } = await adminSupabase
      .from('customers')
      .update({ name: cleanName })
    .eq('id', customerId)
    .select()
    .single()

  if (error || !customer) {
    return NextResponse.json({ error: 'Customer update failed' }, { status: 500 })
  }

  return NextResponse.json({ customer })
  } catch (err: unknown) {
    console.error('Update profile error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
