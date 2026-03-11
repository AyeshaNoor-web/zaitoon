import type { Branch } from '@/types'

export const DELIVERY_RATE_PER_KM = 30
export const MAX_DELIVERY_KM = 15
export const MIN_DELIVERY_FEE = 50

function toRad(deg: number) { return deg * (Math.PI / 180) }

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getNearestBranch(customerLat: number, customerLng: number, branches: Branch[]) {
    return branches
        .map(b => ({ ...b, distance: haversineDistance(customerLat, customerLng, b.lat, b.lng) }))
        .sort((a, b) => a.distance - b.distance)[0]
}

export function calculateDeliveryFee(distanceKm: number): number {
    if (distanceKm > MAX_DELIVERY_KM) return -1
    return Math.max(MIN_DELIVERY_FEE, Math.round(distanceKm * DELIVERY_RATE_PER_KM))
}

export function getOrderOptions(distanceKm: number) {
    if (distanceKm > MAX_DELIVERY_KM) {
        return {
            delivery: false, takeaway: true, dineIn: true,
            message: 'Delivery not available beyond 15km. Visit us for dine-in or takeaway!'
        }
    }
    return { delivery: true, takeaway: true, dineIn: true, message: null }
}
