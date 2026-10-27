import { NextResponse } from 'next/server'
import { getSessionCustomer, publicCustomer } from '@/lib/server/customerSession'

/** GET /api/auth/me — the customer this device is verified for. */
export async function GET() {
  const customer = await getSessionCustomer()
  if (!customer) return NextResponse.json({ customer: null }, { status: 401 })
  return NextResponse.json({ customer: publicCustomer(customer) })
}
