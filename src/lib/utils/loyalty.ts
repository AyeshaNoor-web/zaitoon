export const TIER_PERKS = {
    bronze: { discountPct: 0, freeDelivery: false },
    silver: { discountPct: 2, freeDelivery: false },
    gold: { discountPct: 5, freeDelivery: true },
    platinum: { discountPct: 10, freeDelivery: true },
} as const

export type SupportedTier = keyof typeof TIER_PERKS

/**
 * Applies tier perks to a subtotal + delivery fee.
 * Returns the tier discount (Rs.) and the final delivery fee after any free-delivery perk.
 */
export function applyTierPerks(
    tier: string,
    subtotal: number,
    deliveryFee: number
): { tierDiscount: number; finalDeliveryFee: number } {
    const perks = TIER_PERKS[tier as SupportedTier] ?? TIER_PERKS.bronze
    return {
        tierDiscount: Math.floor(subtotal * perks.discountPct / 100),
        finalDeliveryFee: perks.freeDelivery ? 0 : deliveryFee,
    }
}

/** 1 point per Rs. 100 spent */
export function calculateEarnedPoints(total: number): number {
    return Math.floor(total / 100)
}

/** Max 20% of subtotal can be offset by points */
export function maxRedeemablePoints(
    subtotal: number,
    availablePoints: number
): number {
    const maxByPct = Math.floor(subtotal * 0.20)
    return Math.min(availablePoints, maxByPct)
}

/** Emoji badge for a tier */
export function tierBadge(tier: string): string {
    if (tier === 'platinum') return '💎'
    if (tier === 'gold') return '🥇'
    if (tier === 'silver') return '🥈'
    return '🥉'
}
