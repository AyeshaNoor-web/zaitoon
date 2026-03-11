import { BRANCHES } from '@/lib/mock/data'
import type { Branch } from '@/types'

/** Haversine formula — returns distance in km between two lat/lng points */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface NearestBranchResult {
    branch: Branch
    distanceKm: number
}

/** Returns the nearest branch and its distance in km from the given coordinates */
export function getNearestBranch(lat: number, lng: number): NearestBranchResult {
    let nearest = BRANCHES[0]
    let minDist = haversineKm(lat, lng, BRANCHES[0].lat, BRANCHES[0].lng)

    for (const branch of BRANCHES.slice(1)) {
        const dist = haversineKm(lat, lng, branch.lat, branch.lng)
        if (dist < minDist) {
            minDist = dist
            nearest = branch
        }
    }

    return { branch: nearest, distanceKm: Math.round(minDist * 10) / 10 }
}
