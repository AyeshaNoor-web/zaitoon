'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ArrowRight, UtensilsCrossed } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { formatPrice } from '@/lib/payment'

interface Props { open: boolean; onClose: () => void }

export default function CartDrawer({ open, onClose }: Props) {
    const router = useRouter()
    const { items, updateQuantity, removeItem, subtotal, deliveryFee, total, orderType } = useCartStore()
    const itemCount = items.reduce((s, i) => s + i.quantity, 0)
    const MIN_ORDER = 800
    const [minOrderError, setMinOrderError] = useState(false)

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        aria-hidden="true"
                        className="fixed inset-0 z-[70] bg-black/50"
                    />

                    {/* Drawer */}
                    <motion.aside
                        role="dialog"
                        aria-label="Shopping cart"
                        aria-modal="true"
                        initial={{ x: 400 }}
                        animate={{ x: 0 }}
                        exit={{ x: 400 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 z-[80] w-[100%] md:w-[400px] flex flex-col bg-[var(--olive-darkest)] border-l-[3px] border-[var(--amber-warm)] shadow-2xl"
                    >
                        {/* Header */}
                        <header className="flex items-center justify-between px-6 py-5 border-b border-[rgba(253,248,240,0.1)]">
                            <h2 className="text-[24px] text-white leading-none">Your Order</h2>
                            <button
                                onClick={onClose}
                                aria-label="Close cart"
                                className="w-8 h-8 rounded-[4px] flex items-center justify-center text-white border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-0">
                            {items.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center h-full text-center gap-5 p-6"
                                >
                                    <div className="text-[48px] select-none opacity-80">🍖</div>
                                    <div>
                                        <h3 className="text-white text-[20px] mb-2">Your cart is empty</h3>
                                        <p className="text-[14px] text-white/40 font-[300]">Add some delicious items from our menu.</p>
                                    </div>
                                    <button
                                        onClick={() => { onClose(); router.push('/menu') }}
                                        className="btn-primary mt-4"
                                    >
                                        Browse Menu
                                    </button>
                                </motion.div>
                            ) : (
                                <ul role="list" aria-label="Cart items" className="flex flex-col">
                                    <AnimatePresence>
                                        {items.map(item => {
                                            return (
                                                <motion.li
                                                    key={item.id}
                                                    layout
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20, height: 0 }}
                                                    className="px-6 py-4 border-b border-[rgba(253,248,240,0.08)]"
                                                >
                                                    <div className="flex justify-between items-start mb-3 border-divider-dark">
                                                        <div className="flex-1">
                                                            <div className="text-[15px] font-[600] text-white">{item.name}</div>
                                                            {item.size && <div className="text-[12px] text-[var(--amber-pale)] font-[400] capitalize">({item.size})</div>}
                                                        </div>
                                                        <div className="text-[16px] text-[var(--amber-pale)] font-display font-[700] ml-4 shrink-0">
                                                            {formatPrice(item.subtotal)}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        {/* Quantity Row */}
                                                        <div className="flex items-center gap-2 bg-[var(--olive-dark)] text-[var(--cream)] rounded-[4px] border-[2px] border-[var(--olive-base)] p-[2px]">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                aria-label={`Remove one ${item.name}`}
                                                                className="w-[32px] h-[32px] flex items-center justify-center rounded-[3px] hover:bg-white/10 transition-colors"
                                                            >
                                                                <Minus className="w-[14px] h-[14px]" />
                                                            </button>
                                                            <span
                                                                aria-live="polite"
                                                                aria-label={`${item.quantity} in cart`}
                                                                className="text-[14px] font-[600] w-[20px] text-center"
                                                            >
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                aria-label={`Add one more ${item.name}`}
                                                                className="w-[32px] h-[32px] flex items-center justify-center rounded-[3px] hover:bg-white/10 transition-colors"
                                                            >
                                                                <Plus className="w-[14px] h-[14px]" />
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            aria-label={`Remove ${item.name} from cart`}
                                                            className="text-white/30 hover:text-[#B91C1C] text-[13px] font-[600] transition-colors"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </motion.li>
                                            )
                                        })}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <footer className="border-t-[2px] border-[var(--olive-mid)] pt-[16px] pb-6 px-6 bg-[var(--olive-darkest)] shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                                <div className="space-y-[8px] mb-[16px]">
                                    <div className="flex justify-between text-[14px] font-[400] text-white/60">
                                        <span>Subtotal</span>
                                        <span className="text-white">{formatPrice(subtotal())}</span>
                                    </div>
                                    <div className="flex justify-between text-[14px] font-[400] text-white/60">
                                        <span>Delivery</span>
                                        <span>
                                            {orderType !== 'delivery'
                                                ? <span className="text-white/40">N/A</span>
                                                : deliveryFee > 0 ? <span className="text-white">{formatPrice(deliveryFee)}</span>
                                                    : <span className="text-[var(--amber-warm)] italic">Calculated at checkout</span>}
                                        </span>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-[rgba(253,248,240,0.1)] w-full mb-[16px]" />

                                <div className="flex items-baseline justify-between mb-[24px]" aria-label={`Order total: Rs. ${total()}`}>
                                    <span className="text-[16px] font-[700] text-white">Total</span>
                                    <span className="text-[28px] font-[700] text-[var(--amber-pale)] font-display leading-none">
                                        {formatPrice(total())}
                                    </span>
                                </div>

                                {/* Minimum order error */}
                                {minOrderError && (
                                    <div role="alert" className="mb-3 p-3 rounded-[6px] bg-red-900/40 border border-red-500/50 text-[12px] text-red-300 leading-snug">
                                        ⚠ Minimum order amount is Rs. 800. Please add more items to continue.
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        if (subtotal() < MIN_ORDER) {
                                            setMinOrderError(true)
                                            return
                                        }
                                        setMinOrderError(false)
                                        onClose()
                                        router.push('/checkout')
                                    }}
                                    aria-label={`Proceed to checkout with ${itemCount} items for Rs. ${total()}`}
                                    className="btn-primary w-full py-[16px] text-[14px] shadow-[0_4px_16px_rgba(217,119,6,0.2)] flex justify-center gap-2"
                                >
                                    Proceed to Checkout <ArrowRight className="w-5 h-5 ml-1" />
                                </button>
                            </footer>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    )
}
