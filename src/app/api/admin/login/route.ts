import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Artificial delay — brute force protection
    await new Promise(r => setTimeout(r, 400))

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find user by username + password + active
    const { data: adminUser, error } = await adminSupabase
      .from('admin_users')
      .select('id, username, role, name, is_active')
      .eq('username', username.toLowerCase().trim())
      .eq('password', password.trim())
      .eq('is_active', true)
      .single()

    if (error || !adminUser) {
      console.log('Login failed for:', username)
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Generate session token
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()

    // Save session to DB
    const { error: sessionError } = await adminSupabase
      .from('admin_sessions')
      .insert({
        token:      sessionToken,
        admin_id:   adminUser.id,
        role:       adminUser.role,
        name:       adminUser.name,
        expires_at: expiresAt,
      })

    if (sessionError) {
      console.error('Session creation failed:', sessionError)
      return NextResponse.json(
        { error: 'Login failed. Please try again.' },
        { status: 500 }
      )
    }

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   60 * 60 * 8,
      path:     '/',
    })

    console.log('Login success:', adminUser.username, adminUser.role)

    return NextResponse.json({
      success: true,
      role:    adminUser.role,
      name:    adminUser.name,
    })

  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
