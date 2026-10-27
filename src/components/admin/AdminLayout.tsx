'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, UtensilsCrossed, BarChart3, Settings, ArrowLeft, Menu, X, LogOut, Star, FileText, LayoutDashboard } from 'lucide-react'
import { useAdminRole } from '@/hooks/useAdminRole'

const NAV = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['owner'] },
    { label: 'Live orders', href: '/admin/orders', icon: ClipboardList, roles: ['owner', 'employee'] },
    { label: 'Menu', href: '/admin/menu', icon: UtensilsCrossed, roles: ['owner', 'employee'] },
    { label: 'Content', href: '/admin/content', icon: FileText, roles: ['owner'] },
    { label: 'Reviews', href: '/admin/reviews', icon: Star, roles: ['owner'] },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, roles: ['owner'] },
    { label: 'Settings', href: '/admin/settings', icon: Settings, roles: ['owner'] },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { role, name, loading } = useAdminRole()
    const [open, setOpen] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    // Employees can't open owner-only screens, even by typing the URL
    const current = NAV.find(n => n.href === pathname)
    const blocked = !loading && role === 'employee' && current && !current.roles.includes('employee')
    useEffect(() => {
        if (blocked) router.replace('/admin/orders')
    }, [blocked, router])

    const handleLogout = async () => {
        setLoggingOut(true)
        try {
            await fetch('/api/admin/logout', { method: 'POST' })
            document.cookie = 'admin_role=; path=/; max-age=0'
            document.cookie = 'admin_name=; path=/; max-age=0'
        } finally {
            router.push('/admin/login')
        }
    }

    const sidebar = (
        <aside aria-label="Admin sidebar" className="flex h-full flex-col bg-olive-900 text-paper">
            <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-6">
                <Image src="/logo-light.png" alt="Zaitoon" width={583} height={220} priority className="h-8 w-auto" />
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/80">Admin</span>
            </div>

            <nav aria-label="Admin navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
                {NAV.filter(item => role && item.roles.includes(role)).map(item => {
                    const active = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            aria-current={active ? 'page' : undefined}
                            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${active
                                ? 'bg-paper text-ink'
                                : 'text-paper/70 hover:bg-white/5 hover:text-paper'}`}
                        >
                            <item.icon className={`h-[18px] w-[18px] ${active ? 'text-ember-600' : ''}`} />
                            {item.label}
                        </Link>
                    )
                })}
                {loading && [0, 1, 2, 3].map(i => <div key={i} className="mx-1 h-10 animate-pulse rounded-xl bg-white/5" />)}
            </nav>

            <div className="space-y-1 border-t border-white/10 p-3">
                {role && (
                    <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-paper text-sm font-semibold text-olive-800">
                            {(name || '?').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{name}</p>
                            <p className="text-xs capitalize text-paper/55">{role}</p>
                        </div>
                    </div>
                )}
                <Link href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-paper/70 hover:bg-white/5 hover:text-paper">
                    <ArrowLeft className="h-4 w-4" /> View website
                </Link>
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#F4A78E] hover:bg-white/5 disabled:opacity-50"
                >
                    <LogOut className="h-4 w-4" /> {loggingOut ? 'Signing out…' : 'Sign out'}
                </button>
            </div>
        </aside>
    )

    return (
        <div className="flex h-[100dvh] overflow-hidden bg-paper text-ink">
            <div className="hidden w-[248px] shrink-0 lg:block">{sidebar}</div>

            <header className="fixed inset-x-0 top-0 z-50 flex h-[60px] items-center justify-between border-b border-line bg-paper/90 px-3 backdrop-blur-xl lg:hidden">
                <button
                    onClick={() => setOpen(true)}
                    aria-label="Open admin menu"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-paper-2"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <Image src="/logo-dark.png" alt="Zaitoon" width={583} height={220} className="h-7 w-auto" />
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    aria-label="Sign out"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-danger hover:bg-paper-2 disabled:opacity-50"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </header>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            aria-hidden="true"
                            className="fixed inset-0 z-[60] bg-olive-950/50 backdrop-blur-sm lg:hidden"
                        />
                        <motion.div
                            role="dialog"
                            aria-label="Admin navigation"
                            aria-modal="true"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                            className="fixed inset-y-0 start-0 z-[70] w-[264px] lg:hidden"
                        >
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Close admin menu"
                                className="absolute end-3 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full text-paper/80 hover:bg-white/10"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            {sidebar}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <main id="main" className="flex-1 overflow-y-auto pt-[60px] lg:pt-0">
                {blocked ? null : children}
            </main>
        </div>
    )
}
