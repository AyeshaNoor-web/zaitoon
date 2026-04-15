'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { formatPrice } from '@/lib/payment'
import { useLanguageStore } from '@/store/useLanguageStore'
import { translations } from '@/lib/translations'

const MIN_ORDER = 800

export default function MobileCartBar() {
    const { language, isRTL } = useLanguageStore()
    const t = translations[language]
    const router = useRouter()
    const count    = useCartStore(s => s.itemCount())
    const total    = useCartStore(s => s.total())
    const subtotal = useCartStore(s => s.subtotal())
    const [mounted, setMounted] = useState(false)
    const [minOrderError, setMinOrderError] = useState(false)

    useEffect(() => { setMounted(true) }, [])
    useEffect(() => { if (subtotal >= MIN_ORDER) setMinOrderError(false) }, [subtotal])

    const handleCheckout = () => {
        if (subtotal < MIN_ORDER) { setMinOrderError(true); return }
        setMinOrderError(false)
        router.push('/checkout')
    }

    const progressPct = Math.min(100, (subtotal / MIN_ORDER) * 100)

    return (
        <AnimatePresence>
            {mounted && count > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
                    dir={isRTL ? 'rtl' : 'ltr'}
                >
                    <div
                        className="px-4 pb-safe pt-2"
                        style={{
                            background: 'rgba(252,248,240,0.95)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            borderTop: '1px solid rgba(217,119,6,0.2)',
                            boxShadow: '0 -8px 32px rgba(0,0,0,0.12)'
                        }}
                    >
                        {/* Min order progress bar */}
                        {subtotal < MIN_ORDER && (
                            <div className="mb-2">
                                <div className="flex justify-between text-[10px] font-[600] mb-1"
                                    style={{ color: 'var(--stone)' }}>
                                    <span>Min. order Rs. {MIN_ORDER}</span>
                                    <span style={{ color: 'var(--amber-warm)' }}>
                                        Rs. {MIN_ORDER - subtotal} more
                                    </span>
                                </div>
                                <div className="w-full h-[3px] rounded-full overflow-hidden"
                                    style={{ background: 'var(--linen)' }}>
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: 'linear-gradient(90deg, var(--amber-warm), var(--amber-bright))' }}
                                        animate={{ width: `${progressPct}%` }}
                                        transition={{ duration: 0.4 }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        <AnimatePresence>
                            {minOrderError && (
                                <motion.p
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    role="alert"
                                    className="text-center text-[11px] font-[700] mb-1.5"
                                    style={{ color: '#DC2626' }}
                                >
                                    ⚠ Minimum order is Rs. 800 — add Rs. {MIN_ORDER - subtotal} more
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* Checkout button */}
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleCheckout}
                            className="w-full py-4 rounded-[14px] flex items-center justify-between px-5 font-[700] text-[14px] mb-1"
                            style={{
                                background: 'linear-gradient(135deg, var(--amber-warm) 0%, #E67E00 100%)',
                                color: 'var(--olive-darkest)',
                                boxShadow: '0 6px 20px rgba(217,119,6,0.35)',
                            }}
                        >
                            <span className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                                    style={{ background: 'rgba(46,58,28,0.12)' }}>
                                    <ShoppingCart className="w-4 h-4" />
                                </span>
                                <span>
                                    {language === 'en'
                                        ? `${count} item${count !== 1 ? 's' : ''} in cart`
                                        : `${count} ${t.itemsInCart}`}
                                </span>
                            </span>
                            <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className="font-display text-[17px] font-[800]">{formatPrice(total)}</span>
                                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                            </span>
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
