'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { formatPrice } from '@/lib/payment'

interface Props { open: boolean; onClose: () => void }

export default function CartDrawer({ open, onClose }: Props) {
    const router = useRouter()
    const { items, updateQuantity, removeItem, subtotal, deliveryFee, total, orderType } = useCartStore()
    const itemCount = items.reduce((s, i) => s + i.quantity, 0)
    const MIN_ORDER = 800
    const [minOrderError, setMinOrderError] = useState(false)

    const progressPct = Math.min(100, (subtotal() / MIN_ORDER) * 100)
    const remaining = Math.max(0, MIN_ORDER - subtotal())

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                        aria-hidden="true"
                        className="fixed inset-0 z-[70]"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}
                    />

                    {/* Drawer */}
                    <motion.aside
                        role="dialog"
                        aria-label="Shopping cart"
                        aria-modal="true"
                        id="cart-drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                        className="fixed right-0 top-0 bottom-0 z-[80] w-full md:w-[420px] flex flex-col"
                        style={{
                            background: 'linear-gradient(180deg, #3A4A22 0%, var(--olive-darkest) 100%)',
                            borderLeft: '2px solid rgba(217,119,6,0.4)',
                            boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
                        }}
                    >
                        {/* Header */}
                        <header className="flex items-center justify-between px-6 py-5"
                            style={{ borderBottom: '1px solid rgba(253,248,240,0.08)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-[8px] flex items-center justify-center"
                                    style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)' }}>
                                    <ShoppingBag className="w-4 h-4" style={{ color: 'var(--amber-warm)' }} />
                                </div>
                                <div>
                                    <h2 className="text-[20px] text-white font-display font-[700] leading-none">Your Order</h2>
                                    {itemCount > 0 && (
                                        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(253,248,240,0.4)' }}>
                                            {itemCount} item{itemCount > 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                aria-label="Close cart"
                                className="w-9 h-9 rounded-[8px] flex items-center justify-center transition-all"
                                style={{
                                    color: 'rgba(253,248,240,0.6)',
                                    border: '1px solid rgba(253,248,240,0.12)',
                                    background: 'rgba(253,248,240,0.04)'
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(253,248,240,0.10)' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(253,248,240,0.04)' }}
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        </header>

                        {/* Min order progress bar */}
                        {items.length > 0 && subtotal() < MIN_ORDER && (
                            <div className="px-6 py-3" style={{ borderBottom: '1px solid rgba(253,248,240,0.06)' }}>
                                <div className="flex justify-between text-[11px] mb-1.5"
                                    style={{ color: 'rgba(253,248,240,0.45)' }}>
                                    <span>Min. order: Rs. {MIN_ORDER}</span>
                                    <span style={{ color: 'var(--amber-warm)' }}>Rs. {remaining} more</span>
                                </div>
                                <div className="w-full h-[3px] rounded-full overflow-hidden"
                                    style={{ background: 'rgba(253,248,240,0.08)' }}>
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: 'linear-gradient(90deg, var(--amber-warm), var(--amber-bright))' }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPct}%` }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Items list */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden">
                            {items.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex flex-col items-center justify-center h-full text-center gap-5 p-8"
                                >
                                    <motion.div
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                        className="text-[56px] select-none"
                                    >
                                        🍖
                                    </motion.div>
                                    <div>
                                        <h3 className="text-white text-[20px] mb-2">Your cart is empty</h3>
                                        <p className="text-[14px] font-[300]" style={{ color: 'rgba(253,248,240,0.4)' }}>
                                            Add some delicious items from our menu.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { onClose(); router.push('/menu') }}
                                        className="btn-primary mt-2"
                                    >
                                        Browse Menu
                                    </button>
                                </motion.div>
                            ) : (
                                <ul role="list" aria-label="Cart items" className="flex flex-col">
                                    <AnimatePresence>
                                        {items.map(item => (
                                            <motion.li
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, x: 24 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -24, height: 0, paddingTop: 0, paddingBottom: 0 }}
                                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                                className="px-6 py-4"
                                                style={{ borderBottom: '1px solid rgba(253,248,240,0.07)' }}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1 pr-3">
                                                        <div className="text-[15px] font-[600] text-white leading-snug">{item.name}</div>
                                                        {item.size && (
                                                            <div className="text-[11px] font-[400] capitalize mt-0.5"
                                                                style={{ color: 'var(--amber-pale)', opacity: 0.7 }}>
                                                                {item.size}
                                                            </div>
                                                        )}
                                                        {/* Add-ons summary */}
                                                        {(item as any).addOns && (item as any).addOns.length > 0 && (
                                                            <div className="text-[11px] mt-1" style={{ color: 'rgba(253,248,240,0.35)' }}>
                                                                + {(item as any).addOns.map((a: any) => a.name).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="font-display text-[17px] font-[700] shrink-0"
                                                        style={{ color: 'var(--amber-pale)' }}>
                                                        {formatPrice(item.subtotal)}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    {/* Quantity stepper */}
                                                    <div className="flex items-center gap-1.5 rounded-[8px] p-[3px]"
                                                        style={{
                                                            background: 'linear-gradient(135deg, var(--olive-darkest), var(--olive-dark))',
                                                            border: '1.5px solid rgba(138,154,91,0.35)'
                                                        }}>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            aria-label={`Remove one ${item.name}`}
                                                            className="w-[32px] h-[32px] flex items-center justify-center rounded-[5px] text-white transition-colors hover:bg-white/10"
                                                        >
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span
                                                            aria-live="polite"
                                                            className="text-[14px] font-[700] w-[22px] text-center text-white"
                                                        >
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            aria-label={`Add one more ${item.name}`}
                                                            className="w-[32px] h-[32px] flex items-center justify-center rounded-[5px] text-white transition-colors hover:bg-white/10"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    {/* Remove */}
                                                    <motion.button
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => removeItem(item.id)}
                                                        aria-label={`Remove ${item.name} from cart`}
                                                        className="text-[12px] font-[600] px-2.5 py-1 rounded-[6px] transition-all"
                                                        style={{ color: 'rgba(253,248,240,0.3)', border: '1px solid transparent' }}
                                                        onMouseEnter={e => {
                                                            const el = e.currentTarget as HTMLElement
                                                            el.style.color = '#F87171'
                                                            el.style.borderColor = 'rgba(248,113,113,0.3)'
                                                            el.style.background = 'rgba(248,113,113,0.08)'
                                                        }}
                                                        onMouseLeave={e => {
                                                            const el = e.currentTarget as HTMLElement
                                                            el.style.color = 'rgba(253,248,240,0.3)'
                                                            el.style.borderColor = 'transparent'
                                                            el.style.background = 'transparent'
                                                        }}
                                                    >
                                                        Remove
                                                    </motion.button>
                                                </div>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <footer className="px-6 pt-5 pb-7 shrink-0"
                                style={{
                                    borderTop: '1px solid rgba(253,248,240,0.08)',
                                    background: 'rgba(0,0,0,0.15)',
                                    boxShadow: '0 -16px 32px rgba(0,0,0,0.15)'
                                }}>
                                {/* Price rows */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-[13px]">
                                        <span style={{ color: 'rgba(253,248,240,0.5)' }}>Subtotal</span>
                                        <span className="text-white font-[600]">{formatPrice(subtotal())}</span>
                                    </div>
                                    <div className="flex justify-between text-[13px]">
                                        <span style={{ color: 'rgba(253,248,240,0.5)' }}>Delivery</span>
                                        <span>
                                            {orderType !== 'delivery'
                                                ? <span style={{ color: 'rgba(253,248,240,0.35)' }}>N/A</span>
                                                : deliveryFee > 0
                                                    ? <span className="text-white font-[600]">{formatPrice(deliveryFee)}</span>
                                                    : <span className="italic text-[12px]" style={{ color: 'var(--amber-warm)' }}>Calculated at checkout</span>
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-5 pb-4"
                                    style={{ borderTop: '1px solid rgba(253,248,240,0.08)', paddingTop: 16 }}>
                                    <div className="flex items-baseline justify-between" aria-label={`Order total: Rs. ${total()}`}>
                                        <span className="text-[15px] font-[700] text-white">Total</span>
                                        <span className="font-display text-[30px] font-[800] leading-none"
                                            style={{ color: 'var(--amber-pale)' }}>
                                            {formatPrice(total())}
                                        </span>
                                    </div>
                                </div>

                                {/* Min order error */}
                                <AnimatePresence>
                                    {minOrderError && (
                                        <motion.div
                                            role="alert"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            className="mb-4 p-3 rounded-[8px] text-[12px] leading-snug"
                                            style={{
                                                background: 'rgba(185,28,28,0.2)',
                                                border: '1px solid rgba(248,113,113,0.35)',
                                                color: '#FCA5A5'
                                            }}
                                        >
                                            ⚠ Minimum order is Rs. 800. Add Rs. {remaining} more to proceed.
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.button
                                    whileHover={{ scale: 1.01, y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (subtotal() < MIN_ORDER) { setMinOrderError(true); return }
                                        setMinOrderError(false)
                                        onClose()
                                        router.push('/checkout')
                                    }}
                                    aria-label={`Proceed to checkout with ${itemCount} items`}
                                    className="btn-primary w-full py-4 text-[14px] flex items-center justify-center gap-2"
                                >
                                    Proceed to Checkout
                                    <ArrowRight className="w-4 h-4" />
                                </motion.button>
                            </footer>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    )
}
