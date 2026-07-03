import { NextResponse } from 'next/server'
import { getDeliverySettings } from '@/lib/api/settings'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const config = await getDeliverySettings()
        return NextResponse.json(config)
    } catch (err) {
        console.error('[API Settings] Failed to load settings:', err)
        return NextResponse.json({ error: 'Failed to load delivery settings' }, { status: 500 })
    }
}
