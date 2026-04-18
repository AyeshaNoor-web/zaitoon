'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'
import { Copy, Share2, Star, ShoppingCart, Users, ChevronRight } from 'lucide-react'
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
const TIER_ICONS: Record<LoyaltyTier, string> = {
    bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎'
}

function AnimatedCount({ to }: { to: number }) {
    const mv = useMotionValue(0)
    const disp = useTransform(mv, v => Math.round(v).toLocaleString())
    useEffect(() => {
        const ctrl = animate(mv, to, { duration: 1.8, ease: 'easeOut' })
        return ctrl.stop
    }, [mv, to])
    return <motion.span>{disp}</motion.span>
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
            <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
                <Navbar />
                <div className="h-[80vh] flex flex-col items-center justify-center gap-6 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <div className="text-[64px] mb-4">⭐</div>
                        <h1 className="font-display text-[28px] font-[700] mb-3" style={{ color: 'var(--charcoal)' }}>
                            Sign in to view your rewards
                        </h1>
                        <p className="text-[15px] mb-6" style={{ color: 'var(--stone)' }}>
                            Track your points, unlock tiers, and earn exclusive perks.
                        </p>
                        <Link href="/" className="btn-primary inline-flex">Go Back Home</Link>
                    </motion.div>
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
    const referralUrl = referralCode ? `${siteUrl}/ref/${referralCode}` : ''

    const copyLink = () => {
        if (!referralUrl) return
        navigator.clipboard.writeText(referralUrl)
        toast.success('Referral link copied! 🎉')
    }

    const earnWays = [
        { icon: <ShoppingCart className="w-5 h-5" />, title: 'Place an Order', pts: '1 pt / Rs.100', color: 'var(--green-base)' },
        { icon: <Users className="w-5 h-5" />, title: 'Refer a Friend', pts: '100 pts each', color: 'var(--orange-warm)' },
        { icon: <Star className="w-5 h-5" />, title: 'Leave a Review', pts: '20 pts', color: '#8B5CF6' },
    ]

    return (
        <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
            <Navbar />

            {/* ── HERO ── */}
            <section className="relative pt-28 pb-20 px-6 overflow-hidden"
                style={{ background: 'linear-gradient(140deg, #2E3A1C 0%, #0D2015 50%, #3A4A22 100%)' }}>
                {/* Ambient glows */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-15"
                        style={{ background: 'radial-gradient(circle, var(--orange-warm) 0%, transparent 70%)' }} />
                </div>
                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(253,248,240,0.6) 1px, transparent 0)`, backgroundSize: '32px 32px' }} />

                <div className="relative z-10 max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-[700] mb-6 uppercase tracking-wider"
                            style={{
                                background: 'linear-gradient(135deg, var(--orange-warm), #E67E00)',
                                color: '#0D2015',
                                boxShadow: '0 4px 16px rgba(217,119,6,0.4)'
                            }}>
                            {TIER_ICONS[tier]} {tierCfg.label} Member
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="font-display italic text-[40px] sm:text-[52px] font-[700] text-white mb-6"
                    >
                        Welcome back, {c.name.split(' ')[0]}!
                    </motion.h1>

                    {/* Points display */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-block px-10 py-6 rounded-[20px] mb-4"
                        style={{
                            background: 'rgba(253,248,240,0.06)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(253,248,240,0.12)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}
                    >
                        <div className="font-display text-[72px] font-[800] leading-none"
                            style={{ color: 'var(--orange-warm)', textShadow: '0 0 60px rgba(217,119,6,0.4)' }}>
                            <AnimatedCount to={c.loyaltyPoints} />
                        </div>
                        <div className="text-[13px] font-[600] mt-2 uppercase tracking-wider"
                            style={{ color: 'rgba(253,248,240,0.5)' }}>
                            Loyalty Points
                        </div>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-[14px]"
                        style={{ color: 'rgba(253,248,240,0.5)' }}
                    >
                        Worth Rs. {c.loyaltyPoints.toLocaleString()} in discounts
                    </motion.p>
                </div>
            </section>

            <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">

                {/* ── TIER PROGRESS ── */}
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white rounded-[16px] p-6"
                    style={{ border: '1.5px solid var(--linen)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                >
                    <h2 className="font-display text-[20px] font-[700] mb-6" style={{ color: 'var(--charcoal)' }}>
                        Your Tier Progress
                    </h2>

                    {/* Tier stepper */}
                    <div className="flex items-center mb-4">
                        {TIER_ORDER.map((t, i) => {
                            const isCurrent = t === tier
                            const isDone = TIER_ORDER.indexOf(t) < TIER_ORDER.indexOf(tier)
                            return (
                                <div key={t} className="flex items-center flex-1">
                                    <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-[18px] shrink-0 transition-all`}
                                        style={{
                                            background: isDone || isCurrent ? TIERS[t].color : 'var(--linen)',
                                            outline: isCurrent ? `4px solid ${TIERS[t].color}` : 'none',
                                            outlineOffset: '2px',
                                        }}>
                                        {TIER_ICONS[t]}
                                        {isCurrent && (
                                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-[700] uppercase tracking-wider whitespace-nowrap"
                                                style={{ color: 'var(--green-base)' }}>
                                                You
                                            </div>
                                        )}
                                    </div>
                                    {i < TIER_ORDER.length - 1 && (
                                        <div className="flex-1 h-[3px] mx-1.5 rounded-full overflow-hidden"
                                            style={{ background: 'var(--linen)' }}>
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ background: 'linear-gradient(90deg, var(--green-base), var(--green-light))' }}
                                                initial={{ width: 0 }}
                                                whileInView={{
                                                    width: isDone ? '100%' : (isCurrent && nextCfg ? `${progress}%` : '0%')
                                                }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {nextCfg && (
                        <p className="text-[13px] text-center mt-8" style={{ color: 'var(--stone)' }}>
                            🎯 <strong style={{ color: 'var(--charcoal)' }}>{ptsToNext} more points</strong> to reach {TIERS[nextTier!].label}
                        </p>
                    )}
                    {!nextCfg && (
                        <p className="text-[13px] text-center mt-8 font-[600]" style={{ color: 'var(--orange-warm)' }}>
                            💎 You've reached the highest tier — Platinum!
                        </p>
                    )}
                </motion.div>

                {/* ── TIER CARDS ── */}
                <div>
                    <h2 className="font-display text-[20px] font-[700] mb-5" style={{ color: 'var(--charcoal)' }}>All Tiers</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {TIER_ORDER.map((t, i) => {
                            const cfg = TIERS[t]
                            const isCurrent = t === tier
                            const isLocked = TIER_ORDER.indexOf(t) > TIER_ORDER.indexOf(tier)
                            return (
                                <motion.div
                                    key={t}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                    whileHover={!isLocked ? { y: -3 } : {}}
                                    className="bg-white rounded-[14px] p-5 text-center transition-all"
                                    style={{
                                        border: isCurrent ? `2px solid ${cfg.color}` : '1.5px solid var(--linen)',
                                        opacity: isLocked ? 0.55 : 1,
                                        boxShadow: isCurrent ? `0 6px 24px ${cfg.color}30` : '0 2px 8px rgba(0,0,0,0.04)'
                                    }}
                                >
                                    <div className="text-[36px] mb-2">{TIER_ICONS[t]}</div>
                                    <p className="font-display text-[16px] font-[700]" style={{ color: cfg.color }}>
                                        {cfg.label.replace(cfg.label.split(' ')[0] + ' ', '')}
                                    </p>
                                    <p className="text-[11px] mt-1" style={{ color: 'var(--stone)' }}>
                                        {cfg.min === 0 ? 'Starter tier' : `From ${cfg.min.toLocaleString()} pts`}
                                    </p>
                                    <p className="text-[11px] mt-2 font-[600]" style={{ color: 'var(--green-base)' }}>
                                        {TIER_PERKS[t]}
                                    </p>
                                    {isCurrent && (
                                        <span className="mt-3 inline-block text-[10px] px-2.5 py-1 rounded-full font-[700] uppercase tracking-wide"
                                            style={{ background: cfg.color, color: t === 'silver' ? '#333' : 'white' }}>
                                            Current
                                        </span>
                                    )}
                                    {isLocked && (
                                        <span className="mt-3 inline-block text-[10px]" style={{ color: 'var(--stone)' }}>
                                            🔒 Locked
                                        </span>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* ── HOW TO EARN ── */}
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h2 className="font-display text-[20px] font-[700] mb-5" style={{ color: 'var(--charcoal)' }}>
                        How to Earn Points
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        {earnWays.map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ y: -3 }}
                                className="bg-white rounded-[14px] p-4 text-center"
                                style={{ border: '1.5px solid var(--linen)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                            >
                                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mx-auto mb-3"
                                    style={{ background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}>
                                    {item.icon}
                                </div>
                                <p className="text-[13px] font-[600]" style={{ color: 'var(--charcoal)' }}>{item.title}</p>
                                <p className="text-[12px] mt-1 font-[700]" style={{ color: item.color }}>{item.pts}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── REFERRAL ── */}
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-[20px] p-7"
                    style={{
                        background: 'linear-gradient(135deg, var(--parchment) 0%, white 100%)',
                        border: '2px dashed rgba(217,119,6,0.4)',
                    }}
                >
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 text-[24px]"
                            style={{ background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.2)' }}>
                            🎁
                        </div>
                        <div>
                            <h2 className="font-display text-[20px] font-[700] mb-1" style={{ color: 'var(--charcoal)' }}>
                                Refer a Friend
                            </h2>
                            <p className="text-[13px]" style={{ color: 'var(--stone)' }}>
                                Share your link. When a friend places their first order, you <strong>both earn 50 points</strong>.
                            </p>
                        </div>
                    </div>

                    {referralUrl ? (
                        <>
                            <div className="rounded-[10px] px-4 py-3 mb-4 font-mono text-[13px] break-all"
                                style={{
                                    background: 'var(--parchment)', border: '1px solid var(--linen)',
                                    color: 'var(--green-dark)'
                                }}>
                                {referralUrl}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={copyLink}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[10px] text-[13px] font-[700] text-white transition-all hover:-translate-y-0.5"
                                    style={{
                                        background: 'linear-gradient(135deg, #0D2015, var(--green-dark))',
                                        boxShadow: '0 4px 14px rgba(92,110,58,0.35)'
                                    }}
                                >
                                    <Copy className="w-4 h-4" /> Copy Link
                                </button>
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`🌿 Try Zaitoon — Lahore's best shawarma!\nUse my referral link and we BOTH get 50 loyalty points:\n${referralUrl}`)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[10px] text-[13px] font-[700] text-white transition-all hover:-translate-y-0.5"
                                    style={{
                                        background: 'linear-gradient(135deg, #25D366, #20bd5a)',
                                        boxShadow: '0 4px 14px rgba(37,211,102,0.35)'
                                    }}
                                >
                                    <Share2 className="w-4 h-4" /> Share on WhatsApp
                                </a>
                            </div>
                        </>
                    ) : (
                        <p className="text-[13px] text-center py-3" style={{ color: 'var(--stone)' }}>
                            Place your first order to receive your personal referral code!
                        </p>
                    )}
                </motion.div>

                {/* ── HISTORY ── */}
                {history.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-white rounded-[16px] overflow-hidden"
                        style={{ border: '1.5px solid var(--linen)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                    >
                        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--linen)' }}>
                            <h2 className="font-display text-[20px] font-[700]" style={{ color: 'var(--charcoal)' }}>
                                Points History
                            </h2>
                        </div>
                        <table className="w-full">
                            <thead style={{ background: 'var(--cream)' }}>
                                <tr>
                                    {['Date', 'Description', 'Points'].map(h => (
                                        <th key={h} className="px-6 py-3 text-left text-[11px] font-[700] uppercase tracking-wider"
                                            style={{ color: 'var(--stone)' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((row: any, i: number) => (
                                    <motion.tr
                                        key={row.id}
                                        initial={{ opacity: 0, x: -12 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.05, duration: 0.4 }}
                                        style={{ borderTop: '1px solid var(--linen)' }}
                                    >
                                        <td className="px-6 py-3.5 text-[13px]" style={{ color: 'var(--stone)' }}>
                                            {new Date(row.created_at).toLocaleDateString('en-PK')}
                                        </td>
                                        <td className="px-6 py-3.5 text-[13px]" style={{ color: 'var(--charcoal)' }}>
                                            {row.description}
                                        </td>
                                        <td className="px-6 py-3.5 text-[13px] font-[700]"
                                            style={{ color: (row.type === 'earned' || row.type === 'bonus') ? '#16A34A' : '#DC2626' }}>
                                            {(row.type === 'earned' || row.type === 'bonus') ? '+' : '-'}{Math.abs(row.points)}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </div>

            <Footer />
        </div>
    )
}
