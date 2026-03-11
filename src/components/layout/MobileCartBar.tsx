'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { formatPrice } from '@/lib/payment'
import { useLanguageStore } from '@/store/useLanguageStore'
import { translations } from '@/lib/translations'

export default function MobileCartBar() {
    const { language, isRTL } = useLanguageStore()
    const t = translations[language]
    const router = useRouter()
    const count = useCartStore(s => s.itemCount())
    const total = useCartStore(s => s.total())
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <AnimatePresence>
            {mounted && count > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
                >
                    {/* Fade mask above */}
                    <div className="bg-[#FAF6EF]/90 backdrop-blur-xl border-t border-[#E7E0D8] px-4 pb-safe pt-2" dir={isRTL ? 'rtl' : 'ltr'}>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push('/checkout')}
                            className="w-full gold-shimmer py-4 rounded-2xl flex items-center justify-between px-5 font-bold text-[#0A1F13] shadow-xl shadow-[#C9920A]/20"
                        >
                            <span className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-xl bg-[#0A1F13]/15 flex items-center justify-center">
                                    <ShoppingCart className="w-4 h-4" />
                                </span>
                                <span className="text-sm">{language === 'en' ? `${count} item${count !== 1 ? 's' : ''} in cart` : `${count} ${t.itemsInCart}`}</span>
                            </span>
                            <span className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className="text-base">{formatPrice(total)}</span>
                                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                            </span>
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
