import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'
import { ADMIN_OPS } from '@/lib/server/adminOps'
import { OrderError } from '@/lib/server/orders'

/** POST /api/admin/rpc { op, args } — the single entry point for admin data access. */
export async function POST(req: NextRequest) {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 })

    let body: { op?: unknown; args?: unknown }
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

    const op = typeof body.op === 'string' ? ADMIN_OPS[body.op] : undefined
    if (!op) return NextResponse.json({ error: 'Unknown operation' }, { status: 400 })
    if (!op.roles.includes(session.role)) return NextResponse.json({ error: 'Only the owner can do that.' }, { status: 403 })

    try {
        const data = await op.run(Array.isArray(body.args) ? body.args : [], session)
        return NextResponse.json({ data: data ?? null })
    } catch (err) {
        if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: err.status })
        const message = (err as { message?: string })?.message ?? 'Request failed'
        console.error(`[admin rpc] ${body.op} failed:`, err)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
