'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, UtensilsCrossed, BarChart3, Settings, ArrowLeft, Menu, X, LogOut, Star } from 'lucide-react'
import { useAdminRole } from '@/hooks/useAdminRole'

const NAV = [
    { label: 'Live Orders', href: '/admin/orders', icon: ClipboardList, roles: ['owner', 'employee'] },
    { label: 'Menu Manager', href: '/admin/menu', icon: UtensilsCrossed, roles: ['owner', 'employee'] },
    { label: 'Reviews', href: '/admin/reviews', icon: Star, roles: ['owner'] },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, roles: ['owner'] },
    { label: 'Settings', href: '/admin/settings', icon: Settings, roles: ['owner'] },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { role, name } = useAdminRole()
    const [open, setOpen] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

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
        <aside aria-label="Admin sidebar" className="bg-[var(--green-mid)] h-full flex flex-col border-r-[2px] border-[var(--linen)] shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
            {/* Logo */}
            <header className="p-6 border-b border-[rgba(253,248,240,0.1)]">
                <div className="flex items-center gap-3">
                    <Image src="/logo-en.png" alt="Zaitoon logo" width={120} height={32} priority className="h-8 w-auto mix-blend-screen" />
                    <span className="bg-[var(--orange-warm)] text-[#0D2015] text-[10px] uppercase tracking-[0.1em] font-[700] px-[8px] py-[2px] rounded-sm">Admin</span>
                </div>
            </header>

            {/* Nav */}
            <nav aria-label="Admin navigation" className="flex-1 p-4 space-y-2">
                {NAV.filter(item => item.roles.includes(role ?? '')).map(item => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex items-center gap-3 px-4 py-3 rounded-[6px] text-[14px] font-[600] transition-colors border-l-[3px] ${isActive
                                ? 'bg-[#0D2015] text-[var(--cream)] border-[var(--orange-warm)] shadow-inner'
                                : 'border-transparent text-[rgba(253,248,240,0.6)] hover:text-[var(--cream)] hover:bg-[var(--green-dark)]'
                                }`}
                        >
                            <Icon className="w-[18px] h-[18px]" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer — logout + back to site */}
            <footer className="p-5 border-t border-[rgba(253,248,240,0.1)] space-y-2">
                {role && (
                    <div className="flex items-center gap-2 mb-4 px-2 py-1.5 rounded-md bg-white/5">
                        <span className="text-[18px]">👤</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-white truncate">{name}</p>
                            <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-bold ${role === 'owner' ? 'bg-[var(--orange-warm)] text-[#0D2015]' : 'bg-[var(--green-pale)] text-[var(--cream)]'}`}>
                                {role}
                            </span>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center gap-2 text-[13px] text-red-400 hover:text-red-300 font-[600] transition-colors w-full justify-center py-2 rounded-[4px] hover:bg-red-900/20 disabled:opacity-50"
                    aria-label="Sign out of admin panel"
                >
                    <LogOut className="w-4 h-4" />
                    {loggingOut ? 'Signing out…' : 'Sign Out'}
                </button>

                <Link
                    href="/"
                    className="flex items-center gap-2 text-[13px] text-[var(--stone)] hover:text-[var(--orange-pale)] font-[500] transition-colors border border-transparent hover:border-[var(--orange-pale)] w-full justify-center py-2 rounded-[4px]"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Application
                </Link>
            </footer>
        </aside>
    )

    return (
        <div className="flex h-screen bg-[#0D2015] overflow-hidden">
            {/* Desktop sidebar */}
            <div className="hidden lg:block w-[260px] shrink-0 h-full">{sidebar}</div>

            {/* Mobile top bar */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-[60px] bg-[var(--green-mid)] border-b border-[var(--linen)] flex items-center justify-between px-4">
                <button
                    onClick={() => setOpen(true)}
                    aria-label="Open admin menu"
                    className="text-[var(--cream)] hover:text-[var(--orange-warm)] p-2 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <span className="font-display text-[18px] text-[var(--orange-pale)] font-[700]">Admin</span>
                </div>
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    aria-label="Sign out"
                    className="text-red-400 hover:text-red-300 p-2 transition-colors disabled:opacity-50"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            {/* Mobile drawer */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            aria-hidden="true"
                            className="fixed inset-0 z-[60] bg-black/70 lg:hidden"
                        />
                        <motion.div
                            role="dialog"
                            aria-label="Mobile admin navigation"
                            aria-modal="true"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed left-0 top-0 bottom-0 z-[70] w-[260px] lg:hidden"
                        >
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Close admin menu"
                                className="absolute top-[20px] right-[16px] text-[var(--stone)] hover:text-[var(--cream)] w-8 h-8 flex items-center justify-center bg-[#0D2015] rounded-[4px] z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            {sidebar}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main content */}
            <main role="main" className="flex-1 overflow-y-auto pt-[60px] lg:pt-0">
                {children}
            </main>
        </div>
    )
}
