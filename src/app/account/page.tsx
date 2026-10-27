'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, CheckCircle2, ChevronRight, LogOut, Loader2, Star, ShoppingBag, Award, PackageOpen } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileCartBar from '@/components/layout/MobileCartBar'
import ReviewModal from '@/components/ReviewModal'
import { useAuthStore } from '@/store/useAuthStore'
import { useHydrated } from '@/store/hydration'
import { formatPrice } from '@/lib/payment'
import { TIERS } from '@/lib/loyalty'
import { titleCase } from '@/lib/site'
import { toast } from 'sonner'
import type { Order, OrderItem, LoyaltyTier } from '@/types'

const TIER_ORDER: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum']

const STATUS_TONE: Record<string, string> = {
    delivered: 'bg-success/10 text-success',
    cancelled: 'bg-danger/10 text-danger',
    pending: 'bg-saffron/15 text-[#8A5A07]',
}

const TABS = [
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'loyalty', label: 'Rewards', icon: Award },
    { id: 'profile', label: 'Profile', icon: User },
] as const
type Tab = typeof TABS[number]['id']

export default function AccountPage() {
    const router = useRouter()
    const hydrated = useHydrated()
    const { customer, isAuthenticated, updateName, signOut } = useAuthStore()
    const [activeTab, setActiveTab] = useState<Tab>('orders')
    const [orders, setOrders] = useState<Order[]>([])
    const [loadingOrders, setLoadingOrders] = useState(true)
    const [editName, setEditName] = useState<string | null>(null)
    const [savingProfile, setSavingProfile] = useState(false)
    const [reviewTarget, setReviewTarget] = useState<{ orderId: string; orderNumber: string } | null>(null)

    // Depend on the id, not the customer object: the Navbar refreshes points on mount,
    // which replaces the object and would otherwise refetch orders in a loop.
    const customerId = customer?.id

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch('/api/customer/orders', { cache: 'no-store' })
            if (res.ok) setOrders((await res.json()).orders as Order[])
        } finally {
            setLoadingOrders(false)
        }
    }, [])

    useEffect(() => {
        if (customerId) fetchOrders()
    }, [customerId, fetchOrders])

    if (!hydrated) {
        return (
            <>
                <Navbar />
                <main id="main" className="pt-nav min-h-screen">
                    <div className="container-page max-w-4xl space-y-6 py-12">
                        <div className="skeleton h-40 rounded-[28px]" />
                        <div className="skeleton h-12 rounded-full" />
                        <div className="skeleton h-64 rounded-[28px]" />
                    </div>
                </main>
            </>
        )
    }

    if (!isAuthenticated || !customer) {
        return (
            <>
                <Navbar />
                <main id="main" className="pt-nav flex min-h-screen items-center justify-center px-5">
                    <div className="max-w-sm py-20 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-paper-2">
                            <User className="h-7 w-7 text-ink-2" />
                        </div>
                        <h1 className="mt-6 text-4xl">No account yet</h1>
                        <p className="mt-3 text-ink-2">
                            Your account is created with your first order. Your order history and loyalty points will show up here.
                        </p>
                        <Link href="/menu" className="btn-primary mt-8">Start an order</Link>
                    </div>
                </main>
            </>
        )
    }

    const tier = (customer.tier ?? 'bronze') as LoyaltyTier
    const nextTier = TIER_ORDER[TIER_ORDER.indexOf(tier) + 1]
    const tierMin = TIERS[tier].min
    const nextMin = nextTier ? TIERS[nextTier].min : null
    const progress = nextMin ? Math.min(100, Math.max(3, ((customer.loyaltyPoints - tierMin) / (nextMin - tierMin)) * 100)) : 100
    const nameValue = editName ?? customer.name

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        const name = nameValue.trim()
        if (!name || name === customer.name) return
        setSavingProfile(true)
        try {
            const res = await fetch('/api/auth/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            })
            if (!res.ok) throw new Error()
            updateName(name)
            setEditName(null)
            toast.success('Profile updated')
        } catch {
            toast.error("We couldn't save your name. Please try again.")
        } finally {
            setSavingProfile(false)
        }
    }

    const handleSignOut = () => { signOut(); router.push('/') }

    return (
        <>
            <Navbar />

            <main id="main" className="pt-nav min-h-screen pb-24">
                <div className="container-page max-w-4xl py-10 lg:py-14">
                    {/* Header */}
                    <motion.header
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="surface-dark grain overflow-hidden rounded-[32px] p-7 sm:p-10"
                    >
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[26px] bg-paper font-display text-4xl text-olive-800">
                                {customer.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                            <div className="min-w-0 flex-1">
                                <h1 className="truncate text-[clamp(2rem,4vw,2.75rem)] text-paper">{customer.name || 'Zaitoon guest'}</h1>
                                <p className="mt-1 text-paper/65">{customer.phone}</p>
                            </div>
                            <div className="flex gap-6 sm:text-end">
                                <div>
                                    <p className="font-display text-3xl tabular text-paper">{customer.loyaltyPoints.toLocaleString()}</p>
                                    <p className="text-sm text-paper/60">points</p>
                                </div>
                                <div>
                                    <p className="font-display text-3xl text-paper">{titleCase(tier)}</p>
                                    <p className="text-sm text-paper/60">member</p>
                                </div>
                            </div>
                        </div>
                    </motion.header>

                    {/* Tabs */}
                    <div role="tablist" aria-label="Account sections" className="mt-8 flex gap-1 rounded-full bg-paper-2 p-1">
                        {TABS.map(tab => {
                            const active = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${active ? 'text-ink' : 'text-ink-2 hover:text-ink'}`}
                                >
                                    {active && <motion.span layoutId="acct-tab" className="absolute inset-0 rounded-full bg-surface shadow-[var(--shadow-soft)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                                    <tab.icon className="relative h-4 w-4" />
                                    <span className="relative">{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            role="tabpanel"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="mt-6"
                        >
                            {activeTab === 'orders' && (
                                loadingOrders ? (
                                    <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="skeleton h-28 rounded-[24px]" />)}</div>
                                ) : orders.length === 0 ? (
                                    <div className="panel flex flex-col items-center px-6 py-16 text-center">
                                        <PackageOpen className="h-10 w-10 text-ink-3" />
                                        <h2 className="mt-4 text-2xl">No orders yet</h2>
                                        <p className="mt-1.5 text-ink-2">Your first shawarma is waiting.</p>
                                        <Link href="/menu" className="btn-primary mt-6">Explore the menu</Link>
                                    </div>
                                ) : (
                                    <ul className="space-y-3">
                                        {orders.map(order => (
                                            <li key={order.id}>
                                                <Link
                                                    href={`/order/${order.order_number}`}
                                                    className="group flex items-center gap-4 rounded-[24px] border border-line bg-surface p-5 transition-all hover:border-line-strong hover:shadow-[var(--shadow-soft)]"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2.5">
                                                            <span className="font-semibold text-ink">#{order.order_number}</span>
                                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[order.status] ?? 'bg-olive-100 text-olive-700'}`}>
                                                                {titleCase(order.status)}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1.5 line-clamp-1 text-sm text-ink-2">
                                                            {order.order_items?.map((i: OrderItem) => `${i.quantity}× ${i.name}`).join(', ')}
                                                        </p>
                                                        <p className="mt-1 text-[0.8125rem] text-ink-3">
                                                            {new Date(order.created_at).toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })} · {titleCase(order.order_type)}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                                        <span className="price text-lg">{formatPrice(order.total)}</span>
                                                        {order.status === 'delivered' ? (
                                                            <button
                                                                onClick={e => { e.preventDefault(); setReviewTarget({ orderId: order.id, orderNumber: order.order_number }) }}
                                                                className="inline-flex items-center gap-1 rounded-full bg-ember-100 px-3 py-1 text-xs font-semibold text-ember-700 hover:bg-ember-100/70"
                                                            >
                                                                <Star className="h-3 w-3 fill-current" /> Review
                                                            </button>
                                                        ) : (
                                                            <ChevronRight className="h-5 w-5 text-ink-3 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                                                        )}
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )
                            )}

                            {activeTab === 'loyalty' && (
                                <div className="grid gap-5 md:grid-cols-5">
                                    <div className="panel p-7 md:col-span-3">
                                        <p className="text-sm font-medium text-ink-2">Points balance</p>
                                        <p className="mt-1 font-display text-6xl tabular">{customer.loyaltyPoints.toLocaleString()}</p>
                                        <p className="mt-1 text-sm text-ink-2">Worth {formatPrice(customer.loyaltyPoints)} off future orders</p>

                                        <div className="mt-8">
                                            <div className="flex justify-between text-sm font-semibold">
                                                <span>{titleCase(tier)}</span>
                                                <span className="text-ink-2">{nextTier ? titleCase(nextTier) : 'Top tier'}</span>
                                            </div>
                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-2">
                                                <motion.div
                                                    className="h-full rounded-full bg-olive-600"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                                />
                                            </div>
                                            <p className="mt-2 text-sm text-ink-2">
                                                {nextMin
                                                    ? <><span className="tabular font-semibold text-ink">{(nextMin - customer.loyaltyPoints).toLocaleString()}</span> more points to reach {titleCase(nextTier!)}</>
                                                    : "You're at the highest tier."}
                                            </p>
                                        </div>
                                        <Link href="/loyalty" className="btn-outline-dark mt-7">See all rewards</Link>
                                    </div>
                                    <div className="panel p-7 md:col-span-2">
                                        <h2 className="text-xl">How it works</h2>
                                        <ul className="mt-5 space-y-4">
                                            {[
                                                { t: 'Earn', d: '1 point for every Rs. 100, added once the branch confirms your order.' },
                                                { t: 'Redeem', d: '1 point = Rs. 1 off, up to 20% of an order.' },
                                                { t: 'Level up', d: 'Silver, Gold and Platinum unlock discounts and free delivery.' },
                                            ].map(r => (
                                                <li key={r.t} className="flex gap-3">
                                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-olive-600" />
                                                    <div>
                                                        <p className="font-semibold">{r.t}</p>
                                                        <p className="text-sm leading-relaxed text-ink-2">{r.d}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div className="panel max-w-2xl p-7">
                                    <h2 className="text-2xl">Personal details</h2>
                                    <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
                                        <div>
                                            <label htmlFor="acct-name" className="field-label">Full name</label>
                                            <input
                                                id="acct-name" type="text" autoComplete="name"
                                                value={nameValue}
                                                onChange={e => setEditName(e.target.value)}
                                                className="field"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="acct-phone" className="field-label">Phone number</label>
                                            <input id="acct-phone" type="text" readOnly disabled value={customer.phone} className="field cursor-not-allowed bg-paper-2 text-ink-2" />
                                            <p className="mt-1.5 text-[0.8125rem] text-ink-3">Your phone number identifies your account and can&apos;t be changed.</p>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={savingProfile || !nameValue.trim() || nameValue.trim() === customer.name}
                                            className="btn-primary"
                                        >
                                            {savingProfile ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save changes'}
                                        </button>
                                    </form>

                                    <div className="mt-10 border-t border-line pt-6">
                                        <button onClick={handleSignOut} className="btn-quiet !px-0 text-danger hover:!bg-transparent hover:!text-danger">
                                            <LogOut className="h-4 w-4" /> Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <Footer />
            <MobileCartBar />

            {reviewTarget && (
                <ReviewModal
                    isOpen
                    onClose={() => setReviewTarget(null)}
                    orderId={reviewTarget.orderId}
                    orderNumber={reviewTarget.orderNumber}
                />
            )}
        </>
    )
}
