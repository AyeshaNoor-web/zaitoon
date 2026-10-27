import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/adminSession'
import { hashPassword, verifyPassword, isPlainText } from '@/lib/utils/password'

/**
 * POST /api/admin/change-password
 * Body: { currentPassword: string, newPassword: string }
 * Requires: valid admin_session cookie
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    // A stolen session cookie alone must not be enough to take over the account
    const { data: user, error: userError } = await adminSupabase
      .from('admin_users')
      .select('password')
      .eq('id', session.admin_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const currentOk = isPlainText(user.password)
      ? user.password === currentPassword
      : await verifyPassword(currentPassword, user.password)

    if (!currentOk) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 })
    }

    const hashed = await hashPassword(newPassword)
    const { error: updateError } = await adminSupabase
      .from('admin_users')
      .update({ password: hashed })
      .eq('id', session.admin_id)

    if (updateError) {
      console.error('Password change failed:', updateError)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
  } catch (err) {
    console.error('Change password error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
