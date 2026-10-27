import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { setCustomerSession, publicCustomer, normalizePhone } from '@/lib/server/customerSession'

/**
 * POST /api/auth/claim { customerId, phone }
 *
 * One-time migration for browsers that were signed in before device sessions
 * existed: they hold the customer's id + phone in localStorage but no cookie.
 * Both must match. Customer ids are random UUIDs that are no longer readable
 * through the public API once security-lockdown-migration.sql is applied.
 */
export async function POST(req: NextRequest) {
  try {
    const { customerId, phone } = await req.json()
    const normalized = typeof phone === 'string' ? normalizePhone(phone) : null
    if (typeof customerId !== 'string' || !/^[0-9a-f-]{36}$/i.test(customerId) || !normalized) {
      return NextResponse.json({ error: 'Invalid claim' }, { status: 400 })
    }

    const { data: customer } = await adminSupabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('phone', normalized)
      .maybeSingle()

    if (!customer) return NextResponse.json({ error: 'Invalid claim' }, { status: 403 })

    await setCustomerSession(customer.id)
    return NextResponse.json({ customer: publicCustomer(customer) })
  } catch (err) {
    console.error('Claim error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
