'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag } from 'lucide-react'
import { formatPrice } from '@/lib/payment'
import { useCartStore } from '@/store/useCartStore'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface AddOn {
    id: string
    name: string
    price: number
    categoryLabel: string
}

interface MainItem {
    menuItemId: string
    name: string
    size: 'small' | 'large' | null
    unitPrice: number
    quantity: number
    imageUrl: string | null
    /** The category label string from the joined categories table e.g. "Shawarma", "BBQ Rolls" */
    categoryLabel?: string
}

interface Props {
    mainItem: MainItem
    onClose: () => void
}

// ── Intelligent add-on rules ────────────────────────────────────────────────
// Maps category keywords → which add-on category labels to surface first
// Keys are lowercased partial matches against the item's category label
const ADDON_RULES: Array<{ match: string[]; labels: string[] }> = [
    {
        // BBQ items → show dips first, then drinks
        match: ['bbq', 'botti', 'kabab', 'tikka', 'platter', 'ruz'],
        labels: ['Dips & Sauces', 'Beverages'],
    },
    {
        // Shawarma → garlic/hummus dips first, then drinks
        match: ['shawarma', 'lebanese', 'arabic', 'sahan'],
        labels: ['Dips & Sauces', 'Beverages'],
    },
    {
        // Burgers, wraps, sandwiches → drinks first, then dips
        match: ['burger', 'sandwich', 'wrap', 'crispy', 'smash', 'club'],
        labels: ['Beverages', 'Dips & Sauces'],
    },
    {
        // Appetizers / fries → dips first, then drinks
        match: ['appetizer', 'fries', 'chips'],
        labels: ['Dips & Sauces', 'Beverages'],
    },
]

const DEFAULT_ORDER = ['Beverages', 'Dips & Sauces']

function getAddonOrder(categoryLabel: string): string[] {
    const lower = (categoryLabel ?? '').toLowerCase()
    for (const rule of ADDON_RULES) {
        if (rule.match.some(kw => lower.includes(kw))) return rule.labels
    }
    return DEFAULT_ORDER
}

// ── Fetch add-ons directly via Supabase ─────────────────────────────────────
async function fetchAddOns(): Promise<AddOn[]> {
    const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, price, categories(label)')
        .eq('is_available', true)
        .eq('price_on_request', false)
        .not('price', 'is', null)
        .order('price')

    if (error) throw error

    // Filter client-side because .in() on a joined column doesn't work in all PostgREST versions
    return (data ?? [])
        .filter((row: any) => {
            const label: string = row.categories?.label ?? ''
            return label === 'Beverages' || label === 'Dips & Sauces'
        })
        .map((row: any) => ({
            id: row.id,
            name: row.name,
            price: row.price as number,
            categoryLabel: row.categories?.label ?? '',
        }))
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AddOnsModal({ mainItem, onClose }: Props) {
    const { addItem } = useCartStore()
    const [addOns, setAddOns] = useState<AddOn[]>([])
    const [selected, setSelected] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const addonOrder = getAddonOrder(mainItem.categoryLabel ?? '')

    useEffect(() => {
        fetchAddOns()
            .then(setAddOns)
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [])

    // Prevent body scroll while modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const setQty = (id: string, qty: number) => {
        setSelected(prev => {
            if (qty <= 0) {
                const next = { ...prev }
                delete next[id]
                return next
            }
            return { ...prev, [id]: Math.min(qty, 10) }
        })
    }

    const totalAddOnCost = addOns.reduce((sum, a) => {
        return sum + a.price * (selected[a.id] ?? 0)
    }, 0)

    const selectedCount = Object.values(selected).reduce((s, q) => s + q, 0)

    const handleConfirm = () => {
        addItem(mainItem)
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
        addItem(mainItem)
        onClose()
    }

    // Group and sort by intelligent order
    const grouped = addonOrder.reduce<Record<string, AddOn[]>>((acc, label) => {
        acc[label] = addOns.filter(a => a.categoryLabel === label)
        return acc
    }, {})

    const categoryEmoji: Record<string, string> = {
        'Beverages': '🥤',
        'Dips & Sauces': '🫙',
    }

    return (
        <>
            {/* Backdrop */}
            <motion.div
                key="addon-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                aria-hidden="true"
                className="fixed inset-0 z-[900] bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                key="addon-modal"
                role="dialog"
                aria-label="Add extras to your order"
                aria-modal="true"
                initial={{ opacity: 0, y: 48, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 48, scale: 0.96 }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                onClick={e => e.stopPropagation()}
                className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 z-[901] w-full sm:w-[480px] max-h-[88dvh] flex flex-col bg-[var(--parchment)] rounded-[16px] border border-[var(--linen)] shadow-[0_32px_80px_rgba(0,0,0,0.3)] overflow-hidden"
            >
                {/* Header */}
                <header className="flex items-start justify-between px-5 py-4 border-b border-[var(--linen)] shrink-0 bg-white">
                    <div>
                        <h2 className="text-[17px] font-display font-[700] text-[var(--charcoal)] leading-tight">
                            Want to add anything extra?
                        </h2>
                        <p className="text-[12px] text-[var(--stone)] mt-0.5">
                            Adding: <span className="font-[600] text-[var(--olive-base)]">{mainItem.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close add-ons"
                        className="w-8 h-8 shrink-0 ml-3 flex items-center justify-center rounded-full border border-[var(--linen)] text-[var(--stone)] hover:bg-[var(--linen)] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </header>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="w-7 h-7 border-[3px] border-[var(--linen)] border-t-[var(--olive-base)] rounded-full animate-spin" />
                            <p className="text-[12px] text-[var(--stone)]">Loading extras…</p>
                        </div>
                    ) : error || addOns.length === 0 ? (
                        <p className="text-center text-[13px] text-[var(--stone)] py-8">
                            No extras available right now.
                        </p>
                    ) : (
                        addonOrder.map(label => {
                            const items = grouped[label] ?? []
                            if (items.length === 0) return null
                            return (
                                <div key={label}>
                                    <p className="text-[11px] font-[700] uppercase tracking-[0.1em] text-[var(--stone)] mb-3 flex items-center gap-1.5">
                                        <span>{categoryEmoji[label]}</span>
                                        {label}
                                    </p>
                                    <ul className="space-y-2">
                                        {items.map(addon => {
                                            const qty = selected[addon.id] ?? 0
                                            return (
                                                <li
                                                    key={addon.id}
                                                    className={`flex items-center justify-between px-3.5 py-3 rounded-[10px] border-[1.5px] transition-all duration-200 ${qty > 0
                                                        ? 'border-[var(--olive-base)] bg-[var(--cream)] shadow-sm'
                                                        : 'border-[var(--linen)] bg-white hover:border-[var(--olive-pale)]'
                                                        }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[14px] font-[600] text-[var(--charcoal)] block truncate">
                                                            {addon.name}
                                                        </span>
                                                        <span className="text-[12px] font-[600] text-[var(--olive-base)]">
                                                            +{formatPrice(addon.price)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                                        {qty === 0 ? (
                                                            <button
                                                                onClick={() => setQty(addon.id, 1)}
                                                                aria-label={`Add ${addon.name}`}
                                                                className="w-8 h-8 rounded-full bg-[var(--olive-base)] text-white flex items-center justify-center hover:bg-[var(--olive-dark)] transition-colors shadow-sm"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 bg-[var(--olive-darkest)] rounded-full px-1.5 py-1">
                                                                <button
                                                                    onClick={() => setQty(addon.id, qty - 1)}
                                                                    aria-label={`Remove one ${addon.name}`}
                                                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors text-white"
                                                                >
                                                                    <Minus className="w-3 h-3" />
                                                                </button>
                                                                <span
                                                                    className="text-[13px] font-[700] text-white w-5 text-center"
                                                                    aria-live="polite"
                                                                    aria-label={`${qty} ${addon.name} selected`}
                                                                >
                                                                    {qty}
                                                                </span>
                                                                <button
                                                                    onClick={() => setQty(addon.id, qty + 1)}
                                                                    aria-label={`Add one more ${addon.name}`}
                                                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors text-white"
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
                <footer className="px-5 py-4 border-t border-[var(--linen)] shrink-0 space-y-2.5 bg-white">
                    {selectedCount > 0 && (
                        <p className="text-[12px] text-center text-[var(--stone)]">
                            {selectedCount} extra{selectedCount !== 1 ? 's' : ''} selected
                            &nbsp;·&nbsp;
                            <span className="font-[700] text-[var(--olive-base)]">+{formatPrice(totalAddOnCost)}</span>
                        </p>
                    )}
                    <button
                        onClick={handleConfirm}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-[14px]"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        {selectedCount > 0
                            ? `Add to Cart  (+${formatPrice(totalAddOnCost)})`
                            : 'Add to Cart'}
                    </button>
                    <button
                        onClick={handleSkip}
                        className="w-full py-2 text-[13px] font-[600] text-[var(--stone)] hover:text-[var(--charcoal)] transition-colors"
                    >
                        No thanks — skip extras
                    </button>
                </footer>
            </motion.div>
        </>
    )
}
