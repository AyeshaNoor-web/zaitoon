import type { Branch } from '@/types'
import { DeliveryConfig, DEFAULT_DELIVERY_CONFIG } from '@/lib/api/settings'

export const DELIVERY_RATE_PER_KM = DEFAULT_DELIVERY_CONFIG.ratePerKm
export const MAX_DELIVERY_KM = DEFAULT_DELIVERY_CONFIG.maxKm
export const MIN_DELIVERY_FEE = DEFAULT_DELIVERY_CONFIG.baseFee
export const BASE_DELIVERY_KM = DEFAULT_DELIVERY_CONFIG.baseKm
export const BASE_DELIVERY_FEE = DEFAULT_DELIVERY_CONFIG.baseFee

function toRad(deg: number) { return deg * (Math.PI / 180) }

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function calculateBufferedHaversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const straightLine = haversineDistance(lat1, lng1, lat2, lng2)
    return Math.round(straightLine * 1.2 * 10) / 10
}

export async function calculateRealWorldDistance(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
): Promise<{ distanceKm: number; durationMin: number; source: 'google' | 'fallback' }> {
    try {
        const res = await fetch('/api/delivery/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                origin: { lat: originLat, lng: originLng },
                destination: { lat: destLat, lng: destLng }
            })
        })
        if (res.ok) {
            const data = await res.json()
            if (data.success && typeof data.distanceKm === 'number') {
                return {
                    distanceKm: data.distanceKm,
                    durationMin: data.durationMin,
                    source: data.source
                }
            }
        }
    } catch {
        // Silently fall back below
    }
    const dist = calculateBufferedHaversine(originLat, originLng, destLat, destLng)
    const durationMin = Math.max(5, Math.round((dist / 20) * 60))
    return { distanceKm: dist, durationMin, source: 'fallback' }
}

export function getNearestBranch(customerLat: number, customerLng: number, branches: Branch[]) {
    return branches
        .map(b => ({ ...b, distance: haversineDistance(customerLat, customerLng, b.lat, b.lng) }))
        .sort((a, b) => a.distance - b.distance)[0]
}

export function calculateDeliveryFee(distanceKm: number, config: DeliveryConfig = DEFAULT_DELIVERY_CONFIG): number {
    if (distanceKm > config.maxKm) return -1
    if (distanceKm <= config.baseKm) return config.baseFee
    const extraKm = distanceKm - config.baseKm
    return Math.round(config.baseFee + extraKm * config.ratePerKm)
}

export interface DeliveryFeeDetails {
    distanceKm: number
    fee: number | null
    outOfRange: boolean
    breakdownText: string
}

export function getDeliveryFeeDetails(distanceKm: number, config: DeliveryConfig = DEFAULT_DELIVERY_CONFIG): DeliveryFeeDetails {
    if (distanceKm > config.maxKm) {
        return {
            distanceKm,
            fee: null,
            outOfRange: true,
            breakdownText: `Delivery not available beyond ${config.maxKm} km.`
        }
    }
    const roundedDist = Math.round(distanceKm * 10) / 10
    if (roundedDist <= config.baseKm) {
        return {
            distanceKm: roundedDist,
            fee: config.baseFee,
            outOfRange: false,
            breakdownText: `Flat rate: PKR ${config.baseFee} (up to ${config.baseKm} km)`
        }
    }
    const extraKm = Math.round((roundedDist - config.baseKm) * 100) / 100
    const extraFee = Math.round(extraKm * config.ratePerKm)
    const totalFee = config.baseFee + extraFee
    return {
        distanceKm: roundedDist,
        fee: totalFee,
        outOfRange: false,
        breakdownText: `Base: PKR ${config.baseFee} (${config.baseKm} km) + PKR ${extraFee} (${roundedDist} km - ${config.baseKm} km = ${extraKm} km × PKR ${config.ratePerKm}/km)`
    }
}

export function calculateEstimatedDeliveryTime(distanceKm: number, prepTimeMin = 25): number {
    const ridingTimeMin = Math.round((distanceKm / 20) * 60)
    return prepTimeMin + Math.max(5, ridingTimeMin)
}

export function getOrderOptions(distanceKm: number, config: DeliveryConfig = DEFAULT_DELIVERY_CONFIG) {
    if (distanceKm > config.maxKm) {
        return {
            delivery: false, takeaway: true, dineIn: true,
            message: `Delivery not available beyond ${config.maxKm}km. Visit us for dine-in or takeaway!`
        }
    }
    return { delivery: true, takeaway: true, dineIn: true, message: null }
}
