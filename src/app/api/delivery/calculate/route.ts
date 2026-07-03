import { NextResponse } from 'next/server'

interface DistanceResult {
    distanceKm: number
    durationMin: number
    source: 'google' | 'fallback'
}

// ── 30-Minute In-Memory TTL Cache ─────────────────────────────────────
const cache = new Map<string, { result: DistanceResult; expiresAt: number }>()
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

function getCacheKey(originLat: number, originLng: number, destLat: number, destLng: number): string {
    // Round coordinates to 3 decimal places (~100m accuracy) to maximize cache hits for nearby orders
    const oLat = originLat.toFixed(3)
    const oLng = originLng.toFixed(3)
    const dLat = destLat.toFixed(3)
    const dLng = destLng.toFixed(3)
    return `${oLat},${oLng}->${dLat},${dLng}`
}

// ── Haversine Fallback Calculation ────────────────────────────────────
function toRad(deg: number): number {
    return deg * (Math.PI / 180)
}

function calculateFallback(originLat: number, originLng: number, destLat: number, destLng: number): DistanceResult {
    const R = 6371
    const dLat = toRad(destLat - originLat)
    const dLng = toRad(destLng - originLng)
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(originLat)) * Math.cos(toRad(destLat)) * Math.sin(dLng / 2) ** 2
    const straightLineKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    // Apply 1.2x road variance buffer
    const distanceKm = Math.round(straightLineKm * 1.2 * 10) / 10
    // Estimate riding duration at ~20 km/h average city speed
    const durationMin = Math.max(5, Math.round((distanceKm / 20) * 60))

    return { distanceKm, durationMin, source: 'fallback' }
}

// ── Fetch Google Maps Distance Matrix with Timeout & Retry ────────────
async function fetchGoogleDistance(
    apiKey: string,
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
): Promise<DistanceResult | null> {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&mode=driving&key=${apiKey}`

    // 2 attempts total (1 retry)
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 2500) // 2.5s timeout

            const res = await fetch(url, { signal: controller.signal })
            clearTimeout(timeoutId)

            if (!res.ok) continue

            const data = await res.json()
            if (
                data.status === 'OK' &&
                data.rows?.[0]?.elements?.[0]?.status === 'OK'
            ) {
                const element = data.rows[0].elements[0]
                const distanceKm = Math.round((element.distance.value / 1000) * 10) / 10
                const durationMin = Math.round(element.duration.value / 60)
                return { distanceKm, durationMin, source: 'google' }
            }
        } catch (err) {
            // If aborted or fetch failed, retry once if attempt === 1
            if (attempt === 2) {
                console.warn('[DistanceMatrix] API attempt 2 failed, silently falling back:', err)
            }
        }
    }
    return null
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { origin, destination } = body

        if (
            !origin?.lat ||
            !origin?.lng ||
            !destination?.lat ||
            !destination?.lng
        ) {
            return NextResponse.json(
                { error: 'Origin and destination coordinates are required' },
                { status: 400 }
            )
        }

        const originLat = Number(origin.lat)
        const originLng = Number(origin.lng)
        const destLat = Number(destination.lat)
        const destLng = Number(destination.lng)

        // 1. Check cache
        const cacheKey = getCacheKey(originLat, originLng, destLat, destLng)
        const now = Date.now()
        const cached = cache.get(cacheKey)
        if (cached && cached.expiresAt > now) {
            return NextResponse.json({ success: true, ...cached.result, cached: true })
        }

        // 2. Try Google Maps API if key exists
        const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        let result: DistanceResult | null = null

        if (apiKey && apiKey !== 'your_google_maps_api_key_here') {
            result = await fetchGoogleDistance(apiKey, originLat, originLng, destLat, destLng)
        }

        // 3. Fallback if no API key or Google fetch failed
        if (!result) {
            result = calculateFallback(originLat, originLng, destLat, destLng)
        }

        // Store in cache
        cache.set(cacheKey, { result, expiresAt: now + CACHE_TTL_MS })

        return NextResponse.json({ success: true, ...result, cached: false })
    } catch (error) {
        console.error('[Distance API Error]', error)
        return NextResponse.json(
            { error: 'Failed to calculate delivery distance' },
            { status: 500 }
        )
    }
}
