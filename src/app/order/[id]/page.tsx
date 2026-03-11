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
            <main role="main" className="min-h-screen bg-[var(--olive-darkest)] pt-[120px] pb-16 px-4 flex items-center justify-center">
                <div role="status" aria-busy="true" className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-[3px] border-[var(--amber-warm)] border-t-transparent rounded-full animate-spin" />
                    <p className="font-[600] text-[var(--amber-pale)]">Loading order details…</p>
                </div>
            </main>
            <Footer />
        </>
    )

    // ── Not found ─────────────────────────────────────────────
    if (notFound || !order) return (
        <>
            <Navbar />
            <main role="main" className="min-h-screen bg-[var(--olive-darkest)] pt-[120px] pb-16 px-4 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-5xl">🔍</p>
                    <h1 className="text-[22px] font-display font-[700] text-[var(--amber-pale)]">Order not found</h1>
                    <p className="text-white/50 text-sm">
                        No order found with number <span className="font-mono text-white/70">#{id}</span>
                    </p>
                    <Link
                        href="/order"
                        className="inline-block mt-4 text-[var(--amber-pale)] border border-[var(--amber-warm)] px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[var(--amber-warm)]/10 transition-colors"
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

            <main role="main" className="min-h-screen bg-[var(--olive-darkest)] pt-[100px] pb-[80px] px-4">
                <div className="max-w-[600px] mx-auto space-y-6">

                    {/* Header */}
                    <div className="text-center pt-2 pb-2">
                        <span className="text-[12px] font-[600] text-[var(--amber-pale)] uppercase tracking-[0.1em] mb-1 block">
                            Zaitoon Connect
                        </span>
                        <h1 className="text-white font-display text-[28px] font-[700]">Order #{id}</h1>
                    </div>

                    {/* Status Tracker */}
                    <section aria-label="Order status" className="bg-white rounded-[8px] p-6 border-[2px] border-[var(--linen)]">
                        <h2 className="text-[20px] mb-5 font-display font-[700] text-[var(--charcoal)] border-b border-[var(--linen)] pb-2 flex items-center justify-between">
                            Status Tracker
                            {statusIdx < STATUSES.length - 1 && (
                                <span className="text-[14px] font-[700] text-[var(--olive-base)] font-body flex gap-1 items-baseline">
                                    <span className="text-[20px]">{mins}</span>m
                                    <span className="text-[14px]">{secs}s</span>
                                    <span className="text-[12px] font-normal text-[var(--stone)] ml-1">est.</span>
                                </span>
                            )}
                        </h2>

                        {/* Progress bar */}
                        <div className="w-full bg-[var(--linen)] h-[6px] rounded-full mb-8 relative overflow-hidden" aria-hidden="true">
                            <motion.div
                                className="absolute top-0 left-0 bottom-0 bg-[var(--amber-warm)] rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPct}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
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
                                                    style={{ backgroundColor: isDone ? 'var(--amber-warm)' : 'var(--linen)' }}
                                                    aria-hidden="true"
                                                />
                                            )}

                                            <div
                                                className="w-[28px] h-[28px] rounded-full flex items-center justify-center border-[2px] shrink-0 z-10 bg-white"
                                                style={{
                                                    borderColor: isDone ? 'var(--amber-warm)' : 'var(--linen)',
                                                    color: isDone ? 'var(--amber-warm)' : 'var(--linen)',
                                                }}
                                            >
                                                {isDone && <Check className="w-[14px] h-[14px]" strokeWidth={3} />}
                                            </div>

                                            {/* Pulse ring on active step */}
                                            {isActive && i < STATUSES.length - 1 && (
                                                <motion.div
                                                    className="absolute top-[2px] left-0 w-[28px] h-[28px] rounded-full border-[2px] border-[var(--amber-warm)]"
                                                    initial={{ opacity: 0.8, scale: 1 }}
                                                    animate={{ opacity: 0, scale: 1.6 }}
                                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </div>

                                        <div className="flex-1 pt-[2px]">
                                            <div className={`font-[700] text-[15px] ${isActive ? 'text-[var(--olive-base)]' : isDone ? 'text-[var(--charcoal)]' : 'text-[var(--stone)]'}`}>
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
                    </section>

                    {/* Receipt */}
                    <section aria-label="Order Receipt" className="bg-[var(--parchment)] rounded-[8px] p-6 border border-[var(--linen)]">
                        <h2 className="text-[18px] mb-4 font-display font-[700] text-[var(--charcoal)] flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5" /> Receipt
                        </h2>

                        <ul role="list" aria-label="Items ordered" className="space-y-3 mb-4">
                            {(order.order_items ?? []).map((item: any) => (
                                <li key={item.id} className="flex justify-between items-start text-[14px]">
                                    <div className="flex gap-2 text-[var(--charcoal)]">
                                        <span className="font-[600] text-[var(--stone)]">{item.quantity}×</span>
                                        <span>
                                            <span className="font-[500]">{item.name}</span>
                                            {item.size && (
                                                <span className="text-[12px] text-[var(--stone)] capitalize block">
                                                    ({item.size})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <span className="font-[600] text-[var(--charcoal)] shrink-0">
                                        {formatPrice(item.subtotal)}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="border-t-[2px] border-[var(--linen)] border-dashed my-4" aria-hidden="true" />

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-[13px] text-[var(--stone)]">
                                <span>Subtotal</span>
                                <span>{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-[13px] text-[var(--stone)]">
                                <span>Delivery Fee</span>
                                <span>{(order.delivery_fee ?? 0) > 0 ? formatPrice(order.delivery_fee) : 'Free'}</span>
                            </div>
                            {(order.loyalty_discount ?? 0) > 0 && (
                                <div className="flex justify-between text-[13px] font-[600] text-[var(--amber-warm)]">
                                    <span>Loyalty Redeem</span>
                                    <span>−{formatPrice(order.loyalty_discount)}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t-[2px] border-[var(--olive-dark)] my-4" aria-hidden="true" />

                        <div className="flex justify-between items-baseline mb-4">
                            <span className="text-[16px] font-[700] text-[var(--charcoal)]">Total</span>
                            <span className="font-display font-[700] text-[24px] text-[var(--olive-base)]">
                                {formatPrice(order.total)}
                            </span>
                        </div>

                        {order.delivery_address && (
                            <div className="flex items-start gap-3 p-4 bg-white border border-[var(--linen)] rounded-[6px]">
                                <MapPin className="w-5 h-5 text-[var(--amber-warm)] shrink-0 mt-0.5" />
                                <div className="text-[13px] text-[var(--stone)] leading-snug">
                                    <strong className="text-[var(--charcoal)] block mb-[2px]">Delivery Address</strong>
                                    {order.delivery_address}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Review prompt — only when delivered, logged in, not yet reviewed */}
                    {order.status === 'delivered' && isAuthenticated && customer && !alreadyReviewed && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-[var(--amber-warm)]/10 border-[2px] border-[var(--amber-warm)] rounded-[8px] p-5 flex items-center justify-between gap-4"
                        >
                            <div>
                                <p className="font-[700] text-[var(--amber-pale)] text-[15px] leading-snug">
                                    How was your meal? ⭐
                                </p>
                                <p className="text-[var(--amber-pale)]/70 text-[13px] mt-0.5">
                                    Leave a review — earn <strong>20 pts</strong>!
                                </p>
                            </div>
                            <button
                                onClick={() => setReviewOpen(true)}
                                className="shrink-0 flex items-center gap-2 bg-[var(--amber-warm)] text-[var(--olive-darkest)] font-[700] text-[13px] px-4 py-2.5 rounded-[6px] hover:bg-[var(--amber-bright)] transition-colors"
                            >
                                <Star className="w-4 h-4" fill="currentColor" />
                                Rate Now
                            </button>
                        </motion.div>
                    )}

                    {/* WhatsApp CTA */}
                    {waURL && (
                        <a
                            href={waURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#25D366] text-white px-6 py-4 rounded-[6px] shadow-[0_4px_16px_rgba(37,211,102,0.3)] flex items-center justify-between hover:-translate-y-1 transition-transform block"
                            aria-label="Confirm and send order to WhatsApp"
                        >
                            <div className="flex items-center gap-4">
                                <MessageCircle className="w-7 h-7" />
                                <div className="text-left">
                                    <span className="font-[700] text-[16px] block mb-[2px] leading-tight">Confirm on WhatsApp</span>
                                    <span className="font-[400] text-[13px] text-white/90">Send order to restaurant instantly.</span>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6" />
                        </a>
                    )}

                    <div className="text-center pt-4">
                        <Link
                            href="/menu"
                            className="text-[var(--amber-pale)] text-[14px] font-[600] border-b border-transparent hover:border-[var(--amber-pale)] pb-0.5 transition-colors"
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
