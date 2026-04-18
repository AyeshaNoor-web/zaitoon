'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Ticket, History, User, CheckCircle2, PackageX,
    ChevronRight, LogOut, Loader2, Star, ShoppingBag, Award
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileCartBar from '@/components/layout/MobileCartBar'
import { useAuthStore } from '@/store/useAuthStore'
import { formatPrice } from '@/lib/payment'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const supabase = createClient()

const TIER_ICONS: Record<string, string> = {
    platinum: '💎', gold: '🥇', silver: '🥈', bronze: '🥉'
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
    delivered:  { bg: 'rgba(22,163,74,0.08)',  text: '#16A34A', border: 'rgba(22,163,74,0.25)' },
    cancelled:  { bg: 'rgba(220,38,38,0.08)',  text: '#DC2626', border: 'rgba(220,38,38,0.25)' },
    default:    { bg: 'rgba(37,99,235,0.08)',  text: '#2563EB', border: 'rgba(37,99,235,0.25)' },
}

const TABS = ['orders', 'loyalty', 'profile'] as const
type Tab = typeof TABS[number]

const TAB_ICONS: Record<Tab, JSX.Element> = {
    orders:  <ShoppingBag className="w-4 h-4" />,
    loyalty: <Award className="w-4 h-4" />,
    profile: <User className="w-4 h-4" />,
}

export default function AccountPage() {
    const router = useRouter()
    const { customer, isAuthenticated, updateName, refreshCustomer, signOut } = useAuthStore()
    const [activeTab, setActiveTab] = useState<Tab>('orders')
    const [orders, setOrders] = useState<any[]>([])
    const [loadingOrders, setLoadingOrders] = useState(true)
    const [editName, setEditName] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    useEffect(() => {
        if (!isAuthenticated || !customer) { router.replace('/menu'); return }
        refreshCustomer(customer.phone)
        setEditName(customer.name)
    }, [isAuthenticated, router, customer?.phone])

    useEffect(() => {
        if (customer?.id) fetchOrders(customer.id)
    }, [customer])

    const fetchOrders = async (customerId: string) => {
        setLoadingOrders(true)
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`id, order_number, status, total, order_type, created_at, order_items ( name, quantity )`)
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })
            if (!error && data) setOrders(data)
        } finally { setLoadingOrders(false) }
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingProfile(true)
        updateName(editName)
        setSavingProfile(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
    }

    if (!isAuthenticated || !customer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
                style={{ background: 'var(--cream)' }}>
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'var(--linen)' }}>
                        <User className="w-10 h-10" style={{ color: 'var(--stone)' }} />
                    </div>
                    <h1 className="text-[26px] font-display font-[700] mb-3" style={{ color: 'var(--charcoal)' }}>
                        Login Required
                    </h1>
                    <p className="mb-8 max-w-xs text-[15px]" style={{ color: 'var(--stone)' }}>
                        Place your first order to create your account. Your loyalty points and history will appear here.
                    </p>
                    <button onClick={() => router.push('/menu')} className="btn-primary px-8">
                        Browse Menu →
                    </button>
                </motion.div>
            </div>
        )
    }

    const getNextTierDetails = (points: number) => {
        if (points < 2000)  return { next: 'Silver',   req: 2000,  max: 2000   }
        if (points < 5000)  return { next: 'Gold',     req: 5000,  max: 5000   }
        if (points < 10000) return { next: 'Platinum', req: 10000, max: 10000  }
        return { next: 'Max Tier', req: points, max: 10000 }
    }
    const nextTier = getNextTierDetails(customer.loyaltyPoints)
    const tierIcon = TIER_ICONS[customer.tier?.toLowerCase()] ?? '🥉'

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
            <Navbar />

            <main className="flex-1 pt-[80px] lg:pt-[100px] pb-[100px] px-4 max-w-4xl mx-auto w-full">

                {/* ── HERO CARD ── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full rounded-[20px] p-7 md:p-10 text-white relative overflow-hidden mb-8"
                    style={{
                        background: 'linear-gradient(135deg, #2E3A1C 0%, #0D2015 50%, #3A4A22 100%)',
                        boxShadow: '0 20px 60px rgba(46,58,28,0.4)',
                    }}
                >
                    {/* Background orbs */}
                    <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none opacity-10"
                        style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -40%)' }} />
                    <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none opacity-[0.08]"
                        style={{ background: 'radial-gradient(circle, var(--orange-warm) 0%, transparent 70%)', transform: 'translate(-30%, 40%)' }} />
                    {/* Dot grid */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                        style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(253,248,240,0.6) 1px, transparent 0)`, backgroundSize: '28px 28px' }} />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center font-display text-[44px] font-[800] border-4 shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, var(--orange-warm), #E67E00)',
                                borderColor: 'rgba(253,248,240,0.15)',
                                color: '#0D2015',
                                boxShadow: '0 8px 24px rgba(217,119,6,0.5)'
                            }}
                        >
                            {customer.name?.charAt(0).toUpperCase() || '?'}
                        </motion.div>

                        <div className="text-center md:text-left flex-1">
                            <h1 className="font-display font-[700] text-[30px] md:text-[36px] mb-1 leading-none">
                                {customer.name || 'Valued Customer'}
                            </h1>
                            <p className="text-[15px] mb-5" style={{ color: 'rgba(253,248,240,0.55)' }}>
                                {customer.phone}
                            </p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-[700] tracking-wider uppercase"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--orange-warm), #E67E00)',
                                        color: '#0D2015',
                                        boxShadow: '0 3px 10px rgba(217,119,6,0.4)'
                                    }}>
                                    {tierIcon} {customer.tier}
                                </span>
                                <span className="px-4 py-1.5 rounded-full text-[13px] font-[700]"
                                    style={{ background: 'rgba(253,248,240,0.08)', color: 'var(--orange-pale)', border: '1px solid rgba(253,248,240,0.12)' }}>
                                    ⭐ {customer.loyaltyPoints} pts
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => { signOut(); router.push('/') }}
                            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-[700] transition-all"
                            style={{ background: 'rgba(253,248,240,0.08)', color: 'rgba(253,248,240,0.6)', border: '1px solid rgba(253,248,240,0.12)' }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(253,248,240,0.16)'; el.style.color = 'white' }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(253,248,240,0.08)'; el.style.color = 'rgba(253,248,240,0.6)' }}
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </motion.div>

                {/* ── TABS ── */}
                <div className="flex gap-1 mb-8 p-1 rounded-[12px]"
                    style={{ background: 'var(--linen)', border: '1px solid rgba(0,0,0,0.04)' }}>
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[9px] text-[13px] font-[700] capitalize transition-all duration-250 relative"
                            style={{
                                background: activeTab === tab ? 'white' : 'transparent',
                                color: activeTab === tab ? 'var(--green-dark)' : 'var(--stone)',
                                boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            }}
                        >
                            {TAB_ICONS[tab]}
                            <span className="hidden sm:block">{tab}</span>
                        </button>
                    ))}
                </div>

                {/* ── TAB CONTENT ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        {/* ORDERS */}
                        {activeTab === 'orders' && (
                            <div className="space-y-4">
                                {loadingOrders ? (
                                    <div className="py-16 flex flex-col items-center gap-4">
                                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--green-base)' }} />
                                        <p className="text-[14px]" style={{ color: 'var(--stone)' }}>Loading orders…</p>
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-[20px]"
                                        style={{ border: '1.5px solid var(--linen)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                        <div className="text-[64px] mb-4">📦</div>
                                        <h3 className="font-display font-[700] text-[22px] mb-2" style={{ color: 'var(--charcoal)' }}>
                                            No orders yet
                                        </h3>
                                        <p className="mb-6" style={{ color: 'var(--stone)' }}>Time to eat! 🌯</p>
                                        <button onClick={() => router.push('/menu')} className="btn-primary">
                                            Explore Menu
                                        </button>
                                    </div>
                                ) : (
                                    orders.map((order, idx) => {
                                        const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.default
                                        return (
                                            <Link href={`/order/${order.order_number}`} key={order.id}>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 12 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                                    whileHover={{ y: -3, boxShadow: '0 12px 36px rgba(0,0,0,0.1)' }}
                                                    className="bg-white rounded-[16px] p-5 md:p-6 mb-0 group cursor-pointer transition-shadow"
                                                    style={{ border: '1.5px solid var(--linen)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                                                >
                                                    <div className="flex justify-between md:items-center mb-4 gap-2 flex-col md:flex-row">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h4 className="font-display font-[700] text-[18px]"
                                                                    style={{ color: 'var(--charcoal)' }}>
                                                                    #{order.order_number}
                                                                </h4>
                                                                <span className="px-2.5 py-1 text-[11px] font-[700] uppercase rounded-[6px]"
                                                                    style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                                                                    {order.status.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            <p className="text-[13px] flex items-center gap-1.5"
                                                                style={{ color: 'var(--stone)' }}>
                                                                <History className="w-3.5 h-3.5" />
                                                                {new Date(order.created_at).toLocaleString('en-PK', {
                                                                    month: 'short', day: 'numeric',
                                                                    year: 'numeric', hour: 'numeric', minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                        <div className="text-left md:text-right">
                                                            <p className="font-display text-[22px] font-[700] leading-none"
                                                                style={{ color: 'var(--charcoal)' }}>
                                                                {formatPrice(order.total)}
                                                            </p>
                                                            <p className="text-[11px] font-[700] uppercase tracking-wider mt-0.5"
                                                                style={{ color: 'var(--green-base)' }}>
                                                                {order.order_type}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-end pt-3.5"
                                                        style={{ borderTop: '1px solid var(--linen)' }}>
                                                        <p className="text-[13px] line-clamp-1 flex-1"
                                                            style={{ color: 'var(--stone)' }}>
                                                            {order.order_items.map((i: any) => `${i.quantity}× ${i.name}`).join(', ')}
                                                        </p>
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center ml-3 transition-all"
                                                            style={{ background: 'var(--cream)', color: 'var(--green-base)' }}
                                                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--orange-warm)'; el.style.color = 'white' }}
                                                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--cream)'; el.style.color = 'var(--green-base)' }}>
                                                            <ChevronRight className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        )
                                    })
                                )}
                            </div>
                        )}

                        {/* LOYALTY */}
                        {activeTab === 'loyalty' && (
                            <div className="space-y-6">
                                {/* Points card */}
                                <div className="bg-white rounded-[20px] p-7 text-center"
                                    style={{ border: '1.5px solid var(--linen)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                                        style={{ background: 'linear-gradient(135deg, var(--orange-warm), #E67E00)', boxShadow: '0 6px 20px rgba(217,119,6,0.35)' }}>
                                        <Star fill="white" className="w-8 h-8 text-white" />
                                    </div>
                                    <p className="text-[12px] font-[700] uppercase tracking-widest mb-1"
                                        style={{ color: 'var(--stone)' }}>Points Balance</p>
                                    <p className="font-display font-[800] text-[60px] leading-none mb-2"
                                        style={{ color: 'var(--orange-warm)' }}>
                                        {customer.loyaltyPoints}
                                    </p>

                                    {/* Progress bar */}
                                    <div className="w-full max-w-sm mx-auto mt-5">
                                        <div className="flex justify-between text-[12px] font-[700] mb-2"
                                            style={{ color: 'var(--stone)' }}>
                                            <span className="uppercase">{customer.tier}</span>
                                            <span className="uppercase">{nextTier.next}</span>
                                        </div>
                                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--linen)' }}>
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ background: 'linear-gradient(90deg, var(--green-base), var(--olive-light))' }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, Math.max(5, (customer.loyaltyPoints / nextTier.max) * 100))}%` }}
                                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                            />
                                        </div>
                                        <p className="text-[11px] mt-2" style={{ color: 'var(--stone)' }}>
                                            {nextTier.req - customer.loyaltyPoints > 0
                                                ? `${nextTier.req - customer.loyaltyPoints} more points to reach ${nextTier.next}`
                                                : "You've reached the highest tier! 🎉"}
                                        </p>
                                    </div>
                                </div>

                                {/* How it works */}
                                <div className="bg-white rounded-[20px] p-7"
                                    style={{ border: '1.5px solid var(--linen)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                    <h3 className="font-display font-[700] text-[20px] mb-5" style={{ color: 'var(--charcoal)' }}>
                                        How It Works
                                    </h3>
                                    <ul className="space-y-4">
                                        {[
                                            { t: 'Earn 1 point', d: 'For every Rs. 100 spent on orders.' },
                                            { t: 'Redeem Points', d: 'Use at checkout — 1 pt = Rs. 1 discount.' },
                                            { t: 'Tier Upgrades', d: 'Reach Gold or Platinum for exclusive perks.' },
                                        ].map((rule, i) => (
                                            <li key={i} className="flex gap-4">
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                                    style={{ background: 'rgba(138,154,91,0.12)', color: 'var(--green-base)' }}>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-[700] text-[15px]" style={{ color: 'var(--charcoal)' }}>{rule.t}</p>
                                                    <p className="text-[13px] leading-snug" style={{ color: 'var(--stone)' }}>{rule.d}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* PROFILE */}
                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-[20px] p-7 max-w-2xl"
                                style={{ border: '1.5px solid var(--linen)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                                <h3 className="font-display font-[700] text-[22px] mb-7" style={{ color: 'var(--charcoal)' }}>
                                    Personal Details
                                </h3>
                                <form onSubmit={handleSaveProfile} className="space-y-5">
                                    <div>
                                        <label htmlFor="name" className="block text-[12px] font-[700] uppercase tracking-wider mb-2"
                                            style={{ color: 'var(--stone)' }}>
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                                                style={{ color: 'var(--stone)' }} />
                                            <input
                                                id="name" type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                className="w-full rounded-[12px] pl-11 pr-4 py-3.5 text-[15px] font-[600] transition-all"
                                                style={{
                                                    background: 'var(--cream)',
                                                    border: '2px solid var(--linen)',
                                                    color: 'var(--charcoal)',
                                                    outline: 'none'
                                                }}
                                                onFocus={e => { e.currentTarget.style.borderColor = 'var(--green-base)' }}
                                                onBlur={e => { e.currentTarget.style.borderColor = 'var(--linen)' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-[12px] font-[700] uppercase tracking-wider mb-2"
                                            style={{ color: 'var(--stone)' }}>
                                            Phone Number <span className="font-[400] normal-case tracking-normal">(read-only)</span>
                                        </label>
                                        <input
                                            id="phone" type="text" readOnly disabled
                                            value={customer.phone}
                                            className="w-full rounded-[12px] px-4 py-3.5 text-[15px] font-[600] cursor-not-allowed"
                                            style={{ background: 'var(--linen)', border: '2px solid transparent', color: 'var(--stone)' }}
                                        />
                                    </div>

                                    <div className="pt-3 flex items-center gap-4">
                                        <button
                                            type="submit"
                                            disabled={savingProfile || !editName.trim() || editName === customer.name}
                                            className="btn-primary"
                                        >
                                            {savingProfile
                                                ? <Loader2 className="w-5 h-5 animate-spin mx-4" />
                                                : 'Save Changes'
                                            }
                                        </button>
                                        <AnimatePresence>
                                            {saveSuccess && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center gap-1.5 text-[13px] font-[700]"
                                                    style={{ color: '#16A34A' }}
                                                >
                                                    <CheckCircle2 className="w-4 h-4" /> Saved!
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </form>

                                <div className="mt-12 pt-6" style={{ borderTop: '1px solid var(--linen)' }}>
                                    <button
                                        onClick={() => { signOut(); router.push('/') }}
                                        className="flex items-center gap-2 text-[14px] font-[700] px-4 py-2.5 rounded-[10px] transition-all -ml-4"
                                        style={{ color: '#DC2626' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.06)' }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                                    >
                                        <LogOut className="w-4 h-4" /> Sign out of Zaitoon
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            <Footer />
            <MobileCartBar />
        </div>
    )
}
