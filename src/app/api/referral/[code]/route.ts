import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'

/** GET /api/referral/:code — is this invite code real? Returns the referrer's first name only. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const code = (await params).code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32)
    if (!code) return NextResponse.json({ valid: false })

    const { data } = await adminSupabase.from('customers').select('name').eq('referral_code', code).maybeSingle()
    if (!data) return NextResponse.json({ valid: false })
    return NextResponse.json({ valid: true, name: data.name?.trim().split(/\s+/)[0] || null })
}
