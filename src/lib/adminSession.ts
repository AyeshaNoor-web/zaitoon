import { cookies } from 'next/headers'
import { adminSupabase } from '@/lib/supabase/admin'

export interface AdminSession {
    token: string
    admin_id: string
    role: 'owner' | 'employee'
    name: string | null
    branch_id: string | null
}

/**
 * Validates the admin_session cookie against the admin_sessions table.
 * Returns null when the cookie is missing, unknown or expired — a cookie
 * merely being present is never enough to authorise an admin action.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
    const token = (await cookies()).get('admin_session')?.value
    if (!token) return null

    const { data, error } = await adminSupabase
        .from('admin_sessions')
        .select('token, admin_id, role, name, branch_id, expires_at')
        .eq('token', token)
        .maybeSingle()

    if (error || !data || new Date(data.expires_at) < new Date()) return null
    return data as AdminSession
}
