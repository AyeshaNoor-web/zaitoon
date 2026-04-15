'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Star } from 'lucide-react'
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
    const [isHovered, setIsHovered] = useState(false)

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
            className="relative flex flex-col h-full overflow-hidden cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: 'white',
                borderRadius: 14,
                border: '1.5px solid var(--linen)',
                transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease',
                transform: isHovered && !isUnavailable ? 'translateY(-5px)' : 'translateY(0)',
                boxShadow: isHovered && !isUnavailable
                    ? '0 16px 48px rgba(28,25,23,0.12), 0 4px 16px rgba(28,25,23,0.06)'
                    : '0 1px 4px rgba(28,25,23,0.05)',
                borderColor: isHovered && !isUnavailable ? 'rgba(217,119,6,0.35)' : 'var(--linen)',
            }}
        >
            {/* IMAGE AREA */}
            <div className="relative w-full aspect-[5/3] overflow-hidden" style={{ borderRadius: '12px 12px 0 0' }}>
                {item.image_url ? (
                    <Image
                        src={item.image_url}
                        alt={`${item.name}${item.description ? ' — ' + item.description.slice(0, 40) : ''}`}
                        width={400}
                        height={300}
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="w-full h-full object-cover"
                        style={{
                            transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
                            transform: isHovered ? 'scale(1.07)' : 'scale(1)',
                        }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                ) : null}

                {/* Fallback emoji */}
                <div className={`absolute inset-0 flex items-center justify-center ${item.image_url ? 'hidden' : ''}`}
                    style={{ background: 'var(--cream)' }}>
                    <span className="text-6xl drop-shadow-sm select-none"
                        style={{ transition: 'transform 0.5s ease', transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}>
                        {emoji}
                    </span>
                </div>

                {/* Gradient overlay — subtle scrim at bottom */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(180deg, transparent 55%, rgba(28,25,23,0.18) 100%)' }} />

                {/* Sold Out Overlay */}
                {isUnavailable && (
                    <div className="absolute inset-0 flex items-center justify-center z-30"
                        style={{ background: 'rgba(28,25,23,0.72)', backdropFilter: 'blur(3px)' }}>
                        <span className="text-white font-[700] text-[11px] tracking-[0.12em] uppercase px-3 py-1.5 rounded-[6px]"
                            style={{ border: '1px solid rgba(255,255,255,0.18)' }}>
                            {t.soldOut}
                        </span>
                    </div>
                )}

                {/* Preptime Badge */}
                {prepTime && (
                    <div className={`absolute top-2.5 ${isRTL ? 'left-2.5' : 'right-2.5'} z-20 flex items-center gap-1 text-[11px] font-[600] px-2 py-1 rounded-[6px]`}
                        style={{
                            background: 'rgba(28,25,23,0.65)',
                            backdropFilter: 'blur(8px)',
                            color: 'rgba(253,248,240,0.88)',
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                        🕐 {prepTime}m
                    </div>
                )}

                {/* Tags overlay */}
                <div className={`absolute top-2.5 ${isRTL ? 'right-2.5' : 'left-2.5'} z-20 flex flex-col gap-1.5 items-start`}>
                    {tags.slice(0, 2).map(tag => {
                        const cfg = TAG_CONFIG[tag]
                        if (!cfg) return null
                        return <span key={tag} className={cfg.bgClass}>{cfg.label}</span>
                    })}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="p-3.5 flex flex-col flex-1">
                <h3 className="text-[15px] font-[700] mb-1 leading-snug truncate text-[var(--charcoal)]">{item.name}</h3>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mt-0.5" aria-label={`Rated ${item.rating} out of 5`}>
                    <Star className="w-3 h-3 fill-[var(--amber-warm)] text-[var(--amber-warm)]" />
                    <span className="text-[11px] font-[600] text-[var(--stone)]">{item.rating}</span>
                </div>

                {/* Description */}
                {item.description && (
                    <p className="text-[12px] text-[var(--stone)] font-[300] leading-snug line-clamp-2 mt-2 flex-grow">
                        {item.description}
                    </p>
                )}
                {!item.description && <div className="flex-grow" />}

                {/* Size toggle */}
                {hasSizes && !priceOnRequest && (
                    <div role="radiogroup" aria-label="Select size" className="flex gap-2 mt-4">
                        {(['small', 'large'] as const).map(s => {
                            const selected = selectedSize === s
                            return (
                                <button
                                    key={s}
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => setSelectedSize(s)}
                                    className="flex-1 py-[7px] rounded-[6px] text-[12px] font-[600] transition-all duration-200"
                                    style={{
                                        background: selected
                                            ? 'linear-gradient(135deg, var(--olive-base), var(--olive-dark))'
                                            : 'transparent',
                                        color: selected ? 'white' : 'var(--stone)',
                                        border: selected
                                            ? '1.5px solid transparent'
                                            : '1.5px solid var(--linen)',
                                        boxShadow: selected ? '0 2px 8px rgba(138,154,91,0.3)' : 'none',
                                    }}
                                >
                                    {s === 'small' ? t.smallSize : t.largeSize}
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* BOTTOM ROW */}
                <footer className="mt-3.5 pt-3.5 flex items-center justify-between"
                    style={{ borderTop: '1px solid var(--linen)' }}>
                    {priceOnRequest ? (
                        <span className="text-[12px] italic text-[var(--stone)]">{t.askPrice}</span>
                    ) : (
                        <span className="font-display text-[15px] font-[700]" style={{ color: 'var(--olive-darkest)' }}>
                            {formatPrice(displayPrice!)}
                        </span>
                    )}

                    {!isUnavailable && !priceOnRequest && (
                        <AnimatePresence mode="wait">
                            {qty === 0 ? (
                                <motion.button
                                    key="add"
                                    initial={{ scale: 0.85, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.85, opacity: 0 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.94 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                    onClick={() => setShowAddOns(true)}
                                    aria-label={`${t.add} ${item.name} ${t.addToCart}`}
                                    className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-[7px] text-[12px] font-[700] tracking-wide transition-shadow"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--amber-warm) 0%, #E67E00 100%)',
                                        color: 'var(--olive-darkest)',
                                        boxShadow: '0 3px 10px rgba(217,119,6,0.35)',
                                    }}
                                >
                                    {t.add} <Plus className="w-3.5 h-3.5" />
                                </motion.button>
                            ) : (
                                <motion.div
                                    key="qty"
                                    initial={{ scale: 0.85, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.85, opacity: 0 }}
                                    className="flex items-center gap-1.5 rounded-[8px] p-[3px]"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--olive-darkest), var(--olive-dark))',
                                        border: '1.5px solid rgba(138,154,91,0.4)',
                                    }}
                                >
                                    <button
                                        onClick={() => updateQuantity(cartKey, qty - 1)}
                                        aria-label={`Remove one ${item.name}`}
                                        className="w-[28px] h-[28px] flex items-center justify-center rounded-[5px] text-[var(--cream)] transition-colors hover:bg-white/10"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span
                                        aria-live="polite"
                                        aria-label={`${qty} in cart`}
                                        className="text-[14px] font-[700] w-[20px] text-center text-[var(--cream)]"
                                    >
                                        {qty}
                                    </span>
                                    <button
                                        onClick={() => updateQuantity(cartKey, qty + 1)}
                                        aria-label={`Add one more ${item.name}`}
                                        className="w-[28px] h-[28px] flex items-center justify-center rounded-[5px] text-[var(--cream)] transition-colors hover:bg-white/10"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </footer>
            </div>

            {/* Add-Ons Modal Portal */}
            {showAddOns && typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
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
                </AnimatePresence>,
                document.body
            )}
        </article>
    )
}
