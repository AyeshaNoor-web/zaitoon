/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useRef } from 'react'

interface Props { lat: number; lng: number; name: string }

export default function LeafletMiniMap({ lat, lng, name }: Props) {
    const mapRef = useRef<HTMLDivElement>(null)
    const instanceRef = useRef<any>(null)

    useEffect(() => {
        if (!mapRef.current) return

        // Track whether this effect invocation is still alive
        let cancelled = false

        import('leaflet').then(L => {
            // If the component unmounted while the import was in-flight, bail out
            if (cancelled || !mapRef.current) return

            // If a map was already created on this DOM node, remove it first
            if (instanceRef.current) {
                instanceRef.current.remove()
                instanceRef.current = null
            }

            const icon = L.divIcon({
                html: `<div style="width:22px;height:22px;background:#2DBF60;border:3px solid #050A07;border-radius:50%;box-shadow:0 2px 10px rgba(45,191,96,0.5)"></div>`,
                iconSize: [22, 22], iconAnchor: [11, 11], className: '',
            })

            const map = L.map(mapRef.current!, {
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                attributionControl: false,
            })

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
            map.setView([lat, lng], 15)
            L.marker([lat, lng], { icon }).bindPopup(name).addTo(map)

            instanceRef.current = map
        })

        return () => {
            cancelled = true
            if (instanceRef.current) {
                instanceRef.current.remove()
                instanceRef.current = null
            }
        }
    }, [lat, lng, name])

    return <div ref={mapRef} className="w-full h-full" />
}
