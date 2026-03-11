'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getCustomerByPhone, getLoyaltyHistory } from '@/lib/api/customers'
import { useAuthStore } from '@/store/useAuthStore'
import { TIERS, getTier } from '@/lib/loyalty'
import type { LoyaltyTier } from '@/types'

const TIER_PERKS: Record<LoyaltyTier, string> = {
    bronze: '1 pt per Rs.100 spent',
    silver: '2% discount on all orders',
    gold: '5% off + free delivery on Fridays',
    platinum: '10% off + priority orders',
}
const TIER_ORDER: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum']

function AnimatedCount({ to }: { to: number }) {
    const mv = useMotionValue(0)
    const disp = useTransform(mv, v => Math.round(v).toLocaleString())
    const ref = useRef<HTMLSpanElement>(null)
    useEffect(() => {
        const ctrl = animate(mv, to, { duration: 1.5, ease: 'easeOut' })
        return ctrl.stop
    }, [mv, to])
    return <motion.span ref={ref}>{disp}</motion.span>
}

export default function LoyaltyPage() {
    const { customer } = useAuthStore()
    const [loyaltyData, setLoyaltyData] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])

    useEffect(() => {
        if (!customer?.phone) return
        Promise.all([
            getCustomerByPhone(customer.phone),
            getLoyaltyHistory(customer.id),
        ]).then(([cust, hist]) => {
            setLoyaltyData(cust)
            setHistory(hist)
        })
    }, [customer])

    if (!customer?.phone || !loyaltyData) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
                <Navbar />
                <div className="h-[80vh] flex flex-col items-center justify-center">
                    <p className="font-display text-2xl mb-4" style={{ color: 'var(--charcoal)' }}>Please login to view Loyalty points</p>
                    <Link href="/" className="px-6 py-3 bg-[var(--olive-darkest)] text-white rounded-full font-bold">Go Back Home</Link>
                </div>
                <Footer />
            </div>
        )
    }

    const c = { name: loyaltyData.name || 'Valued Guest', loyaltyPoints: loyaltyData.loyalty_points || 0 }
    const tier = getTier(c.loyaltyPoints) as LoyaltyTier
    const tierCfg = TIERS[tier]
    const nextTier = TIER_ORDER[TIER_ORDER.indexOf(tier) + 1] as LoyaltyTier | undefined
    const nextCfg = nextTier ? TIERS[nextTier] : null
    const progress = nextCfg ? Math.min(100, ((c.loyaltyPoints - tierCfg.min) / (nextCfg.min - tierCfg.min)) * 100) : 100
    const ptsToNext = nextCfg ? nextCfg.min - c.loyaltyPoints : 0

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const referralCode = loyaltyData?.referral_code ?? ''
    const referralUrl = referralCode
        ? `${siteUrl}/ref/${referralCode}`
        : ''

    const copyLink = () => {
        if (!referralUrl) return
        navigator.clipboard.writeText(referralUrl)
        toast.success('Referral link copied! 🎉')
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
            <Navbar />

            {/* ── Hero ──────────────────────────────────────────────────────────── */}
            <section className="relative pt-28 pb-16 px-6 grain overflow-hidden" style={{ backgroundColor: 'var(--olive-darkest)' }}>
                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <p className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4"
                        style={{ backgroundColor: 'var(--amber-warm)', color: 'var(--olive-darkest)' }}>
                        {tierCfg.label}
                    </p>
                    <h1 className="font-display italic text-4xl sm:text-5xl font-bold text-white mb-2">
                        Welcome back, {c.name.split(' ')[0]}!
                    </h1>
                    <div className="font-display text-7xl font-bold mt-6 mb-1" style={{ color: 'var(--amber-warm)' }}>
                        <AnimatedCount to={c.loyaltyPoints} />
                    </div>
                    <p className="text-white/60 text-sm">= {c.loyaltyPoints.toLocaleString()} points · worth Rs. {c.loyaltyPoints.toLocaleString()} in discounts</p>
                </div>
            </section>

            <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
                {/* ── Tier Progress ─────────────────────────────────────────────── */}
                <div className="card-base p-6">
                    <h2 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--charcoal)' }}>Your Tier Progress</h2>
                    <div className="flex items-center gap-0 mb-3">
                        {TIER_ORDER.map((t, i) => (
                            <div key={t} className="flex items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${t === tier ? 'ring-2 ring-offset-2 ring-[#D4A017]' : ''
                                    }`} style={{ backgroundColor: TIERS[t].color, color: t === 'silver' ? '#333' : 'white' }}>
                                    {TIERS[t].label.split(' ')[0]}
                                </div>
                                {i < TIER_ORDER.length - 1 && (
                                    <div className="flex-1 h-1 mx-1" style={{ backgroundColor: 'var(--linen)' }}>
                                        <motion.div className="h-full" style={{ backgroundColor: 'var(--olive-base)' }}
                                            initial={{ width: 0 }}
                                            animate={{ width: t === tier && nextCfg ? `${progress}%` : (TIER_ORDER.indexOf(t) < TIER_ORDER.indexOf(tier) ? '100%' : '0%') }}
                                            transition={{ duration: 1, delay: 0.5 }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {nextCfg && (
                        <p className="text-sm text-center mt-3" style={{ color: 'var(--stone)' }}>
                            🎯 <strong>{ptsToNext} more points</strong> to reach {TIERS[nextTier!].label}
                        </p>
                    )}
                </div>

                {/* ── Tier Cards ────────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                    {TIER_ORDER.map(t => {
                        const cfg = TIERS[t]
                        const current = t === tier
                        const locked = TIER_ORDER.indexOf(t) > TIER_ORDER.indexOf(tier)
                        return (
                            <motion.div key={t} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className={`card-base p-5 text-center transition-all ${current ? 'border-2 border-[#D4A017]' : ''} ${locked ? 'opacity-60' : ''}`}>
                                <div className="text-3xl mb-2">{cfg.label.split(' ')[0]}</div>
                                <p className="font-display text-lg font-semibold" style={{ color: cfg.color }}>
                                    {cfg.label.replace(cfg.label.split(' ')[0] + ' ', '')}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>
                                    {cfg.min === 0 ? 'Starter' : `${cfg.min.toLocaleString()} pts`}
                                </p>
                                <p className="text-xs mt-2 font-medium" style={{ color: 'var(--olive-base)' }}>
                                    {TIER_PERKS[t]}
                                </p>
                                {current && <span className="mt-2 inline-block text-xs px-2 py-0.5 rounded-full bg-[#D4A017] text-[#0D2B1F] font-bold">Current</span>}
                            </motion.div>
                        )
                    })}
                </div>

                {/* ── History ───────────────────────────────────────────────────── */}
                <div className="card-base overflow-hidden">
                    <div className="p-5 border-b border-[#E8E0D5]">
                        <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--charcoal)' }}>Points History</h2>
                    </div>
                    <table className="w-full">
                        <thead className="bg-[#F5EDD6]">
                            <tr>
                                {['Date', 'Description', 'Points'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((row: any, i: number) => (
                                <motion.tr key={row.id} className="border-t border-[#E8E0D5]"
                                    initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                                    <td className="px-5 py-3 text-sm text-[#6B7280]">{new Date(row.created_at).toLocaleDateString('en-PK')}</td>
                                    <td className="px-5 py-3 text-sm">{row.description}</td>
                                    <td className={`px-5 py-3 text-sm font-bold ${row.type === 'earned' || row.type === 'bonus' ? 'text-green-600' : 'text-red-500'}`}>
                                        {row.type === 'earned' || row.type === 'bonus' ? '+' : '-'}{Math.abs(row.points)}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Earn Ways ─────────────────────────────────────────────────── */}
                <div>
                    <h2 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--charcoal)' }}>How to Earn Points</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { icon: '🛒', title: 'Place an Order', pts: '1 pt / Rs.100' },
                            { icon: '👥', title: 'Refer a Friend', pts: '100 pts each' },
                            { icon: '⭐', title: 'Leave a Review', pts: '20 pts' },
                        ].map(item => (
                            <div key={item.title} className="card-base p-4 text-center">
                                <div className="text-3xl mb-2">{item.icon}</div>
                                <p className="text-sm font-medium" style={{ color: 'var(--charcoal)' }}>{item.title}</p>
                                <p className="text-xs mt-1 font-bold" style={{ color: 'var(--olive-base)' }}>{item.pts}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Referral ──────────────────────────────────────────────────── */}
                <div className="p-6 rounded-2xl border-2 border-dashed border-[#D4A017]"
                    style={{ backgroundColor: 'var(--parchment)' }}>
                    <h2 className="font-display text-xl font-semibold mb-1" style={{ color: 'var(--charcoal)' }}>
                        Refer a Friend — You Both Earn 50 Points
                    </h2>
                    <p className="text-sm mb-4" style={{ color: 'var(--stone)' }}>
                        Share your unique link below. When a friend places their first order, you both earn <strong>50 loyalty points</strong>.
                    </p>

                    {referralUrl ? (
                        <>
                            {/* Visible monospace URL */}
                            <div style={{
                                background: '#F5EDD8',
                                border: '1px solid #EDE0C4',
                                borderRadius: 8,
                                padding: '12px 16px',
                                fontFamily: 'monospace',
                                fontSize: 13,
                                wordBreak: 'break-all',
                                color: '#556B2F',
                                marginBottom: 14,
                            }}>
                                {referralUrl}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3 flex-wrap">
                                <button
                                    onClick={copyLink}
                                    className="flex-1 px-4 py-2 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90 shadow-md"
                                    style={{ backgroundColor: 'var(--olive-darkest)' }}
                                >
                                    📋 Copy Link
                                </button>
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(
                                        `🌿 Try Zaitoon — Lahore's best shawarma!\nUse my referral link and we BOTH get 50 loyalty points:\n${referralUrl}`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 px-4 py-2 rounded-xl text-white font-medium text-sm text-center transition-opacity hover:opacity-90"
                                    style={{ backgroundColor: '#25D366' }}
                                >
                                    💬 Share on WhatsApp
                                </a>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-center py-2" style={{ color: 'var(--ash)' }}>
                            Place your first order to receive your personal referral code!
                        </p>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    )
}
