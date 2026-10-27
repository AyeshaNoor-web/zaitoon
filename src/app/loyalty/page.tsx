'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { toast } from 'sonner'
import { Copy, Share2, ShoppingBag, Users, Check, Lock } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/store/useAuthStore'
import { useHydrated } from '@/store/hydration'
import { TIERS, getTier } from '@/lib/loyalty'
import { TIER_PERKS } from '@/lib/utils/loyalty'
import { titleCase } from '@/lib/site'
import type { LoyaltyTier, Customer, LoyaltyTransaction } from '@/types'

const TIER_ORDER: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum']
const REFERRAL_BONUS = 50

function perksFor(tier: LoyaltyTier): string[] {
    const p = TIER_PERKS[tier]
    const perks = ['1 point per Rs. 100']
    if (p.discountPct > 0) perks.push(`${p.discountPct}% off every order`)
    if (p.freeDelivery) perks.push('Free delivery, every order')
    return perks
}

function AnimatedCount({ to }: { to: number }) {
    const mv = useMotionValue(0)
    const disp = useTransform(mv, v => Math.round(v).toLocaleString())
    useEffect(() => {
        const ctrl = animate(mv, to, { duration: 1.4, ease: 'easeOut' })
        return ctrl.stop
    }, [mv, to])
    return <motion.span>{disp}</motion.span>
}

export default function LoyaltyPage() {
    const hydrated = useHydrated()
    const { customer, isAuthenticated } = useAuthStore()
    const [loyaltyData, setLoyaltyData] = useState<Customer | null>(null)
    const [history, setHistory] = useState<LoyaltyTransaction[]>([])
    const [fetchedFor, setFetchedFor] = useState<string | null>(null)

    const phone = isAuthenticated ? customer?.phone : undefined
    const customerId = customer?.id

    useEffect(() => {
        if (!hydrated || !phone || !customerId) return
        fetch('/api/customer/loyalty', { cache: 'no-store' })
            .then(async res => {
                if (res.status === 401) return // this device isn't verified for the account
                if (!res.ok) throw new Error()
                const body = await res.json()
                setLoyaltyData(body.customer)
                setHistory(body.history)
            })
            .catch(() => toast.error("We couldn't load your rewards right now."))
            .finally(() => setFetchedFor(phone))
    }, [hydrated, phone, customerId])

    const points = loyaltyData?.loyalty_points ?? 0
    const tier = loyaltyData ? getTier(points) : null
    const nextTier = tier ? TIER_ORDER[TIER_ORDER.indexOf(tier) + 1] : undefined
    const progress = tier && nextTier
        ? Math.min(100, ((points - TIERS[tier].min) / (TIERS[nextTier].min - TIERS[tier].min)) * 100)
        : 100

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    const referralUrl = loyaltyData?.referral_code ? `${siteUrl}/ref/${loyaltyData.referral_code}` : ''

    const copyLink = async () => {
        if (!referralUrl) return
        try {
            await navigator.clipboard.writeText(referralUrl)
            toast.success('Referral link copied')
        } catch {
            toast.error("Couldn't copy. Long-press the link to copy it instead.")
        }
    }

    const shareText = `Try Zaitoon, Lahore's best shawarma. Use my link and we both get ${REFERRAL_BONUS} loyalty points:\n${referralUrl}`
    const busy = !hydrated || (!!phone && fetchedFor !== phone)

    return (
        <>
            <Navbar />

            <main id="main" className="pt-nav min-h-screen pb-24">
                {/* Hero */}
                <section className="container-page grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20">
                    <div>
                        <span className="section-label">Zaitoon rewards</span>
                        <h1>Eat well. <em className="font-normal italic text-olive-600">Get rewarded.</em></h1>
                        <p className="mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-ink-2">
                            Every order earns points you can spend on the next one. Order more and you move up the tiers, from member discounts to free delivery on everything.
                        </p>
                        {!busy && !loyaltyData && (
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link href="/menu" className="btn-primary">Place your first order</Link>
                                <p className="basis-full text-sm text-ink-3">No sign-up needed. Your account is created with your phone number at checkout.</p>
                            </div>
                        )}
                    </div>

                    {busy ? (
                        <div className="skeleton h-[280px] rounded-[32px]" />
                    ) : loyaltyData && tier ? (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="surface-dark grain overflow-hidden rounded-[32px] p-8 sm:p-10"
                        >
                            <p className="text-sm text-paper/65">Welcome back, {loyaltyData.name?.split(' ')[0] || 'friend'}</p>
                            <p className="mt-4 font-display text-7xl leading-none tabular text-paper">
                                <AnimatedCount to={points} />
                            </p>
                            <p className="mt-2 text-paper/70">points · worth Rs. {points.toLocaleString()}</p>

                            <div className="mt-8">
                                <div className="flex justify-between text-sm">
                                    <span className="font-semibold text-paper">{titleCase(tier)}</span>
                                    <span className="text-paper/60">{nextTier ? titleCase(nextTier) : 'Top tier'}</span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                                    <motion.div
                                        className="h-full rounded-full bg-ember-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(3, progress)}%` }}
                                        transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                </div>
                                <p className="mt-2 text-sm text-paper/65">
                                    {nextTier
                                        ? <><span className="tabular font-semibold text-paper">{(TIERS[nextTier].min - points).toLocaleString()}</span> points to {titleCase(nextTier)}</>
                                        : "You've reached the highest tier."}
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { k: '1 pt', v: 'for every Rs. 100' },
                                { k: 'Rs. 1', v: 'off per point' },
                                { k: '10%', v: 'off at Platinum' },
                                { k: `${REFERRAL_BONUS} pts`, v: 'for each friend you refer' },
                            ].map(s => (
                                <div key={s.v} className="panel p-6">
                                    <p className="font-display text-4xl">{s.k}</p>
                                    <p className="mt-1 text-sm text-ink-2">{s.v}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Tiers */}
                <section aria-labelledby="tiers-title" className="container-page py-10">
                    <h2 id="tiers-title" className="text-[clamp(1.75rem,3vw,2.25rem)]">Tiers</h2>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {TIER_ORDER.map((tierId, i) => {
                            const cfg = TIERS[tierId]
                            const isCurrent = tier === tierId
                            const isLocked = tier ? TIER_ORDER.indexOf(tierId) > TIER_ORDER.indexOf(tier) : false
                            return (
                                <motion.div
                                    key={tierId}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.06 }}
                                    className={`relative rounded-[24px] p-6 ${isCurrent ? 'bg-ink text-paper' : 'border border-line bg-surface'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="h-3 w-3 rounded-full" style={{ background: cfg.color }} aria-hidden="true" />
                                        {isCurrent && <span className="rounded-full bg-ember-500 px-2.5 py-0.5 text-xs font-semibold text-white">Your tier</span>}
                                        {isLocked && <Lock className="h-4 w-4 text-ink-3" />}
                                    </div>
                                    <p className="mt-6 font-display text-3xl">{titleCase(tierId)}</p>
                                    <p className={`mt-1 text-sm tabular ${isCurrent ? 'text-paper/65' : 'text-ink-3'}`}>
                                        {cfg.min === 0 ? 'Where everyone starts' : `From ${cfg.min.toLocaleString()} points`}
                                    </p>
                                    <ul className="mt-5 space-y-2">
                                        {perksFor(tierId).map(p => (
                                            <li key={p} className={`flex gap-2 text-sm ${isCurrent ? 'text-paper/85' : 'text-ink-2'}`}>
                                                <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isCurrent ? 'text-ember-100' : 'text-olive-600'}`} /> {p}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )
                        })}
                    </div>
                </section>

                {/* Earn + refer */}
                <section className="container-page grid gap-5 py-10 lg:grid-cols-5">
                    <div className="panel p-7 lg:col-span-2">
                        <h2 className="text-2xl">Ways to earn</h2>
                        <ul className="mt-6 space-y-5">
                            <li className="flex gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-olive-100 text-olive-700"><ShoppingBag className="h-5 w-5" /></span>
                                <div>
                                    <p className="font-semibold">Order</p>
                                    <p className="text-sm leading-relaxed text-ink-2">1 point per Rs. 100, added when the branch confirms your order.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ember-100 text-ember-700"><Users className="h-5 w-5" /></span>
                                <div>
                                    <p className="font-semibold">Refer a friend</p>
                                    <p className="text-sm leading-relaxed text-ink-2">You both get {REFERRAL_BONUS} points when they place their first order.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-[24px] border border-dashed border-line-strong p-7 lg:col-span-3">
                        <h2 className="text-2xl">Your referral link</h2>
                        {referralUrl ? (
                            <>
                                <p className="mt-2 text-sm text-ink-2">Share it with friends. When they order for the first time, you each get {REFERRAL_BONUS} points.</p>
                                <div className="mt-5 flex items-center gap-2 rounded-2xl bg-surface p-2 ps-4 ring-1 ring-line">
                                    <span className="min-w-0 flex-1 truncate font-mono text-sm text-ink-2">{referralUrl}</span>
                                    <button onClick={copyLink} className="btn-green !min-h-10 !px-4 text-sm"><Copy className="h-4 w-4" /> Copy</button>
                                </div>
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="btn-outline-dark mt-3"
                                >
                                    <Share2 className="h-4 w-4" /> Share on WhatsApp
                                </a>
                            </>
                        ) : (
                            <p className="mt-2 text-sm text-ink-2">
                                {busy ? 'Loading…' : 'Your personal link appears here after your first order.'}
                            </p>
                        )}
                    </div>
                </section>

                {/* History */}
                {history.length > 0 && (
                    <section aria-labelledby="history-title" className="container-page py-10">
                        <h2 id="history-title" className="text-[clamp(1.75rem,3vw,2.25rem)]">Points history</h2>
                        <ul className="panel mt-6 divide-y divide-line overflow-hidden !p-0">
                            {history.map(row => {
                                const positive = row.type === 'earned' || row.type === 'bonus'
                                return (
                                    <li key={row.id} className="flex items-center justify-between gap-4 px-6 py-4">
                                        <div>
                                            <p className="text-[0.9375rem] font-medium text-ink">{row.description}</p>
                                            <p className="text-[0.8125rem] text-ink-3">{new Date(row.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <span className={`tabular shrink-0 font-semibold ${positive ? 'text-success' : 'text-danger'}`}>
                                            {positive ? '+' : '−'}{Math.abs(row.points)}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    </section>
                )}
            </main>

            <Footer />
        </>
    )
}
