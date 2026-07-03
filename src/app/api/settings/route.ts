import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDeliverySettings, clearDeliverySettingsCache } from '@/lib/api/settings'
import { adminSupabase } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const config = await getDeliverySettings()
        return NextResponse.json(config)
    } catch (err) {
        console.error('[API Settings GET] Failed:', err)
        return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        // 1. Verify admin session from cookies
        const cookieStore = await cookies()
        const token = cookieStore.get('admin_session')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: session, error: sessionErr } = await adminSupabase
            .from('admin_sessions')
            .select('role, name, expires_at')
            .eq('token', token)
            .single()

        if (sessionErr || !session || session.role !== 'owner') {
            return NextResponse.json({ error: 'Unauthorized: Owner access required' }, { status: 401 })
        }

        if (new Date(session.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Session expired' }, { status: 401 })
        }

        // 2. Parse request payload
        const { settingsRows } = await req.json()
        if (!Array.isArray(settingsRows)) {
            return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 })
        }

        // 3. Upsert using adminSupabase (bypasses RLS safely)
        const { error: upsertErr } = await adminSupabase
            .from('settings')
            .upsert(settingsRows, { onConflict: 'key' })

        if (upsertErr) {
            console.error('[API Settings POST] Upsert failed:', upsertErr)
            return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
        }

        // 4. Clear memory cache immediately
        clearDeliverySettingsCache()

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[API Settings POST] Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
