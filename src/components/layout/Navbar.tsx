'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Menu, X, Phone, MapPin } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useLocationStore } from '@/store/useLocationStore'
import CartDrawer from '@/components/cart/CartDrawer'
import { useLanguageStore } from '@/store/useLanguageStore'
import { translations } from '@/lib/translations'
import { MessageCircle } from 'lucide-react'
import LocationModal from '@/components/LocationModal'
import { User, Star, Languages, ChevronRight } from 'lucide-react'
export default function Navbar() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [cartOpen, setCartOpen] = useState(false)
    const [badgeBounce, setBadgeBounce] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const pathname = usePathname()
    const itemCount = useCartStore(s => s.itemCount())
    const { nearestBranchName, locationSet } = useLocationStore()
    const prevCount = useRef(itemCount)
    const { customer, isAuthenticated, signOut, refreshCustomer } = useAuthStore()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { language, setLanguage, isRTL } = useLanguageStore()
    const [locationModalOpen, setLocationModalOpen] = useState(false)
    const t = translations[language]

    const NAV_LINKS = [
        { label: t.menu, href: '/menu' },
        { label: t.branches, href: '/#branches' },
        { label: t.trackOrder, href: '/order' },
        { label: t.loyalty, href: '/loyalty' },
    ]

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    useEffect(() => {
        if (isAuthenticated && mounted && customer?.phone) refreshCustomer(customer.phone)
    }, [isAuthenticated, mounted, refreshCustomer, customer?.phone])

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        if (itemCount > prevCount.current) {
            setBadgeBounce(true)
            setTimeout(() => setBadgeBounce(false), 550)
        }
        prevCount.current = itemCount
    }, [itemCount])

    const navListVariants = {
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } }
    }

    const navItemVariants = {
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <header
            role="banner"
            className={`fixed top-0 left-0 right-0 z-50 h-[66px] lg:h-[76px] border-b border-[rgba(106,126,63,0.30)] transition-all duration-500 ${
                scrolled
                    ? 'backdrop-blur-2xl shadow-[0_10px_36px_rgba(76,92,45,0.24)]'
                    : ''
            }`}
            style={{
                background: `linear-gradient(180deg, rgba(106, 126, 63, ${scrolled ? '0.92' : '0.96'}) 0%, rgba(90, 109, 53, ${scrolled ? '0.90' : '0.94'}) 100%)`,
            }}
        >
            <nav aria-label="Main navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

                {/* Logo */}
                <Link href="/" aria-label="Zaitoon — go to homepage" className="shrink-0 flex items-center h-full">
                    <Image src="/logo-en.png" alt="Zaitoon logo" width={164} height={46} priority style={{ mixBlendMode: 'screen', height: '42px', width: 'auto' }} />
                </Link>

                {/* Desktop Nav Links */}
                <ul role="list" className="hidden lg:flex items-center gap-8 h-full">
                    {NAV_LINKS.map(link => {
                        const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href) && !link.href.startsWith('/#'))
                        const isBranchesLink = link.href === '/#branches'
                        return (
                            <li key={link.href} className="h-full flex items-center">
                                <Link
                                    href={link.href}
                                    aria-current={active ? 'page' : undefined}
                                    onClick={isBranchesLink ? (e) => {
                                        if (pathname === '/') {
                                            e.preventDefault()
                                            document.getElementById('branches')?.scrollIntoView({ behavior: 'smooth' })
                                        }
                                    } : undefined}
                                    className={`relative px-1 text-[12px] font-[600] tracking-[0.1em] uppercase transition-all duration-300 flex items-center h-full border-b-2 ${
                                        active
                                        ? 'text-[var(--green-light)] border-[var(--green-base)]'
                                        : 'text-[rgba(251,246,246,0.75)] hover:text-[var(--cream)] border-transparent hover:border-[var(--green-light)]'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        )
                    })}
                </ul>

                {/* Right Actions */}
                <div className="flex items-center gap-4 relative">
                    {/* Location Display */}
                    {mounted && (
                        <button
                            onClick={() => setLocationModalOpen(true)}
                            aria-label={locationSet ? 'Change delivery location' : 'Set delivery location'}
                            className={`hidden md:flex items-center gap-1.5 text-[12px] font-[600] px-3 py-2 rounded-lg border border-[rgba(251,246,246,0.35)] transition-all hover:bg-[rgba(251,246,246,0.15)] ${locationSet ? 'text-[var(--cream)]' : 'text-[rgba(251,246,246,0.8)]'}`}
                            title="Set your delivery location"
                        >
                            <MapPin className="w-4 h-4" />
                            <span className="truncate max-w-[130px]">
                                {locationSet && nearestBranchName ? nearestBranchName : 'Set Location'}
                            </span>
                        </button>
                    )}

                    {/* WhatsApp Button */}
                    <a
                        href="https://wa.me/923291330234"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden md:flex items-center gap-2 bg-[rgba(251,246,246,0.18)] text-[var(--cream)] px-4 py-2 rounded-full text-[13px] font-bold hover:bg-[rgba(251,246,246,0.28)] transition-all shadow-md group"
                    >
                        <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>{t.whatsappUs}</span>
                    </a>

                    {/* Language Toggle */}
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
                        className="w-[38px] h-[38px] rounded-full border border-[rgba(251,246,246,0.35)] text-[12px] font-bold text-[var(--cream)] hover:bg-[rgba(251,246,246,0.18)] transition-colors flex items-center justify-center"
                        title={language === 'en' ? 'اردو میں دیکھیں' : 'Switch to English'}
                    >
                        {language === 'en' ? 'اردو' : 'EN'}
                    </button>

                    {mounted && isAuthenticated && customer && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(251,246,246,0.18)',
                                    border: '1px solid rgba(251,246,246,0.35)',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    color: 'var(--cream)',
                                    fontSize: 13,
                                    fontWeight: 600,
                                }}
                            >
                                {/* Avatar circle */}
                                <span style={{
                                    width: 32, height: 32,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--green-dark), var(--green-base))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                }}>
                                    {customer.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="hidden sm:inline">{customer.name.split(' ')[0]}</span>
                                <span style={{ fontSize: 10 }}>▾</span>
                            </button>

                            {/* Dropdown */}
                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: 8,
                                            backgroundColor: '#FAFFF8',
                                            border: '1px solid rgba(156,175,136,0.35)',
                                            borderRadius: 10,
                                            padding: 8,
                                            minWidth: 180,
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                            zIndex: 1000,
                                        }}
                                    >
                                        {/* Points summary */}
                                        <div style={{
                                            padding: '8px 12px',
                                            borderBottom: '1px solid rgba(156,175,136,0.30)',
                                            marginBottom: 4,
                                        }}>
                                            <p style={{ fontSize: 12, color: '#78716C', margin: 0 }}>
                                                <Star className="w-3.5 h-3.5 inline mr-1" />{customer.loyaltyPoints} points
                                            </p>
                                            <p style={{ fontSize: 11, color: '#78716C', margin: '2px 0 0' }}>
                                                {customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)} member
                                            </p>
                                        </div>

                                        <Link href="/account" onClick={() => setDropdownOpen(false)} className="block px-3 py-2 text-[13px] font-[600] text-[var(--charcoal)] hover:bg-[var(--cream)] rounded transition-colors">
                                            <User className="w-3.5 h-3.5 inline mr-1" />{t.myAccount}
                                        </Link>
                                        <Link href="/loyalty" onClick={() => setDropdownOpen(false)} className="block px-3 py-2 text-[13px] font-[600] text-[var(--charcoal)] hover:bg-[var(--cream)] rounded transition-colors">
                                            <Star className="w-3.5 h-3.5 inline mr-1" />{t.loyaltyPoints}
                                        </Link>
                                        <button
                                            onClick={() => { signOut(); setDropdownOpen(false) }}
                                            style={{
                                                width: '100%', border: 'none',
                                                backgroundColor: 'transparent', cursor: 'pointer',
                                                color: '#B91C1C', textAlign: (isRTL ? 'right' : 'left'),
                                                padding: '8px 12px', fontSize: 13, fontWeight: 600
                                            }}
                                        >
                                            {t.signOut}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Cart Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        onClick={() => setCartOpen(!cartOpen)}
                        aria-label={`Shopping cart, ${mounted ? itemCount : 0} items`}
                        aria-expanded={cartOpen}
                        aria-controls="cart-drawer"
                        className="relative rounded-[10px] px-4 py-2.5 font-[700] text-[13px] tracking-[0.06em] flex items-center gap-2 transition-all min-h-[46px] overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #B8625E 0%, #A6524F 100%)',
                            color: '#fff',
                            boxShadow: '0 6px 18px rgba(184,98,94,0.36)',
                        }}
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span className="hidden sm:inline">{t.cart}</span>
                        {mounted && itemCount > 0 && (
                            <motion.span
                                key={itemCount}
                                initial={{ scale: 1 }}
                                animate={badgeBounce ? { scale: [1, 1.6, 0.85, 1.1, 1] } : { scale: 1 }}
                                transition={{ duration: 0.35, times: [0, 0.25, 0.5, 0.75, 1] }}
                                aria-live="polite"
                                className="font-[700]"
                            >
                                ({itemCount})
                            </motion.span>
                        )}
                        {mounted && itemCount === 0 && <span>(0)</span>}
                    </motion.button>

                    {/* Mobile Hamburger */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        onClick={() => setDrawerOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={drawerOpen}
                        className="lg:hidden w-[44px] h-[44px] flex items-center justify-center text-[var(--cream)] hover:text-[var(--green-light)] transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </motion.button>
                </div>
            </nav>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDrawerOpen(false)}
                            aria-hidden="true"
                            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                        />

                        {/* Drawer */}
                        <motion.div
                            role="dialog"
                            aria-label="Mobile navigation"
                            aria-modal="true"
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed left-0 top-0 bottom-0 z-[70] w-[280px] shadow-2xl flex flex-col pt-4 border-t-[3px] border-[var(--green-base)]"
                            style={{ background: '#24271F' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-2 mb-4">
                                <Image src="/logo-en.png" alt="Zaitoon logo" width={140} height={38} priority style={{ mixBlendMode: 'screen', height: '36px', width: 'auto' }} />
                                <button onClick={() => setDrawerOpen(false)}
                                    aria-label="Close menu"
                                    className="w-[44px] h-[44px] flex items-center justify-center text-[var(--cream)] border border-[rgba(156,175,136,0.30)] rounded-[8px] hover:bg-[rgba(156,175,136,0.15)] transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Links */}
                            <motion.ul
                                role="list"
                                variants={navListVariants}
                                initial="hidden"
                                animate="show"
                                className="flex-1 px-4 space-y-2 overflow-y-auto"
                            >
                                {[{ label: 'Home', href: '/' }, ...NAV_LINKS].map((link) => {
                                    const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href) && !link.href.startsWith('/#'))
                                    const isBranchesLink = link.href === '/#branches'
                                    return (
                                        <motion.li key={link.href} variants={navItemVariants}>
                                            <Link
                                                href={link.href}
                                                onClick={(e) => {
                                                    setDrawerOpen(false)
                                                    if (isBranchesLink && pathname === '/') {
                                                        e.preventDefault()
                                                        document.getElementById('branches')?.scrollIntoView({ behavior: 'smooth' })
                                                    }
                                                }}
                                                aria-current={active ? 'page' : undefined}
                                                className={`flex items-center min-h-[48px] px-4 font-[600] text-[14px] uppercase tracking-[0.05em] transition-all border-l-[3px] rounded-r-[8px] ${active
                                                    ? 'bg-[rgba(156,175,136,0.22)] text-[var(--green-light)] border-[var(--green-base)]'
                                                    : 'text-[rgba(250,243,224,0.60)] border-transparent hover:bg-[rgba(156,175,136,0.12)] hover:text-[var(--cream)]'
                                                    }`}
                                            >
                                                {link.label}
                                            </Link>
                                        </motion.li>
                                    )
                                })}
                                {/* Mobile WhatsApp */}
                                <motion.li variants={navItemVariants}>
                                    <a
                                        href="https://wa.me/923291330234"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 min-h-[48px] px-4 font-[600] text-[var(--green-light)]"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        {t.whatsappUs}
                                    </a>
                                </motion.li>
                                {/* Mobile Language Switcher */}
                                <motion.li variants={navItemVariants}>
                                    <button
                                        onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
                                        className="flex items-center gap-3 min-h-[48px] px-4 font-[600] text-[14px] text-[var(--green-light)]"
                                    >
                                        <Languages className="w-5 h-5" /> {language === 'en' ? 'اردو میں دیکھیں' : 'Switch to English'}
                                    </button>
                                </motion.li>
                            </motion.ul>

                            {/* Bottom */}
                            <div className="p-5 border-t border-[rgba(156,175,136,0.24)] space-y-4">
                                {mounted && (
                                    <button
                                        onClick={() => { setDrawerOpen(false); setLocationModalOpen(true) }}
                                        className="flex items-center justify-center gap-2 text-[14px] font-[600] text-[rgba(250,243,224,0.8)] py-4 border-b border-[rgba(156,175,136,0.24)] mb-2 text-center w-full"
                                    >
                                        <MapPin className="w-4 h-4 text-[var(--green-base)]" />
                                        <span>{locationSet && nearestBranchName ? `Nearest: ${nearestBranchName}` : 'Set Location'}</span>
                                    </button>
                                )}
                                {mounted && isAuthenticated && customer ? (
                                    <div className="flex flex-col gap-2 mb-2">
                                        <Link href="/account" onClick={() => setDrawerOpen(false)} className="text-[14px] font-[600] text-[var(--green-light)] hover:text-white text-center py-2">
                                            {t.myAccount}
                                        </Link>
                                        <button onClick={() => { setDrawerOpen(false); signOut() }} className="text-[14px] text-[rgba(250,243,224,0.6)] hover:text-red-400 text-center pb-2">
                                            {t.signOut}
                                        </button>
                                    </div>
                                ) : null}

                                <Link href="/menu" onClick={() => setDrawerOpen(false)}
                                    className="btn-primary w-full text-center py-3">
                                    <span className="inline-flex items-center gap-1">{t.orderNow}<ChevronRight className="w-4 h-4" /></span>
                                </Link>
                                <a href="tel:+923291330234"
                                    className="flex items-center justify-center gap-2 text-[rgba(250,243,224,0.6)] hover:text-[var(--orange-warm)] font-[600] min-h-[44px]">
                                    <Phone className="w-4 h-4" /> 0329-1330234
                                </a>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* CartDrawer */}
            {<CartDrawer open={cartOpen} onClose={() => setCartOpen(!cartOpen)} />}

            {/* Location Modal */}
            {locationModalOpen && (
                <LocationModal 
                    onClose={() => setLocationModalOpen(false)} 
                    forceOpen={false} 
                />
            )}
        </header>
    )
}
