import type { LoyaltyTier } from '@/types'

export const POINTS_PER_100 = 1
export const POINTS_VALUE = 1
export const MAX_REDEMPTION_RATIO = 0.15

export const TIERS: Record<LoyaltyTier, { min: number; max: number; discount: number; label: string; color: string }> = {
    bronze: { min: 0, max: 499, discount: 0, label: '🥉 Bronze', color: '#CD7F32' },
    silver: { min: 500, max: 1499, discount: 0.02, label: '🥈 Silver', color: '#C0C0C0' },
    gold: { min: 1500, max: 4999, discount: 0.05, label: '🥇 Gold', color: '#D4A017' },
    platinum: { min: 5000, max: Infinity, discount: 0.10, label: '💎 Platinum', color: '#E5E4E2' },
}

export function getTier(points: number): LoyaltyTier {
    for (const [tier, cfg] of Object.entries(TIERS)) {
        if (points >= cfg.min && points <= cfg.max) return tier as LoyaltyTier
    }
    return 'bronze'
}

export function calcPointsEarned(total: number) { return Math.floor(total / 100) * POINTS_PER_100 }
export function getMaxRedeemable(points: number, total: number) {
    return Math.min(Math.floor(total * MAX_REDEMPTION_RATIO), points * POINTS_VALUE)
}
