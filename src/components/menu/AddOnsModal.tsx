'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag } from 'lucide-react'
import { formatPrice } from '@/lib/payment'
import { useCartStore, type CartItem } from '@/store/useCartStore'
import { getMenuItems } from '@/lib/api/menu'

interface AddOn {
    id: string
    name: string
    price: number
    category: string
    quantity: number
}

interface MainItem {
    menuItemId: string
    name: string
    size: 'small' | 'large' | null
    unitPrice: number
    quantity: number
    imageUrl: string | null
}

interface Props {
    mainItem: MainItem
    onClose: () => void
}

// Add-on categories to show
const ADDON_CATEGORIES = ['beverages', 'dips']

export default function AddOnsModal({ mainItem, onClose }: Props) {
    const { addItem } = useCartStore()
    const [addOns, setAddOns] = useState<AddOn[]>([])
    const [selected, setSelected] = useState<Record<string, number>>({}) // id → qty
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMenuItems()
            .then(items => {
                const filtered = items
                    .filter((i: any) => {
                        const cat = i.category ?? ''
                        const avail = i.isAvailable ?? i.is_available ?? true
                        const priceOnReq = i.priceOnRequest ?? i.price_on_request ?? false
                        return ADDON_CATEGORIES.includes(cat) && avail && !priceOnReq && i.price != null
                    })
                    .map((i: any) => ({
                        id: i.id,
                        name: i.name,
                        price: i.price as number,
                        category: i.category,
                        quantity: 0,
                    }))
                setAddOns(filtered)
            })
            .catch(() => setAddOns([]))
            .finally(() => setLoading(false))
    }, [])

    const setQty = (id: string, qty: number) => {
        setSelected(prev => {
            if (qty <= 0) {
                const next = { ...prev }
                delete next[id]
                return next
            }
            return { ...prev, [id]: qty }
        })
    }

    const totalAddOnCost = addOns.reduce((sum, a) => {
        const qty = selected[a.id] ?? 0
        return sum + a.price * qty
    }, 0)

    const selectedCount = Object.values(selected).reduce((s, q) => s + q, 0)

    const handleConfirm = () => {
        // Add main item first
        addItem(mainItem)

        // Add each selected add-on
        addOns.forEach(a => {
            const qty = selected[a.id] ?? 0
            if (qty > 0) {
                addItem({
                    menuItemId: a.id,
                    name: a.name,
                    size: null,
                    unitPrice: a.price,
                    quantity: qty,
                    imageUrl: null,
                })
            }
        })
        onClose()
    }

    const handleSkip = () => {
        // Add only main item, no add-ons
        addItem(mainItem)
        onClose()
    }

    // Group add-ons by category
    const grouped = ADDON_CATEGORIES.reduce<Record<string, AddOn[]>>((acc, cat) => {
        acc[cat] = addOns.filter(a => a.category === cat)
        return acc
    }, {})

    const categoryLabel: Record<string, string> = {
        beverages: '🥤 Cold Drinks',
        dips: '🫙 Dips & Sauces',
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                aria-hidden="true"
                className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                role="dialog"
                aria-label="Add extras to your order"
                aria-modal="true"
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.97 }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                onClick={e => e.stopPropagation()}
                className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-[100] w-full sm:w-[480px] max-h-[85dvh] flex flex-col bg-[var(--parchment)] rounded-[14px] border border-[var(--linen)] shadow-[0_24px_60px_rgba(0,0,0,0.25)] overflow-hidden"
            >
                {/* Header */}
                <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--linen)] shrink-0">
                    <div>
                        <h2 className="text-[17px] font-display font-[700] text-[var(--charcoal)] leading-tight">
                            Add Extras?
                        </h2>
                        <p className="text-[12px] text-[var(--stone)] mt-0.5">
                            Adding: <span className="font-[600] text-[var(--olive-base)]">{mainItem.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close add-ons"
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--linen)] text-[var(--stone)] hover:bg-[var(--linen)] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </header>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="w-6 h-6 border-2 border-[var(--linen)] border-t-[var(--olive-base)] rounded-full animate-spin" />
                        </div>
                    ) : addOns.length === 0 ? (
                        <p className="text-center text-[13px] text-[var(--stone)] py-6">No add-ons available right now.</p>
                    ) : (
                        ADDON_CATEGORIES.map(cat => {
                            const catItems = grouped[cat] ?? []
                            if (catItems.length === 0) return null
                            return (
                                <div key={cat}>
                                    <p className="text-[11px] font-[700] uppercase tracking-[0.1em] text-[var(--stone)] mb-2.5">
                                        {categoryLabel[cat]}
                                    </p>
                                    <ul className="space-y-2">
                                        {catItems.map(addon => {
                                            const qty = selected[addon.id] ?? 0
                                            return (
                                                <li
                                                    key={addon.id}
                                                    className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] border-[1.5px] transition-all ${qty > 0
                                                        ? 'border-[var(--olive-base)] bg-[var(--cream)]'
                                                        : 'border-[var(--linen)] bg-white'
                                                        }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[14px] font-[600] text-[var(--charcoal)] block truncate">
                                                            {addon.name}
                                                        </span>
                                                        <span className="text-[12px] font-[500] text-[var(--olive-base)]">
                                                            {formatPrice(addon.price)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                                        {qty === 0 ? (
                                                            <button
                                                                onClick={() => setQty(addon.id, 1)}
                                                                aria-label={`Add ${addon.name}`}
                                                                className="w-7 h-7 rounded-full bg-[var(--olive-base)] text-white flex items-center justify-center hover:bg-[var(--olive-dark)] transition-colors"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-1 bg-[var(--olive-darkest)] rounded-full px-1 py-0.5">
                                                                <button
                                                                    onClick={() => setQty(addon.id, qty - 1)}
                                                                    aria-label={`Remove one ${addon.name}`}
                                                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
                                                                >
                                                                    <Minus className="w-3 h-3" />
                                                                </button>
                                                                <span className="text-[13px] font-[700] text-white w-4 text-center" aria-live="polite">
                                                                    {qty}
                                                                </span>
                                                                <button
                                                                    onClick={() => setQty(addon.id, qty + 1)}
                                                                    aria-label={`Add one more ${addon.name}`}
                                                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Footer */}
                <footer className="px-5 py-4 border-t border-[var(--linen)] shrink-0 space-y-2.5 bg-[var(--parchment)]">
                    {selectedCount > 0 && (
                        <p className="text-[12px] text-center text-[var(--stone)]">
                            {selectedCount} add-on{selectedCount !== 1 ? 's' : ''} selected · +{formatPrice(totalAddOnCost)}
                        </p>
                    )}
                    <button
                        onClick={handleConfirm}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-[14px]"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        {selectedCount > 0 ? `Add to Cart (+${formatPrice(totalAddOnCost)})` : 'Add to Cart'}
                    </button>
                    <button
                        onClick={handleSkip}
                        className="w-full py-2.5 text-[13px] font-[600] text-[var(--stone)] hover:text-[var(--charcoal)] transition-colors"
                    >
                        Skip — add without extras
                    </button>
                </footer>
            </motion.div>
        </AnimatePresence>
    )
}
