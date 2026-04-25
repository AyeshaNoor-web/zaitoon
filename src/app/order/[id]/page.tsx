'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, MessageCircle, MapPin, ChevronRight, ShoppingBag, Star } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ReviewModal from '@/components/ReviewModal'
import { getOrderByNumber, subscribeToOrder } from '@/lib/api/orders'
import { hasCustomerReviewed } from '@/lib/api/reviews'
import { buildWhatsAppURL } from '@/lib/whatsapp'
import { formatPrice } from '@/lib/payment'
import { useAuthStore } from '@/store/useAuthStore'

const STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'] as const

const STATUS_LABELS: Record<string, { label: string; desc: string }> = {
    pending: { label: 'Order Placed', desc: 'We received your order — thank you!' },
    confirmed: { label: 'Confirmed', desc: 'Restaurant confirmed your order ✅' },
    preparing: { label: 'Preparing', desc: 'Chef is preparing your food 🔥' },
    out_for_delivery: { label: 'Out for Delivery', desc: 'Rider is on the way! 🛵' },
    delivered: { label: 'Delivered', desc: 'Enjoy your warm meal! 🎉' },
}

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
    // Next.js 15+ requires params to be awaited
    const { id } = use(params)
    const { customer, isAuthenticated } = useAuthStore()

    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [statusIdx, setStatusIdx] = useState(0)
    const [timeLeft, setTimeLeft] = useState(35 * 60)
    const [reviewOpen, setReviewOpen] = useState(false)
    const [alreadyReviewed, setAlreadyReviewed] = useState(false)

    useEffect(() => {
        let channel: { unsubscribe: () => void } | undefined

        const fetchOrder = async () => {
            try {
                const data = await getOrderByNumber(id)
                setOrder(data)
                setStatusIdx(Math.max(0, STATUSES.indexOf(data.status as any)))

                // Subscribe to realtime status changes
                // IMPORTANT: callback re-fetches the full order (with joins) instead of
                // using payload.new which is just the raw row with no order_items/branches
                channel = subscribeToOrder(data.id, async () => {
                    try {
                        const refreshed = await getOrderByNumber(id)
                        setOrder(refreshed)
                        setStatusIdx(Math.max(0, STATUSES.indexOf(refreshed.status as any)))
                    } catch { /* ignore */ }
                })
            } catch {
                setNotFound(true)
            } finally {
                setLoading(false)
            }
        }

        fetchOrder()
        return () => { channel?.unsubscribe() }
    }, [id])

    // Check if already reviewed once order is delivered & customer is logged in
    useEffect(() => {
        if (order?.status === 'delivered' && isAuthenticated && customer?.id) {
            hasCustomerReviewed(customer.id, order.id).then(setAlreadyReviewed)
        }
    }, [order?.status, order?.id, isAuthenticated, customer?.id])

    // Countdown timer
    useEffect(() => {
        const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000)
        return () => clearInterval(t)
    }, [])

    const mins = Math.floor(timeLeft / 60)
    const secs = String(timeLeft % 60).padStart(2, '0')

    // ── Loading ───────────────────────────────────────────────
    if (loading) return (
        <>
            <Navbar />
            <main role="main" className="min-h-screen bg-[#0D2015] pt-[120px] pb-16 px-4 flex items-center justify-center">
                <div role="status" aria-busy="true" className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-[3px] border-[var(--orange-warm)] border-t-transparent rounded-full animate-spin" />
                    <p className="font-[600] text-[var(--orange-pale)]">Loading order details…</p>
                </div>
            </main>
            <Footer />
        </>
    )

    // ── Not found ─────────────────────────────────────────────
    if (notFound || !order) return (
        <>
            <Navbar />
            <main role="main" className="min-h-screen bg-[#0D2015] pt-[120px] pb-16 px-4 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-5xl">🔍</p>
                    <h1 className="text-[22px] font-display font-[700] text-[var(--orange-pale)]">Order not found</h1>
                    <p className="text-white/75 text-sm">
                        No order found with number <span className="font-mono text-white/85">#{id}</span>
                    </p>
                    <Link
                        href="/order"
                        className="inline-block mt-4 text-[var(--orange-pale)] border border-[var(--orange-warm)] px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[var(--orange-warm)]/10 transition-colors"
                    >
                        ← Try another order
                    </Link>
                </div>
            </main>
            <Footer />
        </>
    )

    // ── Data ──────────────────────────────────────────────────
    const branch = order.branches ?? {}
    const progressPct = STATUSES.length <= 1 ? 0 : (statusIdx / (STATUSES.length - 1)) * 100

    // Build WhatsApp URL only if branch has a whatsapp number
    const waURL = branch?.whatsapp
        ? buildWhatsAppURL(branch.whatsapp, {
            orderNumber: id,
            customerName: order.customer_name ?? '',
            customerPhone: order.customer_phone ?? '',
            orderType: order.order_type,
            deliveryAddress: order.delivery_address ?? undefined,
            branchName: branch.name ?? 'Zaitoon',
            items: (order.order_items ?? []).map((i: any) => ({
                name: i.name,
                size: i.size ?? null,
                quantity: i.quantity,
                unitPrice: i.unit_price,
                subtotal: i.subtotal,
            })),
            subtotal: order.subtotal ?? 0,
            deliveryFee: order.delivery_fee ?? 0,
            loyaltyDiscount: order.loyalty_discount ?? 0,
            total: order.total ?? 0,
            paymentMethod: order.payment_method ?? 'cod',
        })
        : null

    // ── Render ────────────────────────────────────────────────
    return (
        <>
            <Navbar />

            <main role="main" className="min-h-screen pt-[100px] pb-[80px] px-4"
                style={{ background: 'linear-gradient(180deg, #0D2015 0%, #1e2b12 100%)' }}>
                {/* ambient glow */}
                <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none opacity-10"
                    style={{ background: 'radial-gradient(circle, var(--orange-warm) 0%, transparent 70%)' }} />

                <div className="max-w-[600px] mx-auto space-y-5 relative z-10">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
                        className="text-center pt-2 pb-2"
                    >
                        <span className="text-[11px] font-[700] uppercase tracking-[0.18em] mb-2 block" style={{ color: 'var(--orange-warm)', opacity: 0.8 }}>
                            Zaitoon Connect
                        </span>
                        <h1 className="text-white font-display text-[32px] font-[800]">Order #{id}</h1>
                    </motion.div>

                    {/* Status Tracker */}
                    <motion.section
                        aria-label="Order status"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.1, ease: [0.16,1,0.3,1] }}
                        className="rounded-[16px] p-6"
                        style={{
                            background: 'rgba(253,248,240,0.04)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(253,248,240,0.10)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}
                    >
                        <div className="flex items-center justify-between mb-5 pb-3"
                            style={{ borderBottom: '1px solid rgba(253,248,240,0.08)' }}>
                            <h2 className="text-[20px] font-display font-[700] text-white">
                                Status Tracker
                            </h2>
                            {statusIdx < STATUSES.length - 1 && (
                                <span className="flex items-baseline gap-1 px-3 py-1 rounded-full text-[13px] font-[700]"
                                    style={{ background: 'rgba(217,119,6,0.15)', color: 'var(--orange-pale)', border: '1px solid rgba(217,119,6,0.25)' }}>
                                    <span className="text-[18px] leading-none">{mins}</span>m
                                    <span>{secs}s</span>
                                    <span className="text-[11px] font-[400] ml-0.5" style={{ color: 'rgba(253,248,240,0.8)' }}>est.</span>
                                </span>
                            )}
                        </div>

                        {/* Gradient Progress bar */}
                        <div className="w-full h-[6px] rounded-full mb-8 overflow-hidden" style={{ background: 'rgba(253,248,240,0.08)' }} aria-hidden="true">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: 'linear-gradient(90deg, var(--orange-warm), var(--orange-bright))' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPct}%` }}
                                transition={{ duration: 1.2, ease: [0.16,1,0.3,1] }}
                            />
                        </div>

                        <ul role="list" aria-label="Tracking timeline" className="space-y-6">
                            {STATUSES.map((s, i) => {
                                const isDone = i <= statusIdx
                                const isActive = i === statusIdx
                                const info = STATUS_LABELS[s]
                                return (
                                    <li key={s} className="flex gap-4 relative" aria-current={isActive ? 'step' : undefined}>
                                        <div className="relative pt-[2px]">
                                            {/* Connector line */}
                                            {i < STATUSES.length - 1 && (
                                                <div
                                                    className="absolute top-[28px] left-[13px] w-[2px] h-[36px]"
                                                    style={{ backgroundColor: isDone ? 'var(--orange-warm)' : 'var(--linen)' }}
                                                    aria-hidden="true"
                                                />
                                            )}

                                            <div
                                                className="w-[28px] h-[28px] rounded-full flex items-center justify-center border-[2px] shrink-0 z-10 bg-white"
                                                style={{
                                                    borderColor: isDone ? 'var(--orange-warm)' : 'var(--linen)',
                                                    color: isDone ? 'var(--orange-warm)' : 'var(--linen)',
                                                }}
                                            >
                                                {isDone && <Check className="w-[14px] h-[14px]" strokeWidth={3} />}
                                            </div>

                                            {/* Pulse ring on active step */}
                                            {isActive && i < STATUSES.length - 1 && (
                                                <motion.div
                                                    className="absolute top-[2px] left-0 w-[28px] h-[28px] rounded-full border-[2px] border-[var(--orange-warm)]"
                                                    initial={{ opacity: 0.8, scale: 1 }}
                                                    animate={{ opacity: 0, scale: 1.6 }}
                                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </div>

                                        <div className="flex-1 pt-[2px]">
                                            <div className={`font-[700] text-[15px] ${isActive ? 'text-[var(--green-base)]' : isDone ? 'text-[var(--charcoal)]' : 'text-[var(--stone)]'}`}>
                                                {info.label}
                                            </div>
                                            <div className="text-[13px] text-[var(--stone)] mt-1 font-[400]">
                                                {info.desc}
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>

                        {/* Dev helper to advance status without touching DB */}
                        {process.env.NODE_ENV === 'development' && (
                            <button
                                onClick={() => setStatusIdx(i => Math.min(i + 1, STATUSES.length - 1))}
                                className="mt-6 text-[11px] text-[var(--stone)] underline"
                            >
                                [Dev] Advance status locally
                            </button>
                        )}
                    </motion.section>

                    {/* Receipt */}
                    <motion.section
                        aria-label="Order Receipt"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.2, ease: [0.16,1,0.3,1] }}
                        className="rounded-[16px] p-6"
                        style={{
                            background: 'rgba(253,248,240,0.05)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(253,248,240,0.1)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                        }}
                    >
                        <h2 className="text-[18px] mb-4 font-display font-[700] text-white flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5" style={{ color: 'var(--orange-warm)' }} /> Receipt
                        </h2>

                        <ul role="list" aria-label="Items ordered" className="space-y-3 mb-4">
                            {(order.order_items ?? []).map((item: any) => (
                                <li key={item.id} className="flex justify-between items-start text-[14px]">
                                    <div className="flex gap-2">
                                        <span className="font-[600]" style={{ color: 'rgba(253,248,240,0.8)' }}>{item.quantity}×</span>
                                        <span>
                                            <span className="font-[500] text-white">{item.name}</span>
                                            {item.size && (
                                                <span className="text-[12px] capitalize block" style={{ color: 'rgba(253,248,240,0.8)' }}>
                                                    ({item.size})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <span className="font-[700] shrink-0" style={{ color: 'var(--orange-pale)' }}>
                                        {formatPrice(item.subtotal)}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="my-4 h-[1px]" style={{ background: 'rgba(253,248,240,0.08)' }} aria-hidden="true" />

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-[13px]" style={{ color: 'rgba(253,248,240,0.8)' }}>
                                <span>Subtotal</span>
                                <span className="text-white font-[600]">{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-[13px]" style={{ color: 'rgba(253,248,240,0.8)' }}>
                                <span>Delivery Fee</span>
                                <span className="text-white font-[600]">{(order.delivery_fee ?? 0) > 0 ? formatPrice(order.delivery_fee) : 'Free'}</span>
                            </div>
                            {(order.loyalty_discount ?? 0) > 0 && (
                                <div className="flex justify-between text-[13px] font-[700]" style={{ color: 'var(--orange-warm)' }}>
                                    <span>Loyalty Redeem</span>
                                    <span>−{formatPrice(order.loyalty_discount)}</span>
                                </div>
                            )}
                        </div>

                        <div className="my-4 h-[1px]" style={{ background: 'rgba(253,248,240,0.12)' }} aria-hidden="true" />

                        <div className="flex justify-between items-baseline mb-4">
                            <span className="text-[15px] font-[700] text-white">Total</span>
                            <span className="font-display font-[800] text-[28px]" style={{ color: 'var(--orange-pale)' }}>
                                {formatPrice(order.total)}
                            </span>
                        </div>

                        {order.delivery_address && (
                            <div className="flex items-start gap-3 p-4 rounded-[10px]" style={{ background: 'rgba(253,248,240,0.05)', border: '1px solid rgba(253,248,240,0.08)' }}>
                                <MapPin className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--orange-warm)' }} />
                                <div className="text-[13px] leading-snug">
                                    <strong className="text-white block mb-[2px]">Delivery Address</strong>
                                    <span style={{ color: 'rgba(253,248,240,0.82)' }}>{order.delivery_address}</span>
                                </div>
                            </div>
                        )}
                    </motion.section>

                    {/* Review prompt — only when delivered, logged in, not yet reviewed */}
                    {order.status === 'delivered' && isAuthenticated && customer && !alreadyReviewed && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-[var(--orange-warm)]/10 border-[2px] border-[var(--orange-warm)] rounded-[8px] p-5 flex items-center justify-between gap-4"
                        >
                            <div>
                                <p className="font-[700] text-[var(--orange-pale)] text-[15px] leading-snug">
                                    How was your meal? ⭐
                                </p>
                                <p className="text-[var(--orange-pale)]/90 text-[13px] mt-0.5">
                                    Leave a review — earn <strong>20 pts</strong>!
                                </p>
                            </div>
                            <button
                                onClick={() => setReviewOpen(true)}
                                className="shrink-0 flex items-center gap-2 bg-[var(--orange-warm)] text-[#0D2015] font-[700] text-[13px] px-4 py-2.5 rounded-[6px] hover:bg-[var(--orange-bright)] transition-colors"
                            >
                                <Star className="w-4 h-4" fill="currentColor" />
                                Rate Now
                            </button>
                        </motion.div>
                    )}

                    {/* WhatsApp CTA */}
                    {waURL && (
                        <motion.a
                            href={waURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center justify-between px-6 py-4 rounded-[16px] text-white block"
                            style={{
                                background: 'linear-gradient(135deg, #25D366, #20bd5a)',
                                boxShadow: '0 8px 24px rgba(37,211,102,0.35)'
                            }}
                            aria-label="Confirm and send order to WhatsApp"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <span className="font-[700] text-[16px] block mb-[2px] leading-tight">Confirm on WhatsApp</span>
                                    <span className="font-[400] text-[13px]" style={{ color: 'rgba(255,255,255,0.8)' }}>Send order to restaurant instantly.</span>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.7)' }} />
                        </motion.a>
                    )}

                    <div className="text-center pt-4">
                        <Link
                            href="/menu"
                            className="text-[14px] font-[600] transition-colors"
                            style={{ color: 'rgba(253,248,240,0.82)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--orange-pale)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(253,248,240,0.82)' }}
                        >
                            ← Return to Menu
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Review Modal */}
            {order && customer && (
                <ReviewModal
                    isOpen={reviewOpen}
                    onClose={() => {
                        setReviewOpen(false)
                        setAlreadyReviewed(true)
                    }}
                    orderId={order.id}
                    customerId={customer.id}
                    orderNumber={id}
                />
            )}
        </>
    )
}
