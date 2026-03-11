'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, History, User, CheckCircle2, PackageX, ChevronRight, LogOut, Loader2, Star } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileCartBar from '@/components/layout/MobileCartBar'
import { useAuthStore } from '@/store/useAuthStore'
import { formatPrice } from '@/lib/payment'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const supabase = createClient()

export default function AccountPage() {
    const router = useRouter()
    const { customer, isAuthenticated, updateProfile, refreshCustomer, signOut } = useAuthStore()
    const [activeTab, setActiveTab] = useState<'orders' | 'loyalty' | 'profile'>('orders')

    const [orders, setOrders] = useState<any[]>([])
    const [loadingOrders, setLoadingOrders] = useState(true)

    const [editName, setEditName] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/')
        } else {
            refreshCustomer()
            if (customer) {
                setEditName(customer.name)
            }
        }
    }, [isAuthenticated, router])

    useEffect(() => {
        if (customer && customer.id) {
            fetchOrders(customer.id)
        }
    }, [customer])

    const fetchOrders = async (customerId: string) => {
        setLoadingOrders(true)
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, order_number, status, total, order_type, created_at,
                    order_items ( name, quantity )
                `)
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setOrders(data)
            }
        } finally {
            setLoadingOrders(false)
        }
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingProfile(true)
        await updateProfile(editName)
        setSavingProfile(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
    }

    if (!isAuthenticated || !customer) {
        return (
            <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--olive-base)]" />
            </div>
        )
    }

    // Tier badge color mapping
    const getTierColor = (tier: string) => {
        switch (tier?.toLowerCase()) {
            case 'platinum': return 'bg-slate-800 text-slate-100 border-slate-600'
            case 'gold': return 'bg-yellow-500 text-yellow-950 border-yellow-400'
            case 'silver': return 'bg-gray-300 text-gray-800 border-gray-400'
            default: return 'bg-orange-800 text-orange-100 border-orange-700' // bronze
        }
    }

    // Next tier points requirement mapping
    const getNextTierDetails = (points: number, currentTier: string) => {
        if (points < 2000) return { next: 'Silver', req: 2000, max: 2000 }
        if (points < 5000) return { next: 'Gold', req: 5000, max: 5000 }
        if (points < 10000) return { next: 'Platinum', req: 10000, max: 10000 }
        return { next: 'Max Tier', req: points, max: 10000 }
    }
    const nextTier = getNextTierDetails(customer.loyaltyPoints, customer.tier)

    return (
        <div className="bg-[#FAF6EF] min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1 pt-[80px] lg:pt-[100px] pb-[100px] px-4 max-w-4xl mx-auto w-full">
                {/* Hero Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-[#1B4332] rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-2xl card-premium mb-8"
                >
                    {/* Background Pattern Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C9920A] opacity-10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="w-24 h-24 md:w-28 md:h-28 bg-[#C9920A] rounded-full flex items-center justify-center font-display text-4xl md:text-5xl font-bold border-4 border-[#1B4332] shadow-[0_0_0_2px_#C9920A]">
                            {customer.name?.charAt(0).toUpperCase() || '?'}
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <h1 className="font-display font-bold text-3xl md:text-4xl mb-1">{customer.name || 'Valued Customer'}</h1>
                            <p className="text-white/60 font-body text-[15px] mb-4">{customer.phone}</p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-[13px] font-bold tracking-wider uppercase border ${getTierColor(customer.tier)}`}>
                                    {customer.tier}
                                </span>
                                <span className="bg-[#050D08]/40 px-4 py-1.5 rounded-full text-[13px] font-bold text-[#F0B429]">
                                    {customer.loyaltyPoints} points
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => { signOut(); router.push('/') }}
                            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-bold text-white/80"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div className="flex space-x-2 border-b-2 border-slate-200 mb-8 overflow-x-auto scrollbar-hide">
                    {(['orders', 'loyalty', 'profile'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-semibold text-[15px] capitalize transition-all whitespace-nowrap relative ${activeTab === tab ? 'text-[var(--olive-base)]' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div layoutId="activeTabIndicator" className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-[var(--amber-warm)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* ORDERS TAB */}
                        {activeTab === 'orders' && (
                            <div className="space-y-4">
                                {loadingOrders ? (
                                    <div className="py-12 flex justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-[var(--olive-base)]" />
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-3xl card-premium border border-[var(--linen)]">
                                        <div className="w-20 h-20 bg-[var(--cream)] rounded-full flex items-center justify-center mx-auto mb-4">
                                            <PackageX className="w-10 h-10 text-[var(--stone)]" />
                                        </div>
                                        <h3 className="font-display font-bold text-2xl text-[var(--charcoal)] mb-2">No orders yet</h3>
                                        <p className="text-[var(--stone)] mb-6">Time to eat! 🌯</p>
                                        <button onClick={() => router.push('/menu')} className="btn-primary">Explore Menu</button>
                                    </div>
                                ) : (
                                    orders.map((order, idx) => (
                                        <Link href={`/order/${order.order_number}`} key={order.id}>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-white rounded-2xl p-5 md:p-6 card-premium shadow hover:shadow-md transition-shadow mb-4 border border-[var(--linen)] cursor-pointer group"
                                            >
                                                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h4 className="font-bold text-[18px] text-[var(--charcoal)]">#{order.order_number}</h4>
                                                            <span className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-lg border ${order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    'bg-blue-50 text-blue-700 border-blue-200'
                                                                }`}>
                                                                {order.status.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        <p className="text-[13px] text-[var(--stone)] flex items-center gap-1.5">
                                                            <History className="w-3.5 h-3.5" />
                                                            {new Date(order.created_at).toLocaleString('en-PK', {
                                                                month: 'short', day: 'numeric', year: 'numeric',
                                                                hour: 'numeric', minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="text-left md:text-right">
                                                        <p className="font-display text-[20px] font-bold text-[var(--charcoal)] leading-none">{formatPrice(order.total)}</p>
                                                        <p className="text-[12px] font-medium text-[var(--olive-base)] uppercase tracking-wider">{order.order_type}</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                                                    <div className="flex-1">
                                                        <p className="text-[14px] text-[var(--stone)] line-clamp-1">
                                                            {order.order_items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                                                        </p>
                                                    </div>
                                                    <div className="pl-4">
                                                        <div className="w-8 h-8 rounded-full bg-[var(--cream)] group-hover:bg-[var(--amber-warm)] text-[var(--olive-base)] group-hover:text-white flex items-center justify-center transition-colors">
                                                            <ChevronRight className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        )}

                        {/* LOYALTY TAB */}
                        {activeTab === 'loyalty' && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-3xl p-6 md:p-8 card-premium border border-[var(--linen)] shadow-md text-center flex flex-col items-center">
                                    <div className="w-16 h-16 bg-[var(--amber-warm)] rounded-full flex items-center justify-center mb-4 text-[var(--olive-darkest)] mx-auto shadow-inner">
                                        <Star fill="currentColor" className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-display font-bold text-3xl text-[var(--charcoal)] mb-2">Points Balance</h3>
                                    <p className="font-display font-bold text-5xl text-[var(--amber-rich)] mb-8">{customer.loyaltyPoints}</p>

                                    <div className="w-full max-w-sm mx-auto">
                                        <div className="flex justify-between text-[13px] font-bold text-[var(--stone)] mb-2">
                                            <span className="uppercase">{customer.tier}</span>
                                            <span className="uppercase">{nextTier.next}</span>
                                        </div>
                                        <div className="h-3 bg-[var(--linen)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[var(--olive-base)] transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.min(100, Math.max(5, (customer.loyaltyPoints / nextTier.max) * 100))}%` }}
                                            />
                                        </div>
                                        <p className="text-[12px] text-slate-400 mt-2">
                                            {nextTier.req - customer.loyaltyPoints > 0
                                                ? `${nextTier.req - customer.loyaltyPoints} more points to reach ${nextTier.next}`
                                                : "You've reached the highest tier!"}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-6 md:p-8 card-premium border border-[var(--linen)] shadow-sm">
                                    <h3 className="font-display font-bold text-2xl text-[var(--charcoal)] mb-6">How It Works</h3>
                                    <ul className="space-y-4">
                                        {[
                                            { t: 'Earn 1 point', d: 'For every Rs. 100 you spend in-app or on our website.' },
                                            { t: 'Redeem Points', d: 'Use points at checkout for instant discounts (1 pt = Rs. 1).' },
                                            { t: 'Tier Upgrades', d: 'Reach Silver, Gold, or Platinum for exclusive secret menu items and priority delivery.' }
                                        ].map((rule, idx) => (
                                            <li key={idx} className="flex gap-4">
                                                <div className="w-6 h-6 rounded-full bg-[var(--cream)] flex items-center justify-center text-[var(--olive-base)] shrink-0 mt-0.5">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[15px] text-[var(--charcoal)]">{rule.t}</p>
                                                    <p className="text-[14px] text-[var(--stone)]">{rule.d}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-3xl p-6 md:p-8 card-premium border border-[var(--linen)] shadow-md max-w-2xl">
                                <h3 className="font-display font-bold text-2xl text-[var(--charcoal)] mb-6">Personal Details</h3>

                                <form onSubmit={handleSaveProfile} className="space-y-5">
                                    <div>
                                        <label htmlFor="name" className="block text-[13px] font-[600] text-[var(--stone)] mb-1.5 uppercase tracking-wide">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <input
                                                id="name" type="text"
                                                value={editName} onChange={e => setEditName(e.target.value)}
                                                className="w-full bg-slate-50 border-[2px] border-[var(--linen)] rounded-[12px] pl-12 pr-4 py-3.5 text-[15px] font-bold text-[var(--charcoal)] focus:outline-none focus:border-[var(--olive-base)] transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-[13px] font-[600] text-[var(--stone)] mb-1.5 uppercase tracking-wide">
                                            Phone Number <span className="text-slate-400 font-normal lowercase">(Read-only)</span>
                                        </label>
                                        <input
                                            id="phone" type="text" readOnly disabled
                                            value={customer.phone}
                                            className="w-full bg-slate-100 border-[2px] border-slate-200 rounded-[12px] px-4 py-3.5 text-[15px] font-bold text-slate-500 cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="pt-4 flex items-center gap-4">
                                        <button
                                            type="submit"
                                            disabled={savingProfile || !editName.trim() || editName === customer.name}
                                            className="btn-primary"
                                        >
                                            {savingProfile ? <Loader2 className="w-5 h-5 animate-spin mx-4" /> : 'Save Changes'}
                                        </button>

                                        <AnimatePresence>
                                            {saveSuccess && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                                    className="text-green-600 font-bold text-sm flex items-center gap-1"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" /> Saved
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </form>

                                <div className="mt-12 pt-6 border-t border-[var(--linen)]">
                                    <button onClick={() => { signOut(); router.push('/') }} className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors -ml-4">
                                        <LogOut className="w-5 h-5" />
                                        Sign out of Zaitoon
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
