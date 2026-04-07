'use client'
import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Star, Clock, Flame, Leaf, Sparkles } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { formatPrice } from '@/lib/payment'
import { useLanguageStore } from '@/store/useLanguageStore'
import { translations } from '@/lib/translations'
import type { MenuItem } from '@/types'
import AddOnsModal from '@/components/menu/AddOnsModal'

export default function MenuItemCard({ item }: { item: MenuItem }) {
    const { language, isRTL } = useLanguageStore()
    const t = translations[language]

    const TAG_CONFIG: Record<string, { label: string; bgClass: string }> = {
        bestseller: { label: t.bestsellerLabel, bgClass: 'badge-bestseller' },
        new: { label: t.newLabel, bgClass: 'badge-new' },
    }

    const FOOD_EMOJI: Record<string, string> = {
        shawarma: '🌯', bbq: '🥩', burger: '🍔', sides: '🍟',
        drinks: '🥤', dips: '🫙', default: '🍽️',
    }

    const [selectedSize, setSelectedSize] = useState<'small' | 'large'>('small')
    const { items, addItem, updateQuantity } = useCartStore()
    const [showAddOns, setShowAddOns] = useState(false)

    // Support both camelCase (types) and snake_case (DB response)
    const hasSizes = item.hasSizes ?? (item as any).has_sizes ?? false
    const isAvailableRaw = item.isAvailable ?? (item as any).is_available
    const priceL = item.priceL ?? (item as any).price_large ?? null
    const prepTime = item.prepTime ?? (item as any).prep_time ?? null
    const priceOnRequest = item.priceOnRequest ?? (item as any).price_on_request ?? false
    const tags: string[] = (item.tags ?? [item as any].flatMap(() => [])) as string[]

    const sizeKey = hasSizes ? selectedSize : 'default'
    const cartKey = `${item.id}-${sizeKey}`
    const cartItem = items.find(i => i.id === cartKey)
    const qty = cartItem?.quantity ?? 0

    const displayPrice = hasSizes
        ? (selectedSize === 'large' && priceL ? priceL : item.price)
        : item.price
    const isUnavailable = isAvailableRaw === false

    const emoji = FOOD_EMOJI[item.category ?? 'default'] ?? '🍽️'

    return (
        <article
            aria-label={`${item.name}, Rs. ${displayPrice}`}
            className="card relative flex flex-col h-full overflow-hidden cursor-pointer"
        >
            {/* FULL WIDTH IMAGE AREA */}
            <div className="relative w-full aspect-[5/3] overflow-hidden rounded-t-[8px]">
                {item.image_url ? (
                    <Image
                        src={item.image_url}
                        alt={`${item.name}${item.description ? ' — ' + item.description.slice(0, 40) : ''}`}
                        width={400}
                        height={300}
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-[1.06]"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                ) : null}

                {/* Fallback Emoji Centered Context */}
                <div className={`absolute inset-0 flex items-center justify-center bg-[var(--cream)] ${item.image_url ? 'hidden' : ''}`}>
                    <span className="text-6xl drop-shadow-sm select-none transition-transform duration-500 hover:scale-[1.1]">{emoji}</span>
                </div>

                {/* Sold Out Overlay */}
                {isUnavailable && (
                    <div className="absolute inset-0 bg-[rgba(28,36,22,0.75)] flex items-center justify-center z-30">
                        <span className="text-white font-[700] text-[12px] tracking-[0.1em] uppercase backdrop-blur-sm px-3 py-1 border border-white/20 rounded-md">
                            {t.soldOut}
                        </span>
                    </div>
                )}

                {/* Preptime Badge */}
                {prepTime && (
                    <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-[var(--olive-darkest)] text-[rgba(253,248,240,0.7)] text-[11px] px-[7px] py-[3px] rounded-[3px] z-20 flex items-center gap-1 font-[600]`}>
                        🕐 {prepTime}m
                    </div>
                )}

                {/* Tags overlay */}
                <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'} z-20 flex flex-col gap-1.5 align-start items-start`}>
                    {tags.slice(0, 2).map(tag => {
                        const cfg = TAG_CONFIG[tag]
                        if (!cfg) return null
                        return (
                            <span key={tag} className={`${cfg.bgClass}`}>
                                {cfg.label}
                            </span>
                        )
                    })}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="p-3 flex flex-col flex-1">
                <h3 className="text-base font-bold mb-1 leading-snug truncate">{item.name}</h3>

                {/* Rating */}
                <div className="flex items-center gap-[6px] mt-1" aria-label={`Rated ${item.rating} out of 5`}>
                    <Star className="w-3 h-3 fill-[var(--amber-warm)] text-[var(--amber-warm)]" />
                    <span className="text-[11px] text-[var(--stone)] font-[600]">{item.rating}</span>
                </div>

                {/* Description */}
                {item.description && (
                    <p className="text-xs text-[var(--stone)] font-[300] leading-snug line-clamp-2 mt-1.5 flex-grow">
                        {item.description}
                    </p>
                )}
                {!item.description && <div className="flex-grow" />}

                {/* Size toggle */}
                {hasSizes && !priceOnRequest && (
                    <div
                        role="radiogroup"
                        aria-label="Select size"
                        className="flex gap-2 mt-4"
                    >
                        {(['small', 'large'] as const).map(s => {
                            const selected = selectedSize === s;
                            return (
                                <button
                                    key={s}
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => setSelectedSize(s)}
                                    className={`flex-1 py-[6px] rounded-[4px] text-[12px] font-[600] transition-colors border ${selected
                                        ? 'bg-[var(--olive-base)] text-white border-[var(--olive-base)]'
                                        : 'bg-transparent text-[var(--stone)] border-[var(--linen)] hover:border-[var(--olive-pale)] hover:text-[var(--charcoal)]'
                                        }`}
                                >
                                    {s === 'small' ? t.smallSize : t.largeSize}
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* BOTTOM ROW (Price + Action) */}
                <footer className="mt-3 pt-3 border-t border-[var(--linen)] flex items-center justify-between">
                    {priceOnRequest ? (
                        <span className="text-[12px] italic text-[var(--stone)]">{t.askPrice}</span>
                    ) : (
                        <span className="text-[14px] font-bold text-[var(--olive-darkest)]">
                            {formatPrice(displayPrice!)}
                        </span>
                    )}

                    {!isUnavailable && !priceOnRequest && (
                        <AnimatePresence mode="wait">
                            {qty === 0 ? (
                                <motion.button key="add"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                    onClick={() => setShowAddOns(true)}
                                    aria-label={`${t.add} ${item.name} ${t.addToCart}`}
                                    className="btn-primary !px-4 !py-2 !min-h-[32px] !text-[12px]"
                                >
                                    {t.add} <Plus className="w-4 h-4" />
                                </motion.button>
                            ) : (
                                <motion.div key="qty"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="flex items-center gap-2 bg-[var(--olive-darkest)] text-[var(--cream)] rounded-[4px] border-[2px] border-[var(--olive-base)] p-[2px]"
                                >
                                    <button
                                        onClick={() => updateQuantity(cartKey, qty - 1)}
                                        aria-label={`Remove one ${item.name}`}
                                        className="w-[28px] h-[28px] flex items-center justify-center rounded-[3px] hover:bg-white/10 transition-colors"
                                    >
                                        <Minus className="w-[14px] h-[14px]" />
                                    </button>
                                    <span
                                        aria-live="polite"
                                        aria-label={`${qty} in cart`}
                                        className="text-[14px] font-[600] w-[20px] text-center"
                                    >
                                        {qty}
                                    </span>
                                    <button
                                        onClick={() => updateQuantity(cartKey, qty + 1)}
                                        aria-label={`Add one more ${item.name}`}
                                        className="w-[28px] h-[28px] flex items-center justify-center rounded-[3px] hover:bg-white/10 transition-colors"
                                    >
                                        <Plus className="w-[14px] h-[14px]" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </footer>
            </div>

            {/* Add-Ons Modal */}
            <AnimatePresence>
                {showAddOns && (
                    <AddOnsModal
                        mainItem={{
                            menuItemId: item.id,
                            name: item.name,
                            size: hasSizes ? selectedSize : null,
                            unitPrice: displayPrice ?? 0,
                            quantity: 1,
                            imageUrl: item.image_url ?? null,
                            categoryLabel: (item as any).categories?.label ?? item.category ?? '',
                        }}
                        onClose={() => setShowAddOns(false)}
                    />
                )}
            </AnimatePresence>
        </article>
    )
}
