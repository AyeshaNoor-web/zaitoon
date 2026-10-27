'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Menu, X, Phone, MapPin, MessageCircle, User, Star, LogOut, ChevronDown, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useLocationStore } from '@/store/useLocationStore'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useHydrated } from '@/store/hydration'
import { translations } from '@/lib/translations'
import { SITE, titleCase } from '@/lib/site'
import CartDrawer from '@/components/cart/CartDrawer'
import LocationModal from '@/components/LocationModal'

export default function Navbar() {
    const pathname = usePathname()
    const hydrated = useHydrated()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [cartOpen, setCartOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [locationModalOpen, setLocationModalOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const itemCount = useCartStore(s => s.itemCount())
    const { nearestBranchName, locationSet } = useLocationStore()
    const { customer, isAuthenticated, signOut, refreshCustomer } = useAuthStore()
    const { language, setLanguage } = useLanguageStore()
    const t = translations[language]

    const overHero = pathname === '/' && !scrolled && !drawerOpen
    const count = hydrated ? itemCount : 0
    const signedIn = hydrated && isAuthenticated && !!customer

    const NAV_LINKS = [
        { label: t.menu, href: '/menu' },
        { label: t.branches, href: '/#branches' },
        { label: t.trackOrder, href: '/order' },
        { label: t.loyalty, href: '/loyalty' },
        { label: t.aboutUs, href: '/about' },
    ]

    const isActive = (href: string) =>
        !href.startsWith('/#') && (pathname === href || pathname.startsWith(`${href}/`))

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    // Keep points/tier fresh once per session start
    const phone = customer?.phone
    useEffect(() => {
        if (hydrated && isAuthenticated && phone) refreshCustomer()
    }, [hydrated, isAuthenticated, phone, refreshCustomer])

    // Escape closes overlays; lock page scroll while the mobile menu is open
    useEffect(() => {
        if (!drawerOpen) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
        document.addEventListener('keydown', onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [drawerOpen])

    const handleAnchor = (e: React.MouseEvent, href: string) => {
        if (href === '/#branches' && pathname === '/') {
            e.preventDefault()
            document.getElementById('branches')?.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const toggleLanguage = () => setLanguage(language === 'en' ? 'ur' : 'en')

    const linkTone = overHero ? 'text-white/80 hover:text-white' : 'text-ink-2 hover:text-ink'
    const iconBtn = `inline-flex h-11 items-center justify-center rounded-full transition-colors ${overHero
        ? 'text-white hover:bg-white/10'
        : 'text-ink hover:bg-paper-2'}`

    return (
        <>
        <header
            className={`fixed inset-x-0 top-0 z-50 h-[var(--nav-h)] transition-[background-color,box-shadow,border-color] duration-300 border-b ${overHero
                ? 'bg-transparent border-transparent'
                : 'bg-paper/90 backdrop-blur-xl border-line shadow-[0_1px_0_rgba(255,255,255,0.6)_inset]'}`}
        >
            <nav aria-label="Main navigation" className="container-page flex h-full items-center gap-4">
                {/* Logo */}
                <Link href="/" aria-label="Zaitoon home" className="relative flex h-full shrink-0 items-center">
                    <Image
                        src={overHero ? '/logo-light.png' : '/logo-dark.png'}
                        alt="Zaitoon"
                        width={583}
                        height={220}
                        priority
                        className="h-9 w-auto lg:h-10"
                    />
                </Link>

                {/* Desktop links */}
                <ul className="mx-auto hidden items-center gap-1 lg:flex">
                    {NAV_LINKS.map(link => {
                        const active = isActive(link.href)
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    onClick={e => handleAnchor(e, link.href)}
                                    aria-current={active ? 'page' : undefined}
                                    className={`relative rounded-full px-3.5 py-2 text-[0.9375rem] font-medium transition-colors ${active
                                        ? overHero ? 'text-white' : 'text-ink'
                                        : linkTone}`}
                                >
                                    {link.label}
                                    {active && (
                                        <motion.span
                                            layoutId="nav-active"
                                            className="absolute inset-x-3.5 -bottom-0.5 h-[2px] rounded-full bg-ember-500"
                                        />
                                    )}
                                </Link>
                            </li>
                        )
                    })}
                </ul>

                {/* Right actions */}
                <div className="ms-auto flex items-center gap-1.5 lg:ms-0">
                    <button
                        onClick={() => setLocationModalOpen(true)}
                        aria-label={locationSet ? 'Change delivery location' : 'Set delivery location'}
                        className={`hidden h-11 max-w-[200px] items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors md:inline-flex ${overHero
                            ? 'text-white/90 hover:bg-white/10'
                            : 'text-ink-2 hover:bg-paper-2 hover:text-ink'}`}
                    >
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                            {hydrated && locationSet && nearestBranchName ? nearestBranchName : 'Set location'}
                        </span>
                    </button>

                    <button
                        onClick={toggleLanguage}
                        className={`${iconBtn} hidden w-11 text-[0.8125rem] font-semibold sm:inline-flex`}
                        aria-label={language === 'en' ? 'اردو میں دیکھیں' : 'Switch to English'}
                        title={language === 'en' ? 'اردو میں دیکھیں' : 'Switch to English'}
                    >
                        {language === 'en' ? 'اردو' : 'EN'}
                    </button>

                    {signedIn && customer && (
                        <div className="relative hidden sm:block" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(o => !o)}
                                aria-expanded={dropdownOpen}
                                aria-haspopup="menu"
                                className={`${iconBtn} gap-2 ps-1.5 pe-3`}
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-olive-600 text-sm font-semibold text-white">
                                    {customer.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="hidden text-sm font-medium xl:inline">{customer.name.split(' ')[0]}</span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        role="menu"
                                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                        transition={{ duration: 0.16 }}
                                        className="absolute end-0 top-[calc(100%+8px)] w-60 origin-top-right rounded-2xl border border-line bg-surface p-1.5 shadow-[var(--shadow-lift)]"
                                    >
                                        <div className="mb-1 rounded-xl bg-paper px-3 py-2.5">
                                            <p className="text-sm font-semibold text-ink">{customer.name}</p>
                                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
                                                <Star className="h-3 w-3 fill-saffron text-saffron" />
                                                <span className="tabular">{customer.loyaltyPoints.toLocaleString()}</span> pts · {titleCase(customer.tier)}
                                            </p>
                                        </div>
                                        <Link role="menuitem" href="/account" onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-paper">
                                            <User className="h-4 w-4 text-ink-2" />{t.myAccount}
                                        </Link>
                                        <Link role="menuitem" href="/loyalty" onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-paper">
                                            <Star className="h-4 w-4 text-ink-2" />{t.loyaltyPoints}
                                        </Link>
                                        <button role="menuitem" onClick={() => { signOut(); setDropdownOpen(false) }}
                                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm font-medium text-danger hover:bg-paper">
                                            <LogOut className="h-4 w-4" />{t.signOut}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Cart */}
                    <button
                        onClick={() => setCartOpen(true)}
                        aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
                        aria-expanded={cartOpen}
                        aria-controls="cart-drawer"
                        className={`relative inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${overHero
                            ? 'bg-white text-ink hover:bg-paper'
                            : 'bg-ink text-paper hover:bg-olive-800'}`}
                    >
                        <ShoppingBag className="h-[18px] w-[18px]" />
                        <span className="hidden sm:inline">{t.cart}</span>
                        <AnimatePresence initial={false}>
                            {count > 0 && (
                                <motion.span
                                    key={count}
                                    initial={{ scale: 0.4, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                                    aria-live="polite"
                                    className="tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ember-500 px-1.5 text-[11px] font-bold text-white"
                                >
                                    {count}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>

                    {/* Mobile menu */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={drawerOpen}
                        className={`${iconBtn} w-11 lg:hidden`}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </nav>
        </header>

            {/* Mobile sheet — rendered outside <header> so its backdrop-filter
                doesn't become the containing block for these fixed overlays */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDrawerOpen(false)}
                            aria-hidden="true"
                            className="fixed inset-0 z-[60] bg-olive-950/50 backdrop-blur-sm lg:hidden"
                        />
                        <motion.div
                            role="dialog"
                            aria-label="Site navigation"
                            aria-modal="true"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                            className="fixed inset-y-0 end-0 z-[70] flex w-[min(88vw,380px)] flex-col bg-paper shadow-[var(--shadow-float)] lg:hidden"
                        >
                            <div className="flex h-[var(--nav-h)] items-center justify-between border-b border-line px-5">
                                <Image src="/logo-dark.png" alt="Zaitoon" width={583} height={220} className="h-8 w-auto" />
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    aria-label="Close menu"
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-paper-2"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <ul className="flex-1 overflow-y-auto px-3 py-4">
                                {[{ label: 'Home', href: '/' }, ...NAV_LINKS].map((link, i) => {
                                    const active = link.href === '/' ? pathname === '/' : isActive(link.href)
                                    return (
                                        <motion.li
                                            key={link.href}
                                            initial={{ opacity: 0, x: 16 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.04 * i + 0.05 }}
                                        >
                                            <Link
                                                href={link.href}
                                                onClick={e => { handleAnchor(e, link.href); setDrawerOpen(false) }}
                                                aria-current={active ? 'page' : undefined}
                                                className={`flex min-h-[52px] items-center justify-between rounded-2xl px-4 font-display text-[1.375rem] font-medium transition-colors ${active ? 'bg-surface text-ink' : 'text-ink-2 hover:bg-surface hover:text-ink'}`}
                                            >
                                                {link.label}
                                                {active && <span className="h-1.5 w-1.5 rounded-full bg-ember-500" />}
                                            </Link>
                                        </motion.li>
                                    )
                                })}
                                {signedIn && (
                                    <li>
                                        <Link href="/account" onClick={() => setDrawerOpen(false)}
                                            className="flex min-h-[52px] items-center rounded-2xl px-4 font-display text-[1.375rem] font-medium text-ink-2 hover:bg-surface hover:text-ink">
                                            {t.myAccount}
                                        </Link>
                                    </li>
                                )}
                            </ul>

                            <div className="space-y-3 border-t border-line p-5">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => { setDrawerOpen(false); setLocationModalOpen(true) }}
                                        className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink"
                                    >
                                        <MapPin className="h-4 w-4 shrink-0 text-olive-600" />
                                        <span className="truncate">{hydrated && locationSet && nearestBranchName ? nearestBranchName : 'Set location'}</span>
                                    </button>
                                    <button
                                        onClick={toggleLanguage}
                                        className="flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink"
                                    >
                                        {language === 'en' ? 'اردو میں دیکھیں' : 'English'}
                                    </button>
                                </div>
                                <Link href="/menu" onClick={() => setDrawerOpen(false)} className="btn-primary w-full">
                                    {t.orderNow} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                                </Link>
                                <div className="flex items-center justify-between pt-1 text-sm">
                                    <a href={SITE.phoneHref} className="inline-flex items-center gap-2 font-medium text-ink-2 hover:text-ink">
                                        <Phone className="h-4 w-4" /> {SITE.phoneDisplay}
                                    </a>
                                    <a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-olive-700 hover:text-ink">
                                        <MessageCircle className="h-4 w-4" /> WhatsApp
                                    </a>
                                </div>
                                {signedIn && (
                                    <button onClick={() => { setDrawerOpen(false); signOut() }} className="w-full pt-1 text-center text-sm font-medium text-danger">
                                        {t.signOut}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

            {locationModalOpen && <LocationModal onClose={() => setLocationModalOpen(false)} />}
        </>
    )
}
