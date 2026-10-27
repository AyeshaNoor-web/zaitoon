import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { adminSupabase } from '@/lib/supabase/admin'
import { getSessionCustomerId, setCustomerSession, publicCustomer, normalizePhone } from '@/lib/server/customerSession'

/**
 * POST /api/auth/lookup-customer  { phone, name }
 *
 * - Phone belongs to this device's verified customer → full profile.
 * - Phone is new → account is created and this device becomes verified.
 * - Phone belongs to someone else (or to the same person on a new device)
 *   → { exists: true, verified: false } and nothing else. No name, no points.
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, name } = await req.json()
    const normalized = typeof phone === 'string' ? normalizePhone(phone) : null
    if (!normalized) {
      return NextResponse.json({ error: 'Valid Pakistani mobile number required' }, { status: 400 })
    }

    const { data: existing, error: findError } = await adminSupabase
      .from('customers')
      .select('*')
      .eq('phone', normalized)
      .maybeSingle()
    if (findError) throw findError

    if (existing) {
      const sessionId = await getSessionCustomerId()
      if (sessionId !== existing.id) {
        return NextResponse.json({ verified: false, exists: true })
      }
      const cleanName = typeof name === 'string' ? name.trim().slice(0, 100) : ''
      if (cleanName && cleanName !== existing.name) {
        await adminSupabase.from('customers').update({ name: cleanName }).eq('id', existing.id)
        existing.name = cleanName
      }
      return NextResponse.json({ verified: true, isNew: false, customer: publicCustomer(existing) })
    }

    const { data: created, error } = await adminSupabase
      .from('customers')
      .insert({
        phone: normalized,
        name: (typeof name === 'string' && name.trim().slice(0, 100)) || 'Customer',
        referral_code: randomUUID().split('-')[0].toUpperCase(),
        loyalty_points: 0,
        tier: 'bronze',
        total_orders: 0,
        total_spent: 0,
      })
      .select()
      .single()
    if (error) throw error

    await setCustomerSession(created.id)
    return NextResponse.json({ verified: true, isNew: true, customer: publicCustomer(created) })
  } catch (err) {
    console.error('Customer lookup error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
