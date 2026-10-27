import 'server-only'
import { createHmac, createHash, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { adminSupabase } from '@/lib/supabase/admin'

// A customer is "verified" on a device only when it holds this signed, httpOnly
// cookie. It is issued when the account is created (first order / first lookup)
// on that device. Knowing a phone number alone is never enough to see or spend
// someone's points.

const COOKIE = 'zt_customer'
const ORDERS_COOKIE = 'zt_orders'
const MAX_AGE = 60 * 60 * 24 * 365

function secret() {
    const explicit = process.env.CUSTOMER_SESSION_SECRET
    if (explicit) return explicit
    const base = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!base) throw new Error('CUSTOMER_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set')
    return createHash('sha256').update(`zt-customer-session:${base}`).digest('hex')
}

function sign(payload: string) {
    return createHmac('sha256', secret()).update(payload).digest('base64url')
}

function verifySigned(value: string | undefined): string | null {
    if (!value) return null
    const i = value.lastIndexOf('.')
    if (i < 0) return null
    const payload = value.slice(0, i)
    const expected = Buffer.from(sign(payload))
    const given = Buffer.from(value.slice(i + 1))
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
    return payload
}

const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE,
}

export async function setCustomerSession(customerId: string) {
    const exp = Math.floor(Date.now() / 1000) + MAX_AGE
    const payload = `${customerId}.${exp}`
    ;(await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, cookieOpts)
}

export async function clearCustomerSession() {
    (await cookies()).delete(COOKIE)
}

/** The customer id this device is verified for, or null. */
export async function getSessionCustomerId(): Promise<string | null> {
    const payload = verifySigned((await cookies()).get(COOKIE)?.value)
    if (!payload) return null
    const [id, exp] = payload.split('.')
    if (!id || !exp || Number(exp) < Date.now() / 1000) return null
    return id
}

export async function getSessionCustomer() {
    const id = await getSessionCustomerId()
    if (!id) return null
    const { data } = await adminSupabase.from('customers').select('*').eq('id', id).maybeSingle()
    return data
}

/** Orders placed from this device, so their tracking page can show full details. */
export async function getDeviceOrderIds(): Promise<string[]> {
    const payload = verifySigned((await cookies()).get(ORDERS_COOKIE)?.value)
    return payload ? payload.split(',').filter(Boolean) : []
}

export async function rememberDeviceOrder(orderId: string) {
    const ids = [orderId, ...(await getDeviceOrderIds()).filter(id => id !== orderId)].slice(0, 15)
    const payload = ids.join(',')
    ;(await cookies()).set(ORDERS_COOKIE, `${payload}.${sign(payload)}`, cookieOpts)
}

/** Shape sent to the browser — only for a verified device. */
export function publicCustomer(c: Record<string, unknown>) {
    return {
        id: c.id,
        phone: c.phone,
        name: c.name,
        loyalty_points: c.loyalty_points,
        tier: c.tier,
        referral_code: c.referral_code,
        total_orders: c.total_orders,
    }
}

export function normalizePhone(raw: string): string | null {
    const digits = (raw ?? '').replace(/\D/g, '')
    if (digits.startsWith('03') && digits.length === 11) return `+92${digits.slice(1)}`
    if (digits.startsWith('923') && digits.length === 12) return `+${digits}`
    if (digits.startsWith('3') && digits.length === 10) return `+92${digits}`
    return null
}
