'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, Store, Utensils, Check, MapPin, ArrowLeft, ArrowRight, Banknote, Smartphone, Gift, AlertTriangle, MessageCircle, Loader2, ShoppingBag, Pencil } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import LocationModal from '@/components/LocationModal'
import { toast } from 'sonner'
import { useCartStore } from '@/store/useCartStore'
import { useLocationStore } from '@/store/useLocationStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useHydrated } from '@/store/hydration'
import { getBranches } from '@/lib/api/branches'
import { placeOrder as submitOrder } from '@/lib/api/orders'
import { formatPrice } from '@/lib/payment'
import { calculateRealWorldDistance, getDeliveryFeeDetails, formatDistance } from '@/lib/distance'
import { getDeliverySettings, DeliveryConfig, DEFAULT_DELIVERY_CONFIG } from '@/lib/api/settings'
import { applyTierPerks, maxRedeemablePoints } from '@/lib/utils/loyalty'
import { translations } from '@/lib/translations'
import { SITE, titleCase } from '@/lib/site'
import type { Branch, LoyaltyTier } from '@/types'

// ── Phone helpers ─────────────────────────────────────────────
function isValidPakistaniPhone(raw: string): boolean {
    const digits = raw.replace(/\D/g, '')
    return (digits.startsWith('03') && digits.length === 11) || (digits.startsWith('923') && digits.length === 12)
}

function phoneError(raw: string): string | null {
    const digits = raw.replace(/\D/g, '')
    if (digits.length < 4) return null // still typing
    return isValidPakistaniPhone(raw) ? null : 'Enter a valid Pakistani mobile number, e.g. 0329-1330234'
}

function normalisePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('92')) return `+${digits}`
    if (digits.startsWith('0')) return `+92${digits.slice(1)}`
    return `+92${digits}`
}

interface Placed { orderNumber: string; waURL: string; total: number; points: number }

// ── Page shell: waits for persisted stores and owns the success screen ──
export default function CheckoutPage() {
    const hydrated = useHydrated()
    const itemCount = useCartStore(s => s.items.length)
    const [placed, setPlaced] = useState<Placed | null>(null)

    return (
        <>
            <Navbar />
            <main id="main" className="pt-nav min-h-screen pb-24">
                {!hydrated ? (
                    <div className="container-page grid gap-8 py-10 lg:grid-cols-12">
                        <div className="skeleton h-[480px] rounded-[28px] lg:col-span-7" />
                        <div className="skeleton h-[360px] rounded-[28px] lg:col-span-5" />
                    </div>
                ) : placed ? (
                    <SuccessScreen placed={placed} />
                ) : itemCount === 0 ? (
                    <div className="container-page flex flex-col items-center py-28 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-paper-2">
                            <ShoppingBag className="h-8 w-8 text-olive-600" />
                        </div>
                        <h1 className="mt-6 text-4xl">Your cart is empty</h1>
                        <p className="mt-3 text-ink-2">Add something from the menu to start an order.</p>
                        <Link href="/menu" className="btn-primary mt-8">Browse the menu</Link>
                    </div>
                ) : (
                    <CheckoutFlow onPlaced={setPlaced} />
                )}
            </main>
        </>
    )
}

function SuccessScreen({ placed }: { placed: Placed }) {
    useEffect(() => {
        // Best effort — browsers may block this; the button below always works
        const w = window.open(placed.waURL, '_blank', 'noopener,noreferrer')
        if (w) w.opener = null
    }, [placed.waURL])

    return (
        <div className="container-page flex justify-center py-16 lg:py-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="panel w-full max-w-lg p-8 text-center sm:p-10"
            >
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-olive-700 text-white"
                >
                    <Check className="h-10 w-10" strokeWidth={2.5} />
                </motion.div>
                <h1 className="mt-6 text-[2.5rem]">Order placed</h1>
                <p className="mt-2 text-ink-2">
                    Order <span className="font-semibold text-ink">#{placed.orderNumber}</span> · <span className="tabular">{formatPrice(placed.total)}</span>
                </p>
                <p className="mx-auto mt-5 max-w-sm leading-relaxed text-ink-2">
                    Send the order to the branch on WhatsApp so they can confirm it. You&apos;ll earn about <strong className="text-ink">{placed.points} points</strong> once it&apos;s confirmed.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                    <a href={placed.waURL} target="_blank" rel="noopener noreferrer" className="btn-primary h-14 text-base">
                        <MessageCircle className="h-5 w-5" /> Send on WhatsApp
                    </a>
                    <Link href={`/order/${placed.orderNumber}`} className="btn-outline-dark h-14 text-base">
                        Track this order <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}

// ── The multi-step form ───────────────────────────────────────
function CheckoutFlow({ onPlaced }: { onPlaced: (p: Placed) => void }) {
    const { language, isRTL } = useLanguageStore()
    const t = translations[language]
    const STEPS = [t.contact, t.delivery, t.payment, t.reviewConfirm]

    const { items: cartItems, subtotal, clearCart } = useCartStore()
    const cartSubtotal = subtotal()
    const { customer, isAuthenticated, lookupOrCreateCustomer, refreshCustomer } = useAuthStore()
    const loc = useLocationStore()

    const [step, setStep] = useState(0)

    // Step 0 — contact (pre-filled from the stored session; this component mounts after hydration)
    const [customerName, setCustomerName] = useState(customer?.name ?? '')
    const [customerPhone, setCustomerPhone] = useState(customer?.phone ? customer.phone.replace(/^\+92/, '0') : '')
    const [lookingUp, setLookingUp] = useState(false)
    const [orderNotes, setOrderNotes] = useState('')

    // Step 1 — order type
    const [branches, setBranches] = useState<Branch[]>([])
    const [pickupBranchId, setPickupBranchId] = useState('')
    const [orderType, setOrderType] = useState<'delivery' | 'takeaway' | 'dine-in'>('delivery')
    const [houseAddress, setHouseAddress] = useState(loc.deliveryAddress ?? '')
    const [route, setRoute] = useState<{ key: string; distanceKm: number; etaMin: number; fee: number | null; outOfRange: boolean; breakdown: string } | null>(null)
    const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>(DEFAULT_DELIVERY_CONFIG)
    const [locationModalOpen, setLocationModalOpen] = useState(false)

    // Step 2 — payment
    const [payMethod, setPayMethod] = useState<'jazzcash' | 'cod'>('cod')
    const [loyaltyRedeem, setLoyaltyRedeem] = useState(0)
    const [placing, setPlacing] = useState(false)

    const [unverifiedReturning, setUnverifiedReturning] = useState(false)

    // Perks belong to the verified customer — and only when they're ordering on their own number
    const isMember = isAuthenticated && !!customer && normalisePhone(customerPhone) === customer.phone
    const availablePoints = isMember ? customer?.loyaltyPoints ?? 0 : 0
    const customerTier: LoyaltyTier = (isMember ? customer?.tier : null) ?? 'bronze'

    useEffect(() => {
        getBranches().then(data => {
            if (!data?.length) return
            setBranches(data)
            setPickupBranchId(prev => prev || data[0].id)
        }).catch(() => toast.error("We couldn't load branches. Please refresh."))
        getDeliverySettings().then(setDeliveryConfig).catch(() => {})
    }, [])

    // Delivery is always fulfilled by the branch nearest to the saved location
    const deliveryBranch = branches.find(b => b.id === loc.nearestBranchId) ?? null
    const routeKey = loc.coords && deliveryBranch
        ? `${loc.coords.lat},${loc.coords.lng}->${deliveryBranch.id}`
        : null

    useEffect(() => {
        if (!routeKey || !loc.coords || !deliveryBranch) return
        let active = true
        const { lat, lng } = loc.coords
        calculateRealWorldDistance(lat, lng, deliveryBranch.lat, deliveryBranch.lng).then(r => {
            if (!active) return
            const details = getDeliveryFeeDetails(r.distanceKm, deliveryConfig)
            setRoute({ key: routeKey, distanceKm: r.distanceKm, etaMin: r.durationMin, fee: details.fee, outOfRange: details.outOfRange, breakdown: details.breakdownText })
        })
        return () => { active = false }
    }, [routeKey, deliveryConfig, loc.coords, deliveryBranch])

    // Prefer the fresh route calculation; fall back to what the location modal stored
    const liveRoute = route && route.key === routeKey ? route : null
    const distanceKm = liveRoute?.distanceKm ?? loc.distanceKm
    const outOfRange = liveRoute?.outOfRange ?? loc.outOfRange
    const rawFee = liveRoute ? liveRoute.fee : loc.deliveryFee

    const isDelivery = orderType === 'delivery'
    const freeByThreshold = isDelivery && deliveryConfig.freeAbove > 0 && cartSubtotal >= deliveryConfig.freeAbove
    const baseDeliveryFee = isDelivery && !outOfRange ? (freeByThreshold ? 0 : rawFee ?? 0) : 0
    const { tierDiscount, finalDeliveryFee } = applyTierPerks(customerTier, cartSubtotal, baseDeliveryFee)
    const maxRedeem = maxRedeemablePoints(cartSubtotal, availablePoints)
    const loyaltyDiscount = Math.min(loyaltyRedeem, maxRedeem)
    const total = Math.max(0, cartSubtotal + finalDeliveryFee - loyaltyDiscount - tierDiscount)

    const phoneErr = phoneError(customerPhone)
    const phoneOk = isValidPakistaniPhone(customerPhone)

    const handlePhoneBlur = async () => {
        if (!phoneOk) return
        setLookingUp(true)
        try {
            const result = await lookupOrCreateCustomer(customerPhone, customerName)
            setUnverifiedReturning(!result.verified && result.exists)
            if (result.verified && result.customer.totalOrders > 0 && result.customer.name) setCustomerName(result.customer.name)
        } catch (err) {
            console.error('Lookup failed:', err)
        } finally {
            setLookingUp(false)
        }
    }

    const canGoNext = (): boolean => {
        if (step === 0) return customerName.trim().length >= 2 && phoneOk
        if (step === 1) {
            if (isDelivery) return loc.locationSet && !outOfRange && houseAddress.trim().length >= 5
            return !!pickupBranchId
        }
        return true
    }

    const placeOrder = async () => {
        if (placing) return
        setPlacing(true)
        try {
            if (cartSubtotal < SITE.minOrder) throw new Error(`The minimum order is ${formatPrice(SITE.minOrder)}.`)
            if (isDelivery) {
                if (!loc.locationSet || !loc.coords) throw new Error('Please set your delivery location first.')
                if (outOfRange) throw new Error('Your address is outside our delivery range. Choose takeaway or dine-in instead.')
            }

            // The server re-prices everything and applies perks only for a verified device
            const result = await submitOrder({
                name: customerName.trim(),
                phone: customerPhone,
                orderType,
                branchId: isDelivery ? undefined : pickupBranchId,
                coords: isDelivery ? loc.coords ?? undefined : undefined,
                address: isDelivery ? houseAddress.trim() : undefined,
                items: cartItems.map(i => ({ menuItemId: i.menuItemId, variantId: i.variantId, size: i.size, quantity: i.quantity })),
                paymentMethod: payMethod,
                notes: orderNotes.trim() || undefined,
                redeemPoints: loyaltyDiscount,
                referralCode: localStorage.getItem('zaitoon-referral-code'),
            })

            localStorage.removeItem('zaitoon-referral-code')
            localStorage.removeItem('zaitoon-referrer-name')
            onPlaced({ orderNumber: result.orderNumber, waURL: result.whatsappURL, total: result.total, points: result.pointsEarned })
            clearCart()
            if (result.verified) refreshCustomer().catch(() => {})
        } catch (err) {
            const error = err as Error
            console.error('Order failed:', err)
            toast.error(error.message || 'Something went wrong. Please try again.')
            setPlacing(false)
        }
    }

    const deliveryFeeLabel = (): string => {
        if (!isDelivery) return 'Not applicable'
        if (!loc.locationSet) return 'Set location'
        if (outOfRange) return 'Out of range'
        if (finalDeliveryFee === 0) return 'Free'
        return formatPrice(finalDeliveryFee)
    }

    const slide = {
        initial: { opacity: 0, x: isRTL ? -24 : 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: isRTL ? 24 : -24 },
        transition: { duration: 0.25 },
    }

    const optionCls = (selected: boolean) =>
        `relative flex items-center gap-3 rounded-2xl border p-4 text-start transition-all ${selected
            ? 'border-ink bg-surface shadow-[var(--shadow-soft)] ring-1 ring-ink'
            : 'border-line bg-surface hover:border-line-strong'}`

    return (
        <div className="container-page py-8 lg:py-12">
            <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                    <Link href="/menu" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink">
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> Back to menu
                    </Link>
                    <h1 className="mt-3 text-[clamp(2.25rem,4vw,3rem)]">Checkout</h1>
                </div>
            </div>

            <div className="grid items-start gap-8 lg:grid-cols-12">
                {/* ── Steps ── */}
                <section aria-label="Order details" className="lg:col-span-7">
                    <nav aria-label="Checkout steps" className="mb-6">
                        <ol className="grid grid-cols-4 gap-2">
                            {STEPS.map((label, i) => {
                                const done = i < step
                                const active = i === step
                                return (
                                    <li key={label}>
                                        <button
                                            type="button"
                                            onClick={() => done && setStep(i)}
                                            disabled={!done}
                                            aria-current={active ? 'step' : undefined}
                                            className="w-full text-start disabled:cursor-default"
                                        >
                                            <span className={`block h-1 rounded-full transition-colors duration-300 ${done || active ? 'bg-ink' : 'bg-line'}`} />
                                            <span className={`mt-2.5 flex items-center gap-1.5 text-xs font-semibold sm:text-sm ${active ? 'text-ink' : done ? 'text-ink-2 hover:text-ink' : 'text-ink-3'}`}>
                                                {done ? <Check className="h-3.5 w-3.5 text-olive-600" /> : <span className="tabular">{i + 1}.</span>}
                                                <span className="truncate">{label}</span>
                                            </span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ol>
                    </nav>

                    <form onSubmit={e => e.preventDefault()} noValidate className="panel p-6 sm:p-8">
                        <AnimatePresence mode="wait" initial={false}>
                            {step === 0 && (
                                <motion.fieldset key="s0" {...slide} className="space-y-5">
                                    <legend className="mb-1 font-display text-2xl">{t.contactDetails}</legend>
                                    <p className="!mt-1 text-sm text-ink-2">We&apos;ll use your number to confirm the order and save your loyalty points.</p>

                                    <div>
                                        <label htmlFor="chk-phone" className="field-label">{t.phoneNumber}</label>
                                        <div className="relative">
                                            <input
                                                id="chk-phone" type="tel" inputMode="tel" autoComplete="tel"
                                                value={customerPhone}
                                                onChange={e => setCustomerPhone(e.target.value)}
                                                onBlur={handlePhoneBlur}
                                                placeholder="03XX-XXXXXXX"
                                                aria-invalid={!!phoneErr}
                                                aria-describedby="chk-phone-hint"
                                                className="field pe-12"
                                            />
                                            <span className="absolute end-4 top-1/2 -translate-y-1/2">
                                                {lookingUp
                                                    ? <Loader2 className="h-4 w-4 animate-spin text-ink-3" />
                                                    : phoneOk && <Check className="h-4 w-4 text-success" />}
                                            </span>
                                        </div>
                                        <p id="chk-phone-hint" role={phoneErr ? 'alert' : undefined} className={`mt-1.5 text-[0.8125rem] ${phoneErr ? 'text-danger' : 'text-ink-3'}`}>
                                            {phoneErr ?? 'Pakistani mobile number'}
                                        </p>
                                    </div>

                                    {unverifiedReturning && !isMember && (
                                        <p className="rounded-2xl bg-paper-2 px-4 py-3 text-sm text-ink-2">
                                            Welcome back. This order will still earn points for your number. To protect your account, points can only be viewed and spent on the device you first ordered from.
                                        </p>
                                    )}

                                    {isMember && customer && (customer.totalOrders > 0 || customer.loyaltyPoints > 0) && (
                                        <div className="flex items-center gap-3 rounded-2xl bg-olive-100/70 px-4 py-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-olive-700 text-sm font-semibold text-white">
                                                {customer.name.charAt(0).toUpperCase()}
                                            </span>
                                            <p className="text-sm text-olive-800">
                                                Welcome back, <strong>{customer.name.split(' ')[0]}</strong>. You have <strong className="tabular">{customer.loyaltyPoints.toLocaleString()}</strong> points · {titleCase(customer.tier)}
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="chk-name" className="field-label">{t.fullName}</label>
                                        <input
                                            id="chk-name" type="text" autoComplete="name"
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            placeholder="e.g. Ahmed Ali"
                                            className="field"
                                        />
                                    </div>
                                </motion.fieldset>
                            )}

                            {step === 1 && (
                                <motion.fieldset key="s1" {...slide} className="space-y-6">
                                    <legend className="mb-1 font-display text-2xl">{t.orderType}</legend>

                                    <div role="radiogroup" aria-label="Order type" className="grid grid-cols-3 gap-2.5">
                                        {([
                                            { id: 'delivery', icon: Truck, title: t.delivery },
                                            { id: 'takeaway', icon: Store, title: t.takeaway },
                                            { id: 'dine-in', icon: Utensils, title: t.dineIn },
                                        ] as const).map(type => {
                                            const sel = orderType === type.id
                                            return (
                                                <button
                                                    key={type.id} type="button" role="radio" aria-checked={sel}
                                                    onClick={() => setOrderType(type.id)}
                                                    className={`${optionCls(sel)} flex-col !items-center !text-center sm:!py-5`}
                                                >
                                                    <type.icon className={`h-6 w-6 ${sel ? 'text-ember-600' : 'text-ink-2'}`} />
                                                    <span className="text-sm font-semibold text-ink">{type.title}</span>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {isDelivery ? (
                                        <div className="space-y-4">
                                            {!loc.locationSet ? (
                                                <div className="rounded-2xl border border-dashed border-line-strong p-6 text-center">
                                                    <MapPin className="mx-auto h-6 w-6 text-olive-600" />
                                                    <p className="mt-3 font-semibold text-ink">Set your delivery location</p>
                                                    <p className="mt-1 text-sm text-ink-2">We use it to find your nearest branch and the delivery fee.</p>
                                                    <button type="button" onClick={() => setLocationModalOpen(true)} className="btn-primary mt-4">
                                                        Set location
                                                    </button>
                                                </div>
                                            ) : outOfRange ? (
                                                <div role="alert" className="rounded-2xl border border-danger/25 bg-danger/5 p-5">
                                                    <p className="flex items-center gap-2 font-semibold text-danger">
                                                        <AlertTriangle className="h-4 w-4" /> Outside our delivery range ({formatDistance(distanceKm)})
                                                    </p>
                                                    <p className="mt-1.5 text-sm text-ink-2">Choose takeaway or dine-in, or try a different address.</p>
                                                    <button type="button" onClick={() => setLocationModalOpen(true)} className="mt-3 text-sm font-semibold text-ink underline underline-offset-4">
                                                        Change location
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-4 rounded-2xl bg-paper p-4">
                                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-olive-700 text-white">
                                                        <MapPin className="h-5 w-5" />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="line-clamp-2 text-sm font-medium text-ink">{loc.deliveryAddress}</p>
                                                        <p className="mt-1 text-[0.8125rem] text-ink-2">
                                                            <span className="tabular">{formatDistance(distanceKm)}</span> from {deliveryBranch?.name ?? loc.nearestBranchName}
                                                            {liveRoute?.etaMin ? <> · ~<span className="tabular">{liveRoute.etaMin + 20}</span> min</> : null}
                                                        </p>
                                                    </div>
                                                    <button type="button" onClick={() => setLocationModalOpen(true)}
                                                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[0.8125rem] font-semibold text-ink hover:border-line-strong">
                                                        <Pencil className="h-3.5 w-3.5" /> Change
                                                    </button>
                                                </div>
                                            )}

                                            {loc.locationSet && !outOfRange && (
                                                <div>
                                                    <label htmlFor="chk-address" className="field-label">House / street address</label>
                                                    <textarea
                                                        id="chk-address" rows={2}
                                                        value={houseAddress}
                                                        onChange={e => setHouseAddress(e.target.value)}
                                                        placeholder="e.g. House 12, Street 5, Block C, Wapda Town"
                                                        aria-invalid={houseAddress.trim().length > 0 && houseAddress.trim().length < 5}
                                                        className="field resize-none"
                                                    />
                                                    <p className="mt-1.5 text-[0.8125rem] text-ink-3">The rider uses this to find your door.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            <p className="field-label">Choose a branch</p>
                                            <div role="radiogroup" aria-label="Branch" className="grid gap-2.5 sm:grid-cols-2">
                                                {branches.map(b => {
                                                    const sel = pickupBranchId === b.id
                                                    return (
                                                        <button key={b.id} type="button" role="radio" aria-checked={sel}
                                                            onClick={() => setPickupBranchId(b.id)}
                                                            className={`${optionCls(sel)} !items-start`}>
                                                            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${sel ? 'border-ink bg-ink text-paper' : 'border-line-strong'}`}>
                                                                {sel && <Check className="h-3 w-3" />}
                                                            </span>
                                                            <span>
                                                                <span className="block font-semibold text-ink">{b.name}</span>
                                                                <span className="mt-0.5 block text-[0.8125rem] text-ink-2">{b.address}</span>
                                                            </span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </motion.fieldset>
                            )}

                            {step === 2 && (
                                <motion.fieldset key="s2" {...slide} className="space-y-6">
                                    <legend className="mb-1 font-display text-2xl">{t.paymentDetails}</legend>

                                    <div role="radiogroup" aria-label="Payment method" className="grid gap-2.5 sm:grid-cols-2">
                                        {([
                                            { id: 'cod', title: isDelivery ? 'Cash on delivery' : 'Pay at the counter', desc: 'Pay when you get your food', icon: Banknote },
                                            { id: 'jazzcash', title: 'JazzCash', desc: 'Branch shares payment details on WhatsApp', icon: Smartphone },
                                        ] as const).map(m => {
                                            const sel = payMethod === m.id
                                            return (
                                                <button key={m.id} type="button" role="radio" aria-checked={sel}
                                                    onClick={() => setPayMethod(m.id)} className={`${optionCls(sel)} !items-start`}>
                                                    <m.icon className={`mt-0.5 h-5 w-5 shrink-0 ${sel ? 'text-ember-600' : 'text-ink-2'}`} />
                                                    <span>
                                                        <span className="block font-semibold text-ink">{m.title}</span>
                                                        <span className="mt-0.5 block text-[0.8125rem] text-ink-2">{m.desc}</span>
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {maxRedeem > 0 && (
                                        <div className="rounded-2xl bg-olive-100/70 p-5">
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="flex items-center gap-2 font-semibold text-olive-800">
                                                    <Gift className="h-4 w-4" /> Use loyalty points
                                                </p>
                                                <p className="tabular text-sm text-olive-800">{availablePoints.toLocaleString()} available</p>
                                            </div>
                                            <input
                                                type="range" min={0} max={maxRedeem} step={10}
                                                value={loyaltyDiscount}
                                                onChange={e => setLoyaltyRedeem(Number(e.target.value))}
                                                aria-label="Points to redeem"
                                                className="mt-4 w-full accent-[var(--color-olive-700)]"
                                            />
                                            <div className="mt-2 flex justify-between text-sm">
                                                <span className="text-olive-800/70">Up to {maxRedeem.toLocaleString()} pts (20% of subtotal)</span>
                                                <span className="tabular font-semibold text-olive-800">−{formatPrice(loyaltyDiscount)}</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.fieldset>
                            )}

                            {step === 3 && (
                                <motion.div key="s3" {...slide} className="space-y-6">
                                    <h2 className="font-display text-2xl">{t.reviewConfirm}</h2>

                                    <dl className="divide-y divide-line rounded-2xl border border-line">
                                        {[
                                            { k: 'Name', v: customerName, step: 0 },
                                            { k: 'Phone', v: customerPhone, step: 0 },
                                            { k: 'Order type', v: titleCase(orderType), step: 1 },
                                            ...(isDelivery
                                                ? [{ k: 'Deliver to', v: houseAddress.trim() || loc.deliveryAddress, step: 1 }]
                                                : [{ k: 'Branch', v: branches.find(b => b.id === pickupBranchId)?.name ?? '—', step: 1 }]),
                                            { k: 'Payment', v: payMethod === 'cod' ? (isDelivery ? 'Cash on delivery' : 'Pay at the counter') : 'JazzCash', step: 2 },
                                        ].map(row => (
                                            <div key={row.k} className="flex items-start justify-between gap-4 px-4 py-3.5">
                                                <dt className="w-28 shrink-0 text-sm text-ink-2">{row.k}</dt>
                                                <dd className="flex-1 text-sm font-medium text-ink">{row.v || '—'}</dd>
                                                <button type="button" onClick={() => setStep(row.step)} className="text-[0.8125rem] font-semibold text-olive-700 hover:text-ink">
                                                    Edit
                                                </button>
                                            </div>
                                        ))}
                                    </dl>

                                    <div>
                                        <label htmlFor="order-notes" className="field-label">Notes for the kitchen <span className="font-normal text-ink-3">(optional)</span></label>
                                        <textarea
                                            id="order-notes" rows={2}
                                            value={orderNotes}
                                            onChange={e => setOrderNotes(e.target.value)}
                                            placeholder="Less spicy, extra garlic sauce, ring the bell twice…"
                                            className="field resize-none"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
                            {step > 0 ? (
                                <button type="button" onClick={() => setStep(s => s - 1)} className="btn-quiet">
                                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> Back
                                </button>
                            ) : <span />}

                            {step < 3 ? (
                                <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canGoNext()} className="btn-primary">
                                    Continue <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                                </button>
                            ) : (
                                <button type="button" onClick={placeOrder} disabled={placing || (isDelivery && outOfRange)} className="btn-primary lg:hidden">
                                    {placing ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing…</> : <>{t.placeOrder} · <span className="tabular">{formatPrice(total)}</span></>}
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {/* ── Summary ── */}
                <aside aria-label={t.orderSummary} className="panel p-6 sm:p-7 lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:col-span-5">
                    <h2 className="font-display text-2xl">{t.orderSummary}</h2>

                    <ul className="mt-5 max-h-[300px] space-y-3 overflow-y-auto pe-1">
                        {cartItems.map(item => (
                            <li key={item.id} className="flex items-start justify-between gap-3 text-[0.9375rem]">
                                <div className="flex min-w-0 gap-3">
                                    <span className="tabular flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-paper-2 px-1.5 text-xs font-semibold text-ink">{item.quantity}</span>
                                    <div className="min-w-0">
                                        <p className="font-medium leading-snug text-ink">{item.name}</p>
                                        {item.size && <p className="text-[0.8125rem] text-ink-2">{item.size === 'small' ? 'Regular' : 'Large'}</p>}
                                    </div>
                                </div>
                                <span className="price shrink-0 text-ink">{formatPrice(item.subtotal)}</span>
                            </li>
                        ))}
                    </ul>

                    <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-[0.9375rem]">
                        <div className="flex justify-between">
                            <dt className="text-ink-2">{t.subtotal}</dt>
                            <dd className="price">{formatPrice(cartSubtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-ink-2">
                                {t.deliveryFee}
                                {isDelivery && loc.locationSet && !outOfRange && <span className="tabular text-ink-3"> · {formatDistance(distanceKm)}</span>}
                            </dt>
                            <dd className={outOfRange && isDelivery ? 'font-medium text-danger' : 'price'}>{deliveryFeeLabel()}</dd>
                        </div>
                        {isDelivery && freeByThreshold && (
                            <p className="text-[0.8125rem] text-success">Free delivery on orders over {formatPrice(deliveryConfig.freeAbove)}</p>
                        )}
                        {isDelivery && !freeByThreshold && deliveryConfig.freeAbove > 0 && loc.locationSet && !outOfRange && (
                            <p className="text-[0.8125rem] text-ink-3">Add {formatPrice(deliveryConfig.freeAbove - cartSubtotal)} more for free delivery</p>
                        )}
                        {tierDiscount > 0 && (
                            <div className="flex justify-between text-success">
                                <dt>{titleCase(customerTier)} member discount</dt>
                                <dd className="price">−{formatPrice(tierDiscount)}</dd>
                            </div>
                        )}
                        {finalDeliveryFee === 0 && baseDeliveryFee > 0 && (
                            <div className="flex justify-between text-success">
                                <dt>{titleCase(customerTier)} free delivery</dt>
                                <dd className="price">−{formatPrice(baseDeliveryFee)}</dd>
                            </div>
                        )}
                        {loyaltyDiscount > 0 && (
                            <div className="flex justify-between text-success">
                                <dt>Loyalty points</dt>
                                <dd className="price">−{formatPrice(loyaltyDiscount)}</dd>
                            </div>
                        )}
                    </dl>

                    <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
                        <span className="font-semibold">{t.total}</span>
                        <span className="price text-[1.75rem]">{formatPrice(total)}</span>
                    </div>

                    {step === 3 && (
                        <button
                            type="button"
                            onClick={placeOrder}
                            disabled={placing || (isDelivery && outOfRange)}
                            className="btn-primary mt-6 hidden h-14 w-full text-base lg:inline-flex"
                        >
                            {placing ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</> : <>{t.placeOrder} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></>}
                        </button>
                    )}

                    <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[0.8125rem] text-ink-3">
                        <MessageCircle className="h-3.5 w-3.5" /> Confirmed by the branch on WhatsApp
                    </p>
                </aside>
            </div>

            {locationModalOpen && (
                <LocationModal
                    forceOpen={isDelivery && !loc.locationSet}
                    onClose={() => setLocationModalOpen(false)}
                />
            )}
        </div>
    )
}
