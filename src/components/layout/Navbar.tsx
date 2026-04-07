'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
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
import { haversineDistance } from '@/lib/distance'



export default function Navbar() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [cartOpen, setCartOpen] = useState(false)
    const [badgeBounce, setBadgeBounce] = useState(false)
    const [mounted, setMounted] = useState(false)
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
        <header role="banner" className="fixed top-0 left-0 right-0 z-50 bg-[var(--olive-darkest)] border-b-[3px] border-[var(--amber-warm)] h-[60px] lg:h-[68px]">
            <nav aria-label="Main navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

                {/* Logo */}
                <Link href="/" aria-label="Zaitoon — go to homepage" className="shrink-0 flex items-center h-full">
                    <Image src="/logo-en.png" alt="Zaitoon logo" width={160} height={44} priority style={{ mixBlendMode: 'screen', height: '40px', width: 'auto' }} />
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
                                    className={`relative px-1 text-[12px] font-[600] tracking-[0.1em] uppercase transition-all duration-200 flex items-center h-full border-b-[2px] ${active
                                        ? 'text-[var(--amber-pale)] border-[var(--amber-warm)]'
                                        : 'text-[rgba(253,248,240,0.6)] hover:text-[var(--amber-pale)] border-transparent hover:border-[var(--amber-warm)]'
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
                    {/* Location Display — shows GPS-detected nearest branch */}
                    {mounted && (
                        <button
                            onClick={() => setLocationModalOpen(true)}
                            aria-label={locationSet ? 'Change delivery location' : 'Set delivery location'}
                            className={`hidden md:flex items-center gap-1.5 text-[12px] font-[600] px-3 py-1.5 rounded-md border border-[rgba(253,248,240,0.2)] transition-all hover:bg-white/5 ${locationSet ? 'text-[var(--amber-warm)]' : 'text-[rgba(253,248,240,0.5)]'}`}
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
                        className="hidden md:flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full text-[13px] font-bold hover:bg-[#20bd5a] transition-all shadow-md group"
                    >
                        <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>{t.whatsappUs}</span>
                    </a>

                    {/* Language Toggle */}
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
                        className="w-[36px] h-[36px] rounded-full border border-[rgba(253,248,240,0.3)] text-[12px] font-bold text-[var(--amber-pale)] hover:bg-[var(--olive-mid)] transition-colors flex items-center justify-center"
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
                                    backgroundColor: '#1C2416',
                                    border: '1px solid #3D5226',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    color: '#FCD34D',
                                    fontSize: 13,
                                    fontWeight: 600,
                                }}
                            >
                                {/* Avatar circle */}
                                <span style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    backgroundColor: '#556B2F',
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
                                            backgroundColor: '#FFFDF9',
                                            border: '1px solid #EDE0C4',
                                            borderRadius: 8,
                                            padding: 8,
                                            minWidth: 180,
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                            zIndex: 1000,
                                        }}
                                    >
                                        {/* Points summary */}
                                        <div style={{
                                            padding: '8px 12px',
                                            borderBottom: '1px solid #EDE0C4',
                                            marginBottom: 4,
                                        }}>
                                            <p style={{ fontSize: 12, color: '#78716C', margin: 0 }}>
                                                ⭐ {customer.loyaltyPoints} points
                                            </p>
                                            <p style={{ fontSize: 11, color: '#78716C', margin: '2px 0 0' }}>
                                                {customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)} member
                                            </p>
                                        </div>

                                        <Link href="/account" onClick={() => setDropdownOpen(false)} className="block px-3 py-2 text-[13px] font-[600] text-[var(--charcoal)] hover:bg-[var(--cream)] rounded transition-colors">
                                            📦 {t.myAccount}
                                        </Link>
                                        <Link href="/loyalty" onClick={() => setDropdownOpen(false)} className="block px-3 py-2 text-[13px] font-[600] text-[var(--charcoal)] hover:bg-[var(--cream)] rounded transition-colors">
                                            ⭐ {t.loyaltyPoints}
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
                        className="bg-[var(--amber-warm)] text-[var(--olive-darkest)] rounded-[4px] px-4 py-2 font-[600] text-[13px] tracking-[0.06em] flex items-center gap-2 hover:bg-[var(--amber-bright)] transition-colors min-h-[44px]"
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
                        className="lg:hidden w-[44px] h-[44px] flex items-center justify-center text-[var(--cream)] hover:text-[var(--amber-warm)] transition-colors"
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
                            className="fixed inset-0 z-[60] bg-black/50"
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
                            className="fixed left-0 top-0 bottom-0 z-[70] w-[280px] bg-[var(--olive-darkest)] shadow-2xl flex flex-col pt-4 border-t-[3px] border-[var(--amber-warm)]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-2 mb-4">
                                <Image src="/logo-en.png" alt="Zaitoon logo" width={140} height={38} priority style={{ mixBlendMode: 'screen', height: '36px', width: 'auto' }} />
                                <button onClick={() => setDrawerOpen(false)}
                                    aria-label="Close menu"
                                    className="w-[44px] h-[44px] flex items-center justify-center text-[var(--cream)] border border-[rgba(253,248,240,0.2)] rounded">
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
                                                className={`flex items-center min-h-[48px] px-4 font-[600] text-[14px] uppercase tracking-[0.05em] transition-all border-l-[3px] ${active
                                                    ? 'bg-[var(--olive-mid)] text-[var(--amber-pale)] border-[var(--amber-warm)]'
                                                    : 'text-[rgba(253,248,240,0.6)] border-transparent hover:bg-[var(--olive-mid)] hover:text-[var(--cream)]'
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
                                        className="flex items-center gap-3 min-h-[48px] px-4 font-[600] text-[14px] text-[#25D366]"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        {t.whatsappUs}
                                    </a>
                                </motion.li>
                                {/* Mobile Language Switcher */}
                                <motion.li variants={navItemVariants}>
                                    <button
                                        onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
                                        className="flex items-center gap-3 min-h-[48px] px-4 font-[600] text-[14px] text-[var(--amber-pale)]"
                                    >
                                        🌐 {language === 'en' ? 'اردو میں دیکھیں' : 'Switch to English'}
                                    </button>
                                </motion.li>
                            </motion.ul>

                            {/* Bottom */}
                            <div className="p-5 border-t border-[rgba(253,248,240,0.1)] space-y-4">
                                {mounted && (
                                    <button
                                        onClick={() => { setDrawerOpen(false); setLocationModalOpen(true) }}
                                        className="flex items-center justify-center gap-2 text-[14px] font-[600] text-[rgba(253,248,240,0.8)] py-4 border-b border-[rgba(253,248,240,0.1)] mb-2 text-center w-full"
                                    >
                                        <MapPin className="w-4 h-4 text-[var(--amber-warm)]" />
                                        <span>{locationSet && nearestBranchName ? `Nearest: ${nearestBranchName}` : 'Set Location'}</span>
                                    </button>
                                )}
                                {mounted && isAuthenticated && customer ? (
                                    <div className="flex flex-col gap-2 mb-2">
                                        <Link href="/account" onClick={() => setDrawerOpen(false)} className="text-[14px] font-[600] text-[var(--amber-pale)] hover:text-white text-center py-2">
                                            {t.myAccount}
                                        </Link>
                                        <button onClick={() => { setDrawerOpen(false); signOut() }} className="text-[14px] text-[rgba(253,248,240,0.6)] hover:text-red-400 text-center pb-2">
                                            {t.signOut}
                                        </button>
                                    </div>
                                ) : null}

                                <Link href="/menu" onClick={() => setDrawerOpen(false)}
                                    className="btn-primary w-full text-center py-3">
                                    {t.orderNow} →
                                </Link>
                                <a href="tel:+923291330234"
                                    className="flex items-center justify-center gap-2 text-[rgba(253,248,240,0.6)] hover:text-[var(--amber-warm)] font-[600] min-h-[44px]">
                                    <Phone className="w-4 h-4" /> 0329-1330234
                                </a>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* If CartDrawer exists, render it here */}
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
