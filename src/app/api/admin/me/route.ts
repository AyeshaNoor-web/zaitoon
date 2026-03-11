import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value

    if (!token) {
      return NextResponse.json({ role: null, name: null }, { status: 401 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: session, error } = await adminSupabase
      .from('admin_sessions')
      .select('role, name, expires_at')
      .eq('token', token)
      .single()

    if (error || !session) {
      return NextResponse.json({ role: null, name: null }, { status: 401 })
    }

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await adminSupabase
        .from('admin_sessions')
        .delete()
        .eq('token', token)
      return NextResponse.json({ role: null, name: null }, { status: 401 })
    }

    return NextResponse.json({
      role: session.role,
      name: session.name,
    })

  } catch (err) {
    console.error('/api/admin/me error:', err)
    return NextResponse.json({ role: null, name: null }, { status: 500 })
  }
}
