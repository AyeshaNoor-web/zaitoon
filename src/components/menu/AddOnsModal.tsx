'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Minus, CupSoda, Soup, Check } from 'lucide-react'
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

// Maps category keywords → which add-on category labels to surface first.
// Keys are lowercased partial matches against the item's category label.
const ADDON_RULES: Array<{ match: string[]; labels: string[] }> = [
    { match: ['bbq', 'botti', 'kabab', 'tikka', 'platter', 'ruz'], labels: ['Dips & Sauces', 'Beverages'] },
    { match: ['shawarma', 'lebanese', 'arabic', 'sahan'], labels: ['Dips & Sauces', 'Beverages'] },
    { match: ['burger', 'sandwich', 'wrap', 'crispy', 'smash', 'club'], labels: ['Beverages', 'Dips & Sauces'] },
    { match: ['appetizer', 'fries', 'chips'], labels: ['Dips & Sauces', 'Beverages'] },
]

const DEFAULT_ORDER = ['Beverages', 'Dips & Sauces']

function getAddonOrder(categoryLabel: string): string[] {
    const lower = (categoryLabel ?? '').toLowerCase()
    for (const rule of ADDON_RULES) {
        if (rule.match.some(kw => lower.includes(kw))) return rule.labels
    }
    return DEFAULT_ORDER
}

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
        .filter(row => {
            const label = row.categories?.label ?? ''
            return label === 'Beverages' || label === 'Dips & Sauces'
        })
        .map(row => ({
            id: row.id,
            name: row.name,
            price: row.price,
            priceLarge: row.price_large,
            hasSizes: row.has_sizes,
            categoryLabel: row.categories?.label ?? '',
        }))
}

export default function AddOnsModal({ mainItem, onClose }: Props) {
    const { addItem } = useCartStore()
    const [addOns, setAddOns] = useState<AddOn[]>([])
    const [selected, setSelected] = useState<Record<string, number>>({})
    const [mainQty, setMainQty] = useState(mainItem.quantity)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const addonOrder = getAddonOrder(mainItem.categoryLabel ?? '')
    // Don't upsell drinks/dips when the item being added is itself a drink or dip
    const isAddOnItself = ['beverages', 'dips & sauces'].includes((mainItem.categoryLabel ?? '').toLowerCase())

    useEffect(() => {
        fetchAddOns()
            .then(setAddOns)
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = prev
            document.removeEventListener('keydown', onKey)
        }
    }, [onClose])

    const priceFor = (addon: AddOn, size: string | null) =>
        size === 'large' && addon.priceLarge ? addon.priceLarge : addon.price

    const setQty = (id: string, size: 'small' | 'large' | null, qty: number) => {
        const key = `${id}|${size ?? 'none'}`
        setSelected(prev => {
            const next = { ...prev }
            if (qty <= 0) delete next[key]
            else next[key] = Math.min(qty, 10)
            return next
        })
    }

    const totalAddOnCost = Object.entries(selected).reduce((sum, [key, qty]) => {
        const [id, size] = key.split('|')
        const addon = addOns.find(a => a.id === id)
        return addon ? sum + priceFor(addon, size) * qty : sum
    }, 0)
    const total = mainItem.unitPrice * mainQty + totalAddOnCost

    const handleConfirm = () => {
        addItem({ ...mainItem, quantity: mainQty })
        Object.entries(selected).forEach(([key, qty]) => {
            const [id, sizeStr] = key.split('|')
            const size = sizeStr === 'none' ? null : sizeStr as 'small' | 'large'
            const addon = addOns.find(a => a.id === id)
            if (addon && qty > 0) {
                addItem({
                    menuItemId: addon.id,
                    name: addon.name,
                    size,
                    unitPrice: priceFor(addon, size),
                    quantity: qty,
                    imageUrl: null,
                })
            }
        })
        onClose()
    }

    const renderAddonRow = (addon: AddOn, size: 'small' | 'large' | null) => {
        const key = `${addon.id}|${size ?? 'none'}`
        const qty = selected[key] ?? 0
        const price = priceFor(addon, size)
        const name = size ? `${addon.name} (${size === 'small' ? 'Regular' : 'Large'})` : addon.name

        return (
            <li
                key={key}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors ${qty > 0
                    ? 'border-olive-600 bg-olive-100/60'
                    : 'border-line bg-surface hover:border-line-strong'}`}
            >
                <div className="min-w-0">
                    <p className="truncate text-[0.9375rem] font-medium text-ink">{name}</p>
                    <p className="tabular text-sm text-ink-2">+ {formatPrice(price)}</p>
                </div>

                {qty === 0 ? (
                    <button
                        onClick={() => setQty(addon.id, size, 1)}
                        aria-label={`Add ${name}`}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                ) : (
                    <div className="flex shrink-0 items-center rounded-full bg-olive-700 text-white">
                        <button
                            onClick={() => setQty(addon.id, size, qty - 1)}
                            aria-label={`Remove one ${name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
                        >
                            <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span aria-live="polite" className="tabular w-5 text-center text-sm font-semibold">{qty}</span>
                        <button
                            onClick={() => setQty(addon.id, size, qty + 1)}
                            aria-label={`Add one more ${name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </li>
        )
    }

    const groups = addonOrder
        .map(label => ({ label, items: addOns.filter(a => a.categoryLabel === label) }))
        .filter(g => g.items.length > 0)

    return (
        <div className="fixed inset-0 z-[900] flex items-end justify-center sm:items-center sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                aria-hidden="true"
                className="absolute inset-0 bg-olive-950/55 backdrop-blur-sm"
            />

            <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="addons-title"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-paper shadow-[var(--shadow-float)] sm:max-w-[500px] sm:rounded-[28px]"
            >
                <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden="true" />

                <header className="flex items-start justify-between gap-4 px-6 pb-4 pt-5">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-olive-600">Adding to your order</p>
                        <h2 id="addons-title" className="mt-1 text-[1.5rem] leading-tight">{mainItem.name}</h2>
                        <p className="tabular mt-1 text-sm text-ink-2">{formatPrice(mainItem.unitPrice)} each</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink hover:border-line-strong"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain border-t border-line px-6 py-5">
                    {/* Main item quantity */}
                    <div className="flex items-center justify-between">
                        <span className="text-[0.9375rem] font-medium text-ink">Quantity</span>
                        <div className="flex items-center rounded-full border border-line bg-surface">
                            <button
                                onClick={() => setMainQty(q => Math.max(1, q - 1))}
                                disabled={mainQty <= 1}
                                aria-label="Decrease quantity"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-paper-2 disabled:opacity-35"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span aria-live="polite" className="tabular w-8 text-center font-semibold">{mainQty}</span>
                            <button
                                onClick={() => setMainQty(q => Math.min(20, q + 1))}
                                aria-label="Increase quantity"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-paper-2"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {!isAddOnItself && (
                        loading ? (
                            <div className="space-y-2.5" aria-busy="true">
                                {[0, 1, 2].map(i => <div key={i} className="skeleton h-[62px] rounded-2xl" />)}
                            </div>
                        ) : error || groups.length === 0 ? (
                            <p className="rounded-2xl bg-paper-2 px-4 py-5 text-center text-sm text-ink-2">
                                {error ? "We couldn't load extras right now. You can still add the item." : 'No extras available right now.'}
                            </p>
                        ) : (
                            groups.map(({ label, items }) => (
                                <section key={label}>
                                    <h3 className="mb-3 flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-ink-2">
                                        {label === 'Beverages' ? <CupSoda className="h-4 w-4" /> : <Soup className="h-4 w-4" />}
                                        {label === 'Beverages' ? 'Add a drink' : 'Add a dip'}
                                    </h3>
                                    <ul className="space-y-2">
                                        {items.flatMap(addon =>
                                            addon.hasSizes && addon.priceLarge
                                                ? [renderAddonRow(addon, 'small'), renderAddonRow(addon, 'large')]
                                                : [renderAddonRow(addon, null)]
                                        )}
                                    </ul>
                                </section>
                            ))
                        )
                    )}
                </div>

                <footer className="border-t border-line bg-surface px-6 pb-6 pt-4 pb-safe">
                    <button onClick={handleConfirm} className="btn-primary w-full justify-between">
                        <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Add to order</span>
                        <span className="tabular">{formatPrice(total)}</span>
                    </button>
                </footer>
            </motion.div>
        </div>
    )
}
