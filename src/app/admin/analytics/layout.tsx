import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
    const sessionToken = (await cookies()).get('admin_session')?.value
    if (!sessionToken) redirect('/admin/orders')

    const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: session } = await adminSupabase
        .from('admin_sessions')
        .select('role')
        .eq('token', sessionToken)
        .single()

    if (!session || session.role !== 'owner') {
        redirect('/admin/orders')
    }

    return <>{children}</>
}
