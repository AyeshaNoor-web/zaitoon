'use client'
import { useEffect, useRef } from 'react'

interface MarkerConfig { lat: number; lng: number; label?: string }
interface Props {
    center: [number, number]
    zoom?: number
    markers?: MarkerConfig[]
    height?: string
    interactive?: boolean
}

export default function LeafletMap({ center, zoom = 14, markers = [], height = '200px', interactive = true }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<unknown>(null)

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return
        let mounted = true

        import('leaflet').then(({ default: L }) => {
            if (!mounted || !containerRef.current || mapRef.current) return
            // Fix default icon paths broken by Webpack/Turbopack
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            })
            const map = L.map(containerRef.current!, {
                center, zoom,
                scrollWheelZoom: false,
                dragging: interactive,
                zoomControl: interactive,
                attributionControl: false,
            })
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
            markers.forEach(m => L.marker([m.lat, m.lng]).addTo(map).bindPopup(m.label ?? ''))
            mapRef.current = map
        })

        return () => {
            mounted = false
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (mapRef.current) { (mapRef.current as any).remove(); mapRef.current = null }
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return <div ref={containerRef} style={{ height, width: '100%', zIndex: 0, borderRadius: '0.5rem', overflow: 'hidden' }} />
}
