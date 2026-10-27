'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Star, UtensilsCrossed, Clock3 } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useHydrated } from '@/store/hydration'
import { formatPrice } from '@/lib/payment'
import { useLanguageStore } from '@/store/useLanguageStore'
import { translations } from '@/lib/translations'
import type { MenuItem } from '@/types'
import AddOnsModal from '@/components/menu/AddOnsModal'

export default function MenuItemCard({ item, priority = false }: { item: MenuItem; priority?: boolean }) {
    const { language } = useLanguageStore()
    const t = translations[language]
    const hydrated = useHydrated()

    const variants = item.item_variants ?? []
    const hasVariants = variants.length > 0
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(hasVariants ? variants[0].id : null)
    const selectedVariant = hasVariants ? variants.find(v => v.id === selectedVariantId) ?? null : null

    const [selectedSize, setSelectedSize] = useState<'small' | 'large'>('small')
    const [showAddOns, setShowAddOns] = useState(false)
    const [imgFailed, setImgFailed] = useState(false)
    const { items, updateQuantity } = useCartStore()

    const hasSizes = item.hasSizes ?? item.has_sizes ?? false
    const isUnavailable = (item.isAvailable ?? item.is_available) === false
    const priceL = item.priceL ?? item.price_large ?? null
    const prepTime = item.prepTime ?? item.prep_time ?? null
    const tags = (item.tags ?? []) as string[]
    const badge = item.badge ?? (tags.includes('bestseller') ? t.bestsellerLabel : tags.includes('new') ? t.newLabel : null)
    const badgeClass = item.badge || tags.includes('bestseller') ? 'badge-bestseller' : 'badge-new'

    const displayPrice = selectedVariant
        ? selectedVariant.price
        : hasSizes && selectedSize === 'large' && priceL ? priceL : item.price
    const priceOnRequest = (item.priceOnRequest ?? item.price_on_request ?? false) || displayPrice == null

    const sizeKey = hasSizes ? selectedSize : 'default'
    const cartKey = `${item.id}-${sizeKey}${selectedVariantId ? `-${selectedVariantId}` : ''}`
    const qty = hydrated ? items.find(i => i.id === cartKey)?.quantity ?? 0 : 0

    const showImage = !!item.image_url && !imgFailed

    return (
        <article
            aria-label={item.name}
            className={`group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-surface transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isUnavailable
                ? 'opacity-75'
                : 'hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-lift)]'}`}
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
                {showImage ? (
                    <Image
                        src={item.image_url!}
                        alt={item.description ? `${item.name} — ${item.description.slice(0, 60)}` : item.name}
                        fill
                        priority={priority}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,var(--color-surface),var(--color-paper-2))]">
                        <UtensilsCrossed className="h-10 w-10 text-line-strong" />
                    </div>
                )}

                {badge && (
                    <span className={`${badgeClass} absolute start-3 top-3 shadow-sm`}>{badge}</span>
                )}
                {prepTime ? (
                    <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                        <Clock3 className="h-3 w-3" /> {prepTime} min
                    </span>
                ) : null}

                {isUnavailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-paper/60 backdrop-blur-[2px]">
                        <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper">{t.soldOut}</span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="font-sans text-[1.0625rem] font-semibold leading-snug tracking-normal text-ink">{item.name}</h3>
                    {item.rating ? (
                        <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-[0.8125rem] font-medium text-ink-2" aria-label={`Rated ${item.rating} out of 5`}>
                            <Star className="h-3.5 w-3.5 fill-saffron text-saffron" />
                            <span className="tabular">{Number(item.rating).toFixed(1)}</span>
                        </span>
                    ) : null}
                </div>

                {item.description && (
                    <p className="mt-1.5 line-clamp-2 text-[0.875rem] leading-relaxed text-ink-2">{item.description}</p>
                )}

                {hasVariants && (
                    <div role="radiogroup" aria-label="Choose an option" className="mt-3 flex flex-wrap gap-1.5">
                        {variants.map(v => {
                            const selected = selectedVariantId === v.id
                            return (
                                <button
                                    key={v.id}
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => setSelectedVariantId(v.id)}
                                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${selected
                                        ? 'border-olive-700 bg-olive-700 text-white'
                                        : 'border-line bg-paper text-ink-2 hover:border-line-strong hover:text-ink'}`}
                                >
                                    {v.label}
                                </button>
                            )
                        })}
                    </div>
                )}

                {hasSizes && !priceOnRequest && (
                    <div role="radiogroup" aria-label="Choose a size" className="mt-3 grid grid-cols-2 rounded-full bg-paper-2 p-1">
                        {(['small', 'large'] as const).map(s => {
                            const selected = selectedSize === s
                            return (
                                <button
                                    key={s}
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => setSelectedSize(s)}
                                    className={`rounded-full py-1.5 text-xs font-semibold transition-all ${selected ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink'}`}
                                >
                                    {s === 'small' ? t.smallSize : t.largeSize}
                                </button>
                            )
                        })}
                    </div>
                )}

                <div className="flex-1" />

                <footer className="mt-4 flex min-h-10 items-center justify-between gap-3">
                    {priceOnRequest ? (
                        <span className="text-sm italic text-ink-2">{t.askPrice}</span>
                    ) : (
                        <span className="price text-[1.0625rem] text-ink">{formatPrice(displayPrice!)}</span>
                    )}

                    {!isUnavailable && !priceOnRequest && (
                        <AnimatePresence mode="wait" initial={false}>
                            {qty === 0 ? (
                                <motion.button
                                    key="add"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    onClick={() => setShowAddOns(true)}
                                    aria-label={`Add ${item.name} to cart`}
                                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-paper transition-colors hover:bg-ember-600 active:scale-95"
                                >
                                    <Plus className="h-4 w-4" /> {t.add}
                                </motion.button>
                            ) : (
                                <motion.div
                                    key="qty"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex h-10 items-center rounded-full bg-olive-700 text-white"
                                >
                                    <button
                                        onClick={() => updateQuantity(cartKey, qty - 1)}
                                        aria-label={`Remove one ${item.name}`}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span aria-live="polite" className="tabular w-6 text-center text-sm font-semibold">{qty}</span>
                                    <button
                                        onClick={() => updateQuantity(cartKey, qty + 1)}
                                        aria-label={`Add one more ${item.name}`}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </footer>
            </div>

            {showAddOns && typeof document !== 'undefined' && createPortal(
                <AddOnsModal
                    mainItem={{
                        menuItemId: item.id,
                        name: selectedVariant ? `${item.name} (${selectedVariant.label})` : item.name,
                        size: hasSizes ? selectedSize : null,
                        variantId: selectedVariantId ?? undefined,
                        unitPrice: displayPrice ?? 0,
                        quantity: 1,
                        imageUrl: item.image_url ?? null,
                        categoryLabel: item.categories?.label ?? item.category ?? '',
                    }}
                    onClose={() => setShowAddOns(false)}
                />,
                document.body
            )}
        </article>
    )
}
