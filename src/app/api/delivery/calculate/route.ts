import { NextResponse } from 'next/server'
import { getRouteDistance } from '@/lib/server/routeDistance'

export async function POST(req: Request) {
    try {
        const { origin, destination } = await req.json()
        const nums = [origin?.lat, origin?.lng, destination?.lat, destination?.lng].map(Number)
        if (nums.some(n => !Number.isFinite(n))) {
            return NextResponse.json({ error: 'Origin and destination coordinates are required' }, { status: 400 })
        }
        const [oLat, oLng, dLat, dLng] = nums
        const result = await getRouteDistance(oLat, oLng, dLat, dLng)
        return NextResponse.json({ success: true, ...result })
    } catch (error) {
        console.error('[Distance API Error]', error)
        return NextResponse.json({ error: 'Failed to calculate delivery distance' }, { status: 500 })
    }
}
