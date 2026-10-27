'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, MessageCircle, MapPin, Star, X, ArrowLeft, Clock, Search } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ReviewModal from '@/components/ReviewModal'
import { getOrderByNumber } from '@/lib/api/orders'
import { hasCustomerReviewed } from '@/lib/api/reviews'
import { buildWhatsAppURL } from '@/lib/whatsapp'
import { formatPrice } from '@/lib/payment'
import { titleCase } from '@/lib/site'
import { useAuthStore } from '@/store/useAuthStore'
import { useHydrated } from '@/store/hydration'
import type { Order, OrderItem } from '@/types'

const STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'] as const

function stepsFor(orderType: Order['order_type']) {
    const delivery = orderType === 'delivery'
    return [
        { key: 'pending', label: 'Order placed', desc: 'We have your order.' },
        { key: 'confirmed', label: 'Confirmed', desc: 'The branch accepted your order.' },
        { key: 'preparing', label: 'On the grill', desc: 'The kitchen is cooking it now.' },
        { key: 'out_for_delivery', label: delivery ? 'Out for delivery' : 'Ready', desc: delivery ? 'Your rider is on the way.' : 'Ready at the counter.' },
        { key: 'delivered', label: delivery ? 'Delivered' : 'Collected', desc: 'Enjoy your meal.' },
    ]
}

const timeFmt = (d: Date) => d.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const hydrated = useHydrated()
    const { customer, isAuthenticated } = useAuthStore()

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [reviewOpen, setReviewOpen] = useState(false)
    const [alreadyReviewed, setAlreadyReviewed] = useState(false)

    const [isOwner, setIsOwner] = useState(false)
    const [loadError, setLoadError] = useState(false)

    // Poll while the order is in progress. (Realtime would need the public key to
    // read every order in the database, so the server endpoint is polled instead.)
    useEffect(() => {
        let cancelled = false
        let timer: ReturnType<typeof setTimeout> | undefined

        const load = async () => {
            try {
                const res = await getOrderByNumber(id)
                if (cancelled) return
                setLoadError(false)
                if (res) {
                    setOrder(res.order)
                    setIsOwner(res.isOwner)
                    if (['delivered', 'cancelled'].includes(res.order.status)) return
                }
            } catch {
                // Keep the last known state; only surface the error if we have nothing to show
                if (!cancelled) setLoadError(true)
            }
            finally { if (!cancelled) setLoading(false) }
            if (!cancelled) timer = setTimeout(load, 15000)
        }
        load()

        return () => { cancelled = true; if (timer) clearTimeout(timer) }
    }, [id])

    const signedIn = hydrated && isAuthenticated && !!customer
    const orderId = order?.id
    const delivered = order?.status === 'delivered'
    useEffect(() => {
        if (delivered && isOwner && orderId) hasCustomerReviewed(orderId).then(setAlreadyReviewed)
    }, [delivered, isOwner, orderId])

    if (loading) {
        return (
            <>
                <Navbar />
                <main id="main" className="pt-nav min-h-screen">
                    <div className="container-page max-w-3xl space-y-5 py-12" role="status" aria-busy="true">
                        <div className="skeleton h-10 w-64 rounded-full" />
                        <div className="skeleton h-[280px] rounded-[28px]" />
                        <div className="skeleton h-[320px] rounded-[28px]" />
                    </div>
                </main>
            </>
        )
    }

    if (!order && loadError) {
        return (
            <>
                <Navbar />
                <main id="main" className="pt-nav min-h-screen">
                    <div role="alert" className="container-page flex max-w-md flex-col items-center py-28 text-center">
                        <h1 className="text-4xl">We couldn&apos;t load this order</h1>
                        <p className="mt-3 text-ink-2">Check your connection and try again in a moment.</p>
                        <button onClick={() => window.location.reload()} className="btn-outline-dark mt-8">Try again</button>
                    </div>
                </main>
            </>
        )
    }

    if (!order) {
        return (
            <>
                <Navbar />
                <main id="main" className="pt-nav min-h-screen">
                    <div className="container-page flex max-w-md flex-col items-center py-28 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-paper-2">
                            <Search className="h-7 w-7 text-ink-3" />
                        </div>
                        <h1 className="mt-6 text-4xl">Order not found</h1>
                        <p className="mt-3 text-ink-2">
                            We couldn&apos;t find an order numbered <span className="font-semibold text-ink">#{id}</span>. Check the number and try again.
                        </p>
                        <Link href="/order" className="btn-outline-dark mt-8">Try another number</Link>
                    </div>
                </main>
                <Footer />
            </>
        )
    }

    const steps = stepsFor(order.order_type)
    const statusIdx = Math.max(0, STATUSES.indexOf(order.status as typeof STATUSES[number]))
    const cancelled = order.status === 'cancelled'
    const finished = order.status === 'delivered'
    const placedAt = new Date(order.created_at)
    const eta = new Date(placedAt.getTime() + (order.order_type === 'delivery' ? 45 : 25) * 60_000)
    const branch = order.branches

    const waURL = branch?.whatsapp
        ? buildWhatsAppURL(branch.whatsapp, {
            orderNumber: order.order_number,
            customerName: order.customer_name ?? '',
            customerPhone: order.customer_phone ?? '',
            orderType: order.order_type,
            deliveryAddress: order.delivery_address ?? undefined,
            branchName: branch.name ?? 'Zaitoon',
            items: (order.order_items ?? []).map((i: OrderItem) => ({
                name: i.name, size: i.size ?? null, quantity: i.quantity, unitPrice: i.unit_price, subtotal: i.subtotal,
            })),
            subtotal: order.subtotal ?? 0,
            deliveryFee: order.delivery_fee ?? 0,
            loyaltyDiscount: order.loyalty_discount ?? 0,
            tierDiscount: order.tier_discount ?? 0,
            total: order.total ?? 0,
            paymentMethod: order.payment_method ?? 'cod',
        })
        : null

    return (
        <>
            <Navbar />

            <main id="main" className="pt-nav min-h-screen pb-24">
                <div className="container-page max-w-3xl py-10 lg:py-14">
                    <Link href="/order" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink">
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> Track another order
                    </Link>

                    <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-[clamp(2.25rem,5vw,3.25rem)]">Order #{order.order_number}</h1>
                            <p className="mt-2 text-ink-2">
                                {titleCase(order.order_type)} · placed {placedAt.toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                            </p>
                        </div>
                        {!cancelled && !finished && (
                            <p className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-medium text-ink shadow-[var(--shadow-soft)] ring-1 ring-line">
                                <Clock className="h-4 w-4 text-ember-600" />
                                {order.order_type === 'delivery' ? 'Arriving' : 'Ready'} around <span className="tabular font-semibold">{timeFmt(eta)}</span>
                            </p>
                        )}
                    </header>

                    {/* Status */}
                    <motion.section
                        aria-label="Order status"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="panel mt-8 p-6 sm:p-8"
                    >
                        {cancelled ? (
                            <div className="flex items-start gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                                    <X className="h-6 w-6" />
                                </span>
                                <div>
                                    <h2 className="text-2xl">This order was cancelled</h2>
                                    <p className="mt-1.5 text-ink-2">If you didn&apos;t expect this, message the branch and we&apos;ll sort it out.</p>
                                </div>
                            </div>
                        ) : (
                            <ol aria-label="Tracking timeline">
                                {steps.map((s, i) => {
                                    const done = i < statusIdx || finished
                                    const active = i === statusIdx && !finished
                                    const last = i === steps.length - 1
                                    return (
                                        <li key={s.key} className="relative flex gap-4 pb-7 last:pb-0" aria-current={active ? 'step' : undefined}>
                                            {!last && (
                                                <span aria-hidden="true" className={`absolute start-[15px] top-8 h-[calc(100%-32px)] w-0.5 rounded-full ${done ? 'bg-olive-600' : 'bg-line'}`} />
                                            )}
                                            <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${done
                                                ? 'border-olive-600 bg-olive-600 text-white'
                                                : active ? 'border-ember-500 bg-surface' : 'border-line bg-surface'}`}>
                                                {done && <Check className="h-4 w-4" strokeWidth={3} />}
                                                {active && <span className="h-2.5 w-2.5 rounded-full bg-ember-500 animate-ember-pulse" />}
                                            </span>
                                            <div className="pt-1">
                                                <p className={`font-semibold ${active ? 'text-ink' : done ? 'text-ink' : 'text-ink-3'}`}>{s.label}</p>
                                                <p className={`mt-0.5 text-sm ${active ? 'text-ink-2' : 'text-ink-3'}`}>{s.desc}</p>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ol>
                        )}
                    </motion.section>

                    {/* Confirm on WhatsApp — only useful while the branch hasn't confirmed yet */}
                    {waURL && isOwner && order.status === 'pending' && (
                        <a
                            href={waURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 flex items-center justify-between gap-4 rounded-[24px] bg-olive-800 px-6 py-5 text-paper transition-colors hover:bg-olive-900"
                        >
                            <span className="flex items-center gap-4">
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                                    <MessageCircle className="h-5 w-5" />
                                </span>
                                <span>
                                    <span className="block font-semibold">Confirm on WhatsApp</span>
                                    <span className="block text-sm text-paper/70">Send the order to {branch?.name ?? 'the branch'} so they can start cooking.</span>
                                </span>
                            </span>
                            <ArrowLeft className="h-5 w-5 shrink-0 rotate-180 rtl:rotate-0" />
                        </a>
                    )}

                    {finished && signedIn && isOwner && !alreadyReviewed && (
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-ember-100/70 px-6 py-5">
                            <div>
                                <p className="font-semibold text-ink">How was everything?</p>
                                <p className="text-sm text-ink-2">A quick rating helps the kitchen.</p>
                            </div>
                            <button onClick={() => setReviewOpen(true)} className="btn-primary !min-h-11">
                                <Star className="h-4 w-4 fill-current" /> Rate your order
                            </button>
                        </div>
                    )}

                    {/* Receipt */}
                    <section aria-labelledby="receipt-title" className="panel mt-5 p-6 sm:p-8">
                        <h2 id="receipt-title" className="text-2xl">Receipt</h2>

                        <ul className="mt-5 space-y-3">
                            {(order.order_items ?? []).map((item: OrderItem) => (
                                <li key={item.id} className="flex items-start justify-between gap-4 text-[0.9375rem]">
                                    <div className="flex gap-3">
                                        <span className="tabular flex h-6 min-w-6 items-center justify-center rounded-md bg-paper-2 px-1.5 text-xs font-semibold">{item.quantity}</span>
                                        <div>
                                            <p className="font-medium text-ink">{item.name}</p>
                                            {item.size && <p className="text-[0.8125rem] text-ink-2">{item.size === 'small' ? 'Regular' : 'Large'}</p>}
                                        </div>
                                    </div>
                                    <span className="price shrink-0">{formatPrice(item.subtotal)}</span>
                                </li>
                            ))}
                        </ul>

                        <dl className="mt-5 space-y-2 border-t border-line pt-5 text-[0.9375rem]">
                            <div className="flex justify-between"><dt className="text-ink-2">Subtotal</dt><dd className="price">{formatPrice(order.subtotal)}</dd></div>
                            {order.order_type === 'delivery' && (
                                <div className="flex justify-between">
                                    <dt className="text-ink-2">Delivery</dt>
                                    <dd className="price">{(order.delivery_fee ?? 0) > 0 ? formatPrice(order.delivery_fee) : 'Free'}</dd>
                                </div>
                            )}
                            {(order.tier_discount ?? 0) > 0 && (
                                <div className="flex justify-between text-success"><dt>Member discount</dt><dd className="price">−{formatPrice(order.tier_discount)}</dd></div>
                            )}
                            {(order.loyalty_discount ?? 0) > 0 && (
                                <div className="flex justify-between text-success"><dt>Loyalty points</dt><dd className="price">−{formatPrice(order.loyalty_discount)}</dd></div>
                            )}
                        </dl>
                        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                            <span className="font-semibold">Total</span>
                            <span className="price text-[1.75rem]">{formatPrice(order.total)}</span>
                        </div>
                        <p className="mt-1 text-end text-[0.8125rem] text-ink-3">
                            {order.payment_method === 'jazzcash' ? 'JazzCash' : order.order_type === 'delivery' ? 'Cash on delivery' : 'Pay at the counter'}
                        </p>

                        {order.delivery_address && (
                            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-paper p-4">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-olive-600" />
                                <div className="text-sm">
                                    <p className="font-semibold text-ink">Delivering to</p>
                                    <p className="mt-0.5 text-ink-2">{order.delivery_address}</p>
                                </div>
                            </div>
                        )}
                    </section>

                    <div className="mt-8 text-center">
                        <Link href="/menu" className="btn-quiet">
                            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> Back to the menu
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />

            {customer && (
                <ReviewModal
                    isOpen={reviewOpen}
                    onClose={() => { setReviewOpen(false); setAlreadyReviewed(true) }}
                    orderId={order.id}
                    orderNumber={order.order_number}
                />
            )}
        </>
    )
}
