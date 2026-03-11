'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Navigation, X, Pencil, CheckCircle2, AlertTriangle } from 'lucide-react'
import { getBranches } from '@/lib/api/branches'
import { haversineDistance, calculateDeliveryFee, MAX_DELIVERY_KM } from '@/lib/distance'
import { useLocationStore } from '@/store/useLocationStore'

const LeafletCheckoutMap = dynamic(
    () => import('@/components/map/LeafletCheckoutMap'),
    { ssr: false }
)

// ── Reverse geocode with Nominatim (no API key) ────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    } catch {
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
}

interface Props {
    /** When true the modal cannot be dismissed until a location is set */
    forceOpen?: boolean
    /** Called when modal is dismissed / location confirmed */
    onClose?: () => void
    /** Whether to allow closing by clicking outside */
    allowBackdropClose?: boolean
}

export default function LocationModal({ forceOpen = false, onClose, allowBackdropClose = true }: Props) {
    const [show, setShow] = useState(true)
    const [mode, setMode] = useState<'pick' | 'gps' | 'manual'>('pick')
    const [detecting, setDetecting] = useState(false)
    const [confirmed, setConfirmed] = useState<{
        branchName: string
        distanceKm: number
        deliveryFee: number | null
        address: string
    } | null>(null)
    const [error, setError] = useState('')

    // Manual entry state
    const [manualAddress, setManualAddress] = useState('')
    const [manualCoords, setManualCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [manualBranches, setManualBranches] = useState<any[]>([])
    const [manualFee, setManualFee] = useState<{ distanceKm: number; fee: number | null; outOfRange: boolean } | null>(null)
    const [confirming, setConfirming] = useState(false)

    const { locationSet, setLocation } = useLocationStore()

    // No need for internal auto-show logic anymore, parent controls mount

    const dismiss = useCallback(() => {
        if (forceOpen && !locationSet) return   // can't dismiss without setting location
        setShow(false)
        setMode('pick')
        setConfirmed(null)
        setError('')
        onClose?.()
    }, [forceOpen, locationSet, onClose])

    // ── Shared: process a lat/lng and save to store ────────────
    const processCoords = useCallback(async (lat: number, lng: number) => {
        const branches = await getBranches()
        if (!branches?.length) throw new Error('No branches found')

        let nearest = branches[0]
        let minDist = haversineDistance(lat, lng, branches[0].lat, branches[0].lng)
        branches.forEach(b => {
            const d = haversineDistance(lat, lng, b.lat, b.lng)
            if (d < minDist) { minDist = d; nearest = b }
        })

        const distKm = Math.round(minDist * 10) / 10
        const feeResult = calculateDeliveryFee(minDist)
        const oor = feeResult === -1 || minDist > MAX_DELIVERY_KM

        const address = await reverseGeocode(lat, lng)

        setLocation({
            coords: { lat, lng },
            nearestBranchId: nearest.id,
            nearestBranchName: nearest.name,
            deliveryAddress: address,
            distanceKm: distKm,
            deliveryFee: oor ? 0 : feeResult,
            outOfRange: oor,
        })

        return { nearest, distKm, fee: oor ? null : feeResult, address, oor }
    }, [setLocation])

    // ── GPS flow ───────────────────────────────────────────────
    const handleGPS = useCallback(async () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.')
            return
        }
        setMode('gps')
        setDetecting(true)
        setError('')
        try {
            const position = await new Promise<GeolocationPosition>((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej, {
                    enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
                })
            )
            const { latitude: lat, longitude: lng } = position.coords
            const result = await processCoords(lat, lng)
            setConfirmed({
                branchName: result.nearest.name,
                distanceKm: result.distKm,
                deliveryFee: result.fee,
                address: result.address,
            })
            setTimeout(() => dismiss(), 2400)
        } catch (err: any) {
            if (err?.code === 1) setError('Location access denied. Use "Enter Address Manually" instead.')
            else if (err?.code === 3) setError('Location timed out. Try again or enter address manually.')
            else setError('Could not detect location. Please enter address manually.')
            setMode('pick')
        } finally {
            setDetecting(false)
        }
    }, [processCoords, dismiss])

    // ── Load branches for manual map ───────────────────────────
    const startManual = useCallback(async () => {
        setMode('manual')
        setError('')
        const branches = await getBranches()
        setManualBranches(branches ?? [])
    }, [])

    // Recalc fee when pin moves in manual mode
    useEffect(() => {
        if (!manualCoords || manualBranches.length === 0) return
        let nearest = manualBranches[0]
        let minDist = haversineDistance(manualCoords.lat, manualCoords.lng, manualBranches[0].lat, manualBranches[0].lng)
        manualBranches.forEach(b => {
            const d = haversineDistance(manualCoords.lat, manualCoords.lng, b.lat, b.lng)
            if (d < minDist) { minDist = d; nearest = b }
        })
        const distKm = Math.round(minDist * 10) / 10
        const feeResult = calculateDeliveryFee(minDist)
        const oor = feeResult === -1 || minDist > MAX_DELIVERY_KM
        setManualFee({ distanceKm: distKm, fee: oor ? null : feeResult, outOfRange: oor })
    }, [manualCoords, manualBranches])

    const handleConfirmManual = useCallback(async () => {
        if (!manualAddress.trim()) { setError('Please enter your address.'); return }
        if (!manualCoords) { setError('Please pin your location on the map.'); return }
        setConfirming(true)
        setError('')
        try {
            // Use the typed address as the readable string, coords from map pin
            let nearest = manualBranches[0]
            let minDist = haversineDistance(manualCoords.lat, manualCoords.lng, manualBranches[0].lat, manualBranches[0].lng)
            manualBranches.forEach(b => {
                const d = haversineDistance(manualCoords.lat, manualCoords.lng, b.lat, b.lng)
                if (d < minDist) { minDist = d; nearest = b }
            })
            const distKm = Math.round(minDist * 10) / 10
            const feeResult = calculateDeliveryFee(minDist)
            const oor = feeResult === -1 || minDist > MAX_DELIVERY_KM

            setLocation({
                coords: manualCoords,
                nearestBranchId: nearest.id,
                nearestBranchName: nearest.name,
                deliveryAddress: manualAddress.trim(),
                distanceKm: distKm,
                deliveryFee: oor ? 0 : feeResult,
                outOfRange: oor,
            })

            setConfirmed({
                branchName: nearest.name,
                distanceKm: distKm,
                deliveryFee: oor ? null : feeResult,
                address: manualAddress.trim(),
            })
            setTimeout(() => dismiss(), 2400)
        } finally {
            setConfirming(false)
        }
    }, [manualAddress, manualCoords, manualBranches, setLocation, dismiss])

    const canDismiss = !forceOpen || locationSet

    return (
        <AnimatePresence>
            {show && (
                <>
                    {/* Backdrop — only clickable if user can dismiss */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                        onClick={allowBackdropClose ? dismiss : undefined}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 24 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className={`bg-[#FFFDF7] rounded-3xl shadow-2xl pointer-events-auto relative w-full ${mode === 'manual' ? 'max-w-lg' : 'max-w-sm'} max-h-[90vh] overflow-y-auto`}>

                            {/* Close button — only when dismissible */}
                            {canDismiss && (
                                <button
                                    onClick={dismiss}
                                    aria-label="Close location modal"
                                    className="absolute top-4 right-4 z-10 p-2 text-[#57534E] hover:text-[#18181B] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}

                            <div className="p-7">
                                {/* Icon */}
                                <div className="w-14 h-14 rounded-2xl bg-[#1B4332]/10 flex items-center justify-center mx-auto mb-4">
                                    <MapPin className="w-7 h-7 text-[#1B4332]" />
                                </div>

                                {/* ── SUCCESS STATE ──────────────────────────────────── */}
                                {confirmed ? (
                                    <div className="text-center space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-7 h-7 text-green-600" />
                                        </div>
                                        <h3 className="font-display text-xl font-bold text-[#18181B]">Location Set!</h3>
                                        <p className="text-[13px] text-[#57534E] leading-snug">
                                            ✅ {confirmed.address}
                                        </p>
                                        <p className="text-[13px] font-semibold text-[#1B4332]">
                                            Nearest branch: {confirmed.branchName} ({confirmed.distanceKm} km)
                                        </p>
                                        {confirmed.deliveryFee !== null ? (
                                            confirmed.deliveryFee === 0
                                                ? <p className="text-green-600 font-bold text-sm">🎉 Free delivery!</p>
                                                : <p className="text-[#C9920A] font-bold text-sm">Delivery fee: Rs. {confirmed.deliveryFee}</p>
                                        ) : (
                                            <div className="flex items-center gap-2 justify-center text-red-600">
                                                <AlertTriangle className="w-4 h-4" />
                                                <p className="text-sm font-bold">Outside delivery range ({confirmed.distanceKm} km). Please select Takeaway.</p>
                                            </div>
                                        )}
                                        <p className="text-[#57534E]/50 text-xs pt-1">Closing automatically…</p>
                                    </div>

                                ) : mode === 'gps' ? (
                                    /* ── GPS DETECTING ──────────────────────────────── */
                                    <div className="text-center space-y-4">
                                        <h2 className="font-display text-xl font-bold text-[#18181B]">Detecting Location…</h2>
                                        {detecting ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <svg className="animate-spin w-8 h-8 text-[#1B4332]" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                <p className="text-[#57534E] text-sm">Waiting for GPS signal…</p>
                                            </div>
                                        ) : error ? (
                                            <div className="space-y-3">
                                                <p role="alert" className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>
                                                <button onClick={() => { setMode('pick'); setError('') }} className="text-[#1B4332] font-semibold text-sm underline">← Back</button>
                                            </div>
                                        ) : null}
                                    </div>

                                ) : mode === 'manual' ? (
                                    /* ── MANUAL ENTRY ───────────────────────────────── */
                                    <div className="space-y-4">
                                        <h2 className="font-display text-xl font-bold text-[#18181B] text-center">Enter Your Address</h2>
                                        <p className="text-[#57534E] text-sm text-center">Type your address and pin your location on the map.</p>

                                        <div>
                                            <label htmlFor="loc-manual-addr" className="block text-[12px] font-[600] text-[#57534E] mb-1.5 uppercase tracking-wide">
                                                Delivery Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="loc-manual-addr"
                                                type="text"
                                                value={manualAddress}
                                                onChange={e => setManualAddress(e.target.value)}
                                                placeholder="e.g. E-88 Wapda Town, Lahore"
                                                className="w-full border-2 border-[#E7E5E0] rounded-xl px-4 py-3 text-[14px] text-[#18181B] focus:outline-none focus:border-[#1B4332] transition-all"
                                            />
                                        </div>

                                        <div>
                                            <p className="text-[12px] font-[600] text-[#57534E] mb-1.5 uppercase tracking-wide">
                                                Pin Location on Map <span className="text-red-500">*</span>
                                            </p>
                                            <div className="h-[220px] rounded-xl overflow-hidden border-2 border-[#E7E5E0] relative">
                                                <LeafletCheckoutMap
                                                    customerCoords={manualCoords}
                                                    branches={manualBranches}
                                                    onCustomerMove={(lat, lng) => setManualCoords({ lat, lng })}
                                                />
                                                {!manualCoords && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[200]">
                                                        <div className="bg-white/90 rounded-lg px-3 py-2 text-[12px] font-semibold text-[#57534E] shadow">
                                                            Click on the map to drop your pin
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {manualFee && (
                                                <p className={`mt-2 text-[12px] font-semibold ${manualFee.outOfRange ? 'text-red-600' : 'text-[#1B4332]'}`}>
                                                    {manualFee.outOfRange
                                                        ? `⚠ Outside delivery range (${manualFee.distanceKm} km). Takeaway only.`
                                                        : `📍 ${manualFee.distanceKm} km · Delivery fee: ${manualFee.fee === 0 ? 'Free' : `Rs. ${manualFee.fee}`}`}
                                                </p>
                                            )}
                                        </div>

                                        {error && (
                                            <p role="alert" className="text-red-600 text-xs bg-red-50 rounded-xl p-3">{error}</p>
                                        )}

                                        <div className="flex gap-3 pt-1">
                                            <button
                                                onClick={() => { setMode('pick'); setError('') }}
                                                className="flex-1 py-3 border-2 border-[#E7E5E0] rounded-2xl text-[14px] font-semibold text-[#57534E] hover:border-[#1B4332] transition-colors"
                                            >
                                                ← Back
                                            </button>
                                            <button
                                                onClick={handleConfirmManual}
                                                disabled={confirming || !manualAddress.trim() || !manualCoords}
                                                className="flex-1 py-3 bg-[#1B4332] text-white rounded-2xl text-[14px] font-bold hover:bg-[#155027] disabled:opacity-40 transition-colors"
                                            >
                                                {confirming ? 'Saving…' : 'Confirm Location'}
                                            </button>
                                        </div>
                                    </div>

                                ) : (
                                    /* ── PICK MODE (initial) ─────────────────────────── */
                                    <div className="space-y-4">
                                        <h2 className="font-display text-2xl font-bold text-[#18181B] text-center mb-1">
                                            Set Your Location
                                        </h2>
                                        <p className="text-[#57534E] text-sm text-center leading-relaxed">
                                            We need your location to find the nearest branch and calculate your delivery fee.
                                        </p>

                                        {!canDismiss && (
                                            <p className="text-[12px] text-center text-amber-700 bg-amber-50 rounded-xl px-3 py-2 font-medium">
                                                📍 Location is required to proceed with delivery.
                                            </p>
                                        )}

                                        {error && (
                                            <p role="alert" className="text-red-600 text-xs text-center bg-red-50 rounded-xl p-3">{error}</p>
                                        )}

                                        <button
                                            onClick={handleGPS}
                                            disabled={detecting}
                                            className="w-full bg-[#1B4332] hover:bg-[#155027] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                                        >
                                            <Navigation className="w-4 h-4" />
                                            Use My Location (GPS)
                                        </button>

                                        <button
                                            onClick={startManual}
                                            className="w-full py-4 border-2 border-[#1B4332] text-[#1B4332] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#1B4332]/5 transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Enter Address Manually
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
