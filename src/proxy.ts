import { NextRequest, NextResponse } from 'next/server'

// Routes ONLY owner can access
const OWNER_ONLY = [
  '/admin/analytics',
  '/admin/settings',
]

// Public admin routes (no session needed)
const PUBLIC_ADMIN = [
  '/admin/login',
]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only run on /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Allow login page
  if (PUBLIC_ADMIN.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const sessionToken = req.cookies.get('admin_session')?.value

  // No session → redirect to login
  if (!sessionToken) {
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Validate session via internal API
  // We can't use Supabase directly in Edge middleware easily,
  // so we read the role from a separate cookie set at login time
  const adminRole = req.cookies.get('admin_role')?.value

  // If no role cookie, let the page load — it will call /api/admin/me
  // and handle redirect client-side
  if (!adminRole) {
    return NextResponse.next()
  }

  // Employee trying to access owner-only route
  if (adminRole === 'employee') {
    const isBlocked = OWNER_ONLY.some(r => pathname.startsWith(r))
    if (isBlocked) {
      return NextResponse.redirect(new URL('/admin/orders', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
