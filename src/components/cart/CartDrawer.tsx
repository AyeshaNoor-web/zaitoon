'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ArrowRight, ShoppingBag, Trash2, UtensilsCrossed } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useLocationStore } from '@/store/useLocationStore'
import { useHydrated } from '@/store/hydration'
import { formatPrice } from '@/lib/payment'
import { SITE } from '@/lib/site'

interface Props { open: boolean; onClose: () => void }

export default function CartDrawer({ open, onClose }: Props) {
    const router = useRouter()
    const hydrated = useHydrated()
    const { items, updateQuantity, removeItem, subtotal } = useCartStore()
    const { locationSet, deliveryFee, outOfRange } = useLocationStore()
    const [minOrderError, setMinOrderError] = useState(false)

    const list = hydrated ? items : []
    const itemCount = list.reduce((s, i) => s + i.quantity, 0)
    const sub = hydrated ? subtotal() : 0
    const remaining = Math.max(0, SITE.minOrder - sub)
    const progressPct = Math.min(100, (sub / SITE.minOrder) * 100)

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [open, onClose])

    const checkout = () => {
        if (remaining > 0) { setMinOrderError(true); return }
        setMinOrderError(false)
        onClose()
        router.push('/checkout')
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        aria-hidden="true"
                        className="fixed inset-0 z-[70] bg-olive-950/50 backdrop-blur-sm"
                    />

                    <motion.aside
                        role="dialog"
                        aria-label="Your order"
                        aria-modal="true"
                        id="cart-drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 32, stiffness: 330 }}
                        className="fixed inset-y-0 end-0 z-[80] flex w-full flex-col bg-paper shadow-[var(--shadow-float)] sm:w-[440px]"
                    >
                        <header className="flex items-center justify-between border-b border-line px-6 py-5">
                            <div>
                                <h2 className="text-[1.625rem] leading-none">Your order</h2>
                                <p className="mt-1.5 text-sm text-ink-2">
                                    {itemCount > 0 ? `${itemCount} item${itemCount === 1 ? '' : 's'}` : 'Nothing here yet'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Close cart"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-line-strong"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </header>

                        {list.length > 0 && remaining > 0 && (
                            <div className="border-b border-line bg-surface px-6 py-3.5">
                                <p className="text-sm text-ink-2">
                                    Add <strong className="tabular font-semibold text-ink">{formatPrice(remaining)}</strong> more to reach the {formatPrice(SITE.minOrder)} minimum.
                                </p>
                                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-paper-2">
                                    <motion.div
                                        className="h-full rounded-full bg-olive-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPct}%` }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto overscroll-contain">
                            {list.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-5 p-10 text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-paper-2">
                                        <ShoppingBag className="h-8 w-8 text-olive-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl">Your cart is empty</h3>
                                        <p className="mt-1.5 text-[0.9375rem] text-ink-2">Shawarma, platters and grills are a tap away.</p>
                                    </div>
                                    <button onClick={() => { onClose(); router.push('/menu') }} className="btn-primary">
                                        Browse the menu
                                    </button>
                                </div>
                            ) : (
                                <ul aria-label="Cart items" className="divide-y divide-line">
                                    <AnimatePresence initial={false}>
                                        {list.map(item => (
                                            <motion.li
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex gap-4 px-6 py-4"
                                            >
                                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-paper-2">
                                                    {item.imageUrl ? (
                                                        <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center">
                                                            <UtensilsCrossed className="h-5 w-5 text-ink-3" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold leading-snug text-ink">{item.name}</p>
                                                            {item.size && (
                                                                <p className="mt-0.5 text-[0.8125rem] capitalize text-ink-2">{item.size === 'small' ? 'Regular' : 'Large'}</p>
                                                            )}
                                                        </div>
                                                        <p className="price shrink-0 text-ink">{formatPrice(item.subtotal)}</p>
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between">
                                                        <div className="flex items-center rounded-full border border-line bg-surface">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                aria-label={`Remove one ${item.name}`}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-paper-2"
                                                            >
                                                                <Minus className="h-3.5 w-3.5" />
                                                            </button>
                                                            <span aria-live="polite" className="tabular w-7 text-center text-sm font-semibold">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                aria-label={`Add one more ${item.name}`}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-paper-2"
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            aria-label={`Remove ${item.name} from cart`}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-ember-100 hover:text-danger"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </div>

                        {list.length > 0 && (
                            <footer className="border-t border-line bg-surface px-6 pb-6 pt-5">
                                <dl className="space-y-2 text-[0.9375rem]">
                                    <div className="flex justify-between">
                                        <dt className="text-ink-2">Subtotal</dt>
                                        <dd className="price">{formatPrice(sub)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-ink-2">Delivery</dt>
                                        <dd className="text-ink-2">
                                            {hydrated && locationSet && !outOfRange
                                                ? <span className="tabular">from {formatPrice(deliveryFee)}</span>
                                                : 'Calculated at checkout'}
                                        </dd>
                                    </div>
                                </dl>

                                <AnimatePresence>
                                    {minOrderError && (
                                        <motion.p
                                            role="alert"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 rounded-xl bg-ember-100 px-3 py-2.5 text-sm text-ember-700"
                                        >
                                            The minimum order is {formatPrice(SITE.minOrder)}. Add {formatPrice(remaining)} more to continue.
                                        </motion.p>
                                    )}
                                </AnimatePresence>

                                <button onClick={checkout} className="btn-primary mt-4 w-full justify-between">
                                    <span>Checkout</span>
                                    <span className="flex items-center gap-2">
                                        <span className="tabular">{formatPrice(sub)}</span>
                                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                                    </span>
                                </button>
                            </footer>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    )
}
