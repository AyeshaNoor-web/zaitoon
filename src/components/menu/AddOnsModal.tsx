'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag, CupSoda, UtensilsCrossed } from 'lucide-react'
import { formatPrice } from '@/lib/payment'
import { useCartStore } from '@/store/useCartStore'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface AddOn {
    id: string
    name: string
    price: number
    priceLarge: number | null
    hasSizes: boolean
    categoryLabel: string
}

interface SupabaseAddOnRow {
    id: string
    name: string
    price: number
    price_large: number | null
    has_sizes: boolean
    categories: { label: string } | null
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
    variantId?: string
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
        .select('id, name, price, price_large, has_sizes, categories(label)')
        .eq('is_available', true)
        .eq('price_on_request', false)
        .not('price', 'is', null)
        .order('price')

    if (error) throw error

    // Filter client-side because .in() on a joined column doesn't work in all PostgREST versions
    return (data as unknown as SupabaseAddOnRow[] ?? [])
        .filter((row) => {
            const label: string = row.categories?.label ?? ''
            return label === 'Beverages' || label === 'Dips & Sauces'
        })
        .map((row) => ({
            id: row.id,
            name: row.name,
            price: row.price,
            priceLarge: row.price_large,
            hasSizes: row.has_sizes,
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

    const setQty = (id: string, size: 'small' | 'large' | null, qty: number) => {
        const key = `${id}|${size ?? 'none'}`
        setSelected(prev => {
            if (qty <= 0) {
                const next = { ...prev }
                delete next[key]
                return next
            }
            return { ...prev, [key]: Math.min(qty, 10) }
        })
    }

    const totalAddOnCost = Object.entries(selected).reduce((sum, [key, qty]) => {
        const [id, size] = key.split('|')
        const addon = addOns.find(a => a.id === id)
        if (!addon) return sum
        const price = (size === 'large' && addon.priceLarge) ? addon.priceLarge : addon.price
        return sum + price * qty
    }, 0)

    const selectedCount = Object.values(selected).reduce((s, q) => s + q, 0)

    const handleConfirm = () => {
        addItem(mainItem)
        Object.entries(selected).forEach(([key, qty]) => {
            const [id, sizeStr] = key.split('|')
            const size = sizeStr === 'none' ? null : sizeStr as 'small' | 'large'
            const addon = addOns.find(a => a.id === id)
            if (addon && qty > 0) {
                const price = (size === 'large' && addon.priceLarge) ? addon.priceLarge : addon.price
                addItem({
                    menuItemId: addon.id,
                    name: addon.name,
                    size: size,
                    unitPrice: price,
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

    const renderAddonRow = (addon: AddOn, size: 'small' | 'large' | null) => {
        const key = `${addon.id}|${size ?? 'none'}`
        const qty = selected[key] ?? 0
        const price = size === 'large' && addon.priceLarge ? addon.priceLarge : addon.price
        const name = size ? `${addon.name} (${size === 'small' ? 'Regular' : 'Large'})` : addon.name

        return (
            <li
                key={key}
                className={`flex items-center justify-between px-3.5 py-3 rounded-[10px] border-[1.5px] transition-all duration-200 ${qty > 0
                    ? 'border-[var(--green-base)] bg-[var(--cream)] shadow-sm'
                    : 'border-[var(--linen)] bg-[var(--parchment)] hover:border-[var(--green-pale)]'
                    }`}
            >
                <div className="flex-1 min-w-0">
                    <span className="text-[14px] font-[600] text-[var(--charcoal)] block truncate">
                        {name}
                    </span>
                    <span className="text-[12px] font-[600] text-[var(--green-dark)]">
                        +{formatPrice(price)}
                    </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                    {qty === 0 ? (
                        <button
                            onClick={() => setQty(addon.id, size, 1)}
                            aria-label={`Add ${name}`}
                            className="w-8 h-8 rounded-full text-white flex items-center justify-center transition-colors shadow-sm"
                            style={{ background: 'linear-gradient(135deg, var(--orange-rich), var(--orange-warm))', boxShadow: '0 2px 8px rgba(168,35,35,0.30)' }}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-1.5 rounded-full px-1.5 py-1" style={{ background: 'linear-gradient(135deg, var(--green-dark), var(--green-darkest))' }}>
                            <button
                                onClick={() => setQty(addon.id, size, qty - 1)}
                                aria-label={`Remove one ${name}`}
                                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors text-white"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span
                                className="text-[13px] font-[700] text-white w-5 text-center"
                                aria-live="polite"
                                aria-label={`${qty} ${name} selected`}
                            >
                                {qty}
                            </span>
                            <button
                                onClick={() => setQty(addon.id, size, qty + 1)}
                                aria-label={`Add one more ${name}`}
                                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors text-white"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </li>
        )
    }

    // Group and sort by intelligent order
    const grouped = addonOrder.reduce<Record<string, AddOn[]>>((acc, label) => {
        acc[label] = addOns.filter(a => a.categoryLabel === label)
        return acc
    }, {})

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
                className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 z-[901] w-full sm:w-[480px] max-h-[88dvh] flex flex-col bg-[var(--green-mid)] rounded-[16px] border border-[var(--green-darkest)] shadow-[0_32px_80px_rgba(76,92,45,0.45)] overflow-hidden"
            >
                {/* Header */}
                <header className="flex items-start justify-between px-5 py-4 border-b border-[rgba(251,246,246,0.24)] shrink-0 bg-[rgba(251,246,246,0.14)]">
                    <div>
                        <h2 className="text-[17px] font-display font-[700] text-[var(--cream)] leading-tight">
                            Want to add anything extra?
                        </h2>
                        <p className="text-[12px] text-[rgba(251,246,246,0.85)] mt-0.5">
                            Adding: <span className="font-[600] text-[var(--cream)]">{mainItem.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close add-ons"
                        className="w-8 h-8 shrink-0 ml-3 flex items-center justify-center rounded-full border border-[rgba(251,246,246,0.35)] text-[var(--cream)] hover:bg-[rgba(251,246,246,0.18)] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </header>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="w-7 h-7 border-[3px] border-[var(--linen)] border-t-[var(--green-base)] rounded-full animate-spin" />
                            <p className="text-[12px] text-[var(--stone)]">Loading extras&hellip;</p>
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
                                    <p className="text-[11px] font-[700] uppercase tracking-[0.1em] text-[var(--cream)] mb-3 flex items-center gap-1.5">
                                        {label === 'Beverages' ? <CupSoda className="w-3.5 h-3.5" /> : <UtensilsCrossed className="w-3.5 h-3.5" />}
                                        {label}
                                    </p>
                                    <ul className="space-y-2">
                                        {items.flatMap(addon => {
                                            if (addon.hasSizes && addon.priceLarge) {
                                                return [
                                                    renderAddonRow(addon, 'small'),
                                                    renderAddonRow(addon, 'large')
                                                ]
                                            }
                                            return renderAddonRow(addon, null)
                                        })}
                                    </ul>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Footer */}
                <footer className="px-5 py-4 border-t border-[rgba(251,246,246,0.24)] shrink-0 space-y-2.5 bg-[rgba(251,246,246,0.14)]">
                    {selectedCount > 0 && (
                        <p className="text-[12px] text-center text-[var(--stone)]">
                             {selectedCount} extra{selectedCount !== 1 ? 's' : ''} selected
                            &nbsp;·&nbsp;
                            <span className="font-[700] text-[var(--green-dark)]">+{formatPrice(totalAddOnCost)}</span>
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
