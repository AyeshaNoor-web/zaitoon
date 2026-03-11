import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value

  if (token) {
    // Delete session from DB
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await adminSupabase
      .from('admin_sessions')
      .delete()
      .eq('token', token)
  }

  // Clear all admin cookies
  cookieStore.delete('admin_session')
  cookieStore.delete('admin_role')
  cookieStore.delete('admin_name')

  return NextResponse.json({ success: true })
}
