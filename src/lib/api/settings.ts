import { createClient } from '@/lib/supabase/client'

export interface DeliveryConfig {
    baseKm: number
    baseFee: number
    ratePerKm: number
    maxKm: number
    freeAbove: number
}

export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
    baseKm: 5,
    baseFee: 150,
    ratePerKm: 30,
    maxKm: 15,
    freeAbove: 2000,
}

let cachedConfig: DeliveryConfig | null = null
let cacheExpiresAt = 0
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes

export async function getDeliverySettings(): Promise<DeliveryConfig> {
    const now = Date.now()
    if (cachedConfig && now < cacheExpiresAt) {
        return cachedConfig
    }

    try {
        const supabase = createClient()
        const { data, error } = await supabase.from('settings').select('key,value')
        if (error || !data) {
            return DEFAULT_DELIVERY_CONFIG
        }

        const map: Record<string, string> = {}
        data.forEach((row) => { map[row.key] = row.value })

        const config: DeliveryConfig = {
            baseKm: map.base_delivery_km ? parseFloat(map.base_delivery_km) : DEFAULT_DELIVERY_CONFIG.baseKm,
            baseFee: map.base_delivery_fee ? parseFloat(map.base_delivery_fee) : DEFAULT_DELIVERY_CONFIG.baseFee,
            ratePerKm: map.delivery_fee_per_km ? parseFloat(map.delivery_fee_per_km) : DEFAULT_DELIVERY_CONFIG.ratePerKm,
            maxKm: map.max_delivery_km ? parseFloat(map.max_delivery_km) : DEFAULT_DELIVERY_CONFIG.maxKm,
            freeAbove: map.free_delivery_above !== undefined ? parseFloat(map.free_delivery_above) : DEFAULT_DELIVERY_CONFIG.freeAbove,
        }

        cachedConfig = config
        cacheExpiresAt = now + CACHE_TTL_MS
        return config
    } catch {
        return DEFAULT_DELIVERY_CONFIG
    }
}

export function clearDeliverySettingsCache() {
    cachedConfig = null
    cacheExpiresAt = 0
}
