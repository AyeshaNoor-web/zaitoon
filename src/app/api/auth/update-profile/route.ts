import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { customerId, name } = await req.json()
  
  if (!customerId || !name) {
    return NextResponse.json({ error: 'Missing customer ID or name' }, { status: 400 })
  }

  const { data: customer, error } = await adminSupabase
    .from('customers')
    .update({ name })
    .eq('id', customerId)
    .select()
    .single()

  if (error || !customer) {
    return NextResponse.json({ error: 'Customer update failed' }, { status: 500 })
  }

  return NextResponse.json({ customer })
}
