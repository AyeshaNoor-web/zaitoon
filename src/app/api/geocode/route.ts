import { NextRequest, NextResponse } from 'next/server'

// Server-side proxy for address lookups. Google's Geocoding/Places web services
// don't allow browser (CORS) calls, so the client must go through here.
// Falls back to OpenStreetMap Nominatim when no Google key is configured.

interface Suggestion { display_name: string; place_id?: string; lat?: string; lon?: string }

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const hasGoogle = !!GOOGLE_KEY && GOOGLE_KEY !== 'your_google_maps_api_key_here'
const NOMINATIM_HEADERS = { 'Accept-Language': 'en', 'User-Agent': 'zaitoon.pk (order location lookup)' }

async function fetchJson(url: string, init?: RequestInit) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 4000)
    try {
        const res = await fetch(url, { ...init, signal: ctrl.signal })
        return res.ok ? await res.json() : null
    } catch {
        return null
    } finally {
        clearTimeout(timer)
    }
}

async function reverse(lat: number, lng: number): Promise<string> {
    if (hasGoogle) {
        const data = await fetchJson(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}`)
        if (data?.status === 'OK' && Array.isArray(data.results)) {
            const precise = data.results.find((r: { types: string[] }) =>
                !r.types.includes('plus_code') &&
                ['street_address', 'premise', 'subpremise', 'route', 'neighborhood', 'sublocality', 'establishment'].some(t => r.types.includes(t))
            ) ?? data.results[0]
            if (precise?.formatted_address) return precise.formatted_address
        }
    }
    const osm = await fetchJson(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: NOMINATIM_HEADERS })
    return osm?.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

async function autocomplete(q: string): Promise<Suggestion[]> {
    if (hasGoogle) {
        const data = await fetchJson(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&components=country:pk&key=${GOOGLE_KEY}`)
        if (data?.status === 'OK' && Array.isArray(data.predictions)) {
            return data.predictions.map((p: { description: string; place_id: string }) => ({ display_name: p.description, place_id: p.place_id }))
        }
    }
    const osm = await fetchJson(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=pk`,
        { headers: NOMINATIM_HEADERS }
    )
    return Array.isArray(osm)
        ? osm.map((r: { display_name: string; lat: string; lon: string }) => ({ display_name: r.display_name, lat: r.lat, lon: r.lon }))
        : []
}

async function details(placeId: string): Promise<{ lat: number; lng: number } | null> {
    if (!hasGoogle) return null
    const data = await fetchJson(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry&key=${GOOGLE_KEY}`)
    const loc = data?.status === 'OK' ? data.result?.geometry?.location : null
    return loc ? { lat: loc.lat, lng: loc.lng } : null
}

export async function GET(req: NextRequest) {
    const p = req.nextUrl.searchParams
    const type = p.get('type')

    if (type === 'reverse') {
        const lat = Number(p.get('lat')), lng = Number(p.get('lng'))
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
        return NextResponse.json({ address: await reverse(lat, lng) })
    }
    if (type === 'autocomplete') {
        const q = (p.get('q') ?? '').trim().slice(0, 200)
        if (q.length < 3) return NextResponse.json({ suggestions: [] })
        return NextResponse.json({ suggestions: await autocomplete(q) })
    }
    if (type === 'details') {
        const id = p.get('place_id')
        if (!id) return NextResponse.json({ error: 'place_id required' }, { status: 400 })
        return NextResponse.json({ location: await details(id) })
    }
    return NextResponse.json({ error: 'Unknown lookup type' }, { status: 400 })
}
