'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useHydrated } from '@/store/hydration'
import { formatPrice } from '@/lib/payment'
import { translations } from '@/lib/translations'
import { SITE } from '@/lib/site'

export default function MobileCartBar() {
    const { language } = useLanguageStore()
    const t = translations[language]
    const router = useRouter()
    const hydrated = useHydrated()
    const count = useCartStore(s => s.itemCount())
    const subtotal = useCartStore(s => s.subtotal())
    const [nudge, setNudge] = useState(false)

    const remaining = Math.max(0, SITE.minOrder - subtotal)
    const progressPct = Math.min(100, (subtotal / SITE.minOrder) * 100)

    const handleCheckout = () => {
        if (remaining > 0) {
            setNudge(true)
            setTimeout(() => setNudge(false), 2400)
            return
        }
        router.push('/checkout')
    }

    return (
        <AnimatePresence>
            {hydrated && count > 0 && (
                <motion.div
                    initial={{ y: 120 }}
                    animate={{ y: 0 }}
                    exit={{ y: 120 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 340 }}
                    className="fixed inset-x-0 bottom-0 z-40 px-3 pb-safe lg:hidden"
                >
                    <div className="overflow-hidden rounded-[22px] bg-ink text-paper shadow-[var(--shadow-float)]">
                        {remaining > 0 && (
                            <div className="px-4 pt-3">
                                <div className="flex justify-between text-xs">
                                    <span className={nudge ? 'font-semibold text-ember-100' : 'text-paper/65'}>
                                        {nudge ? `Minimum order is ${formatPrice(SITE.minOrder)}` : `Add ${formatPrice(remaining)} more to checkout`}
                                    </span>
                                    <span className="tabular text-paper/65">{formatPrice(subtotal)} / {formatPrice(SITE.minOrder)}</span>
                                </div>
                                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                                    <motion.div
                                        className="h-full rounded-full bg-ember-500"
                                        animate={{ width: `${progressPct}%` }}
                                        transition={{ duration: 0.4 }}
                                    />
                                </div>
                            </div>
                        )}
                        <motion.button
                            onClick={handleCheckout}
                            animate={nudge ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3.5"
                        >
                            <span className="flex items-center gap-3">
                                <span className="tabular inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-ember-500 px-2 text-sm font-bold text-white">
                                    {count}
                                </span>
                                <span className="text-sm font-medium">
                                    {language === 'en' ? `item${count === 1 ? '' : 's'} · View order` : t.itemsInCart}
                                </span>
                            </span>
                            <span className="flex items-center gap-2 text-[0.9375rem] font-semibold">
                                <span className="tabular">{formatPrice(subtotal)}</span>
                                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                            </span>
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
