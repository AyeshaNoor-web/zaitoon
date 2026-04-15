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
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] backdrop-blur-sm"
                        style={{ background: 'rgba(10,15,8,0.65)' }}
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
                        <div className={`pointer-events-auto relative w-full ${mode === 'manual' ? 'max-w-lg' : 'max-w-sm'} max-h-[90vh] overflow-y-auto rounded-[20px]`}
                            style={{
                                background: 'var(--cream)',
                                border: '1.5px solid var(--linen)',
                                boxShadow: '0 24px 80px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.15)'
                            }}
                        >

                            {/* Close button — only when dismissible */}
                            {canDismiss && (
                                <button
                                    onClick={dismiss}
                                    aria-label="Close location modal"
                                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all"
                                    style={{ background: 'var(--linen)', color: 'var(--stone)' }}
                                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--charcoal)'; el.style.color = 'white' }}
                                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--linen)'; el.style.color = 'var(--stone)' }}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}

                            <div className="p-7">
                                {/* Icon */}
                                <div className="w-14 h-14 rounded-[14px] flex items-center justify-center mx-auto mb-5"
                                    style={{ background: 'rgba(138,154,91,0.12)', border: '1.5px solid rgba(138,154,91,0.2)' }}>
                                    <MapPin className="w-7 h-7" style={{ color: 'var(--olive-base)' }} />
                                </div>

                                {/* ── SUCCESS STATE ──────────────────────────────────── */}
                                {confirmed ? (
                                    <div className="text-center space-y-4">
                                        <motion.div
                                            initial={{ scale: 0.6, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: 'spring', damping: 14, stiffness: 260 }}
                                            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                                            style={{ background: 'rgba(22,163,74,0.1)', border: '2px solid rgba(22,163,74,0.25)' }}
                                        >
                                            <CheckCircle2 className="w-7 h-7" style={{ color: '#16A34A' }} />
                                        </motion.div>
                                        <h3 className="font-display text-[20px] font-[700]" style={{ color: 'var(--charcoal)' }}>Location Set! 📍</h3>
                                        <p className="text-[13px] leading-snug" style={{ color: 'var(--stone)' }}>
                                            {confirmed.address}
                                        </p>
                                        <p className="text-[13px] font-[600]" style={{ color: 'var(--olive-dark)' }}>
                                            Nearest branch: <strong>{confirmed.branchName}</strong> ({confirmed.distanceKm} km)
                                        </p>
                                        {confirmed.deliveryFee !== null ? (
                                            confirmed.deliveryFee === 0
                                                ? <p className="text-[13px] font-[700]" style={{ color: '#16A34A' }}>🎉 Free delivery!</p>
                                                : <p className="text-[13px] font-[700]" style={{ color: 'var(--amber-warm)' }}>Delivery fee: Rs. {confirmed.deliveryFee}</p>
                                        ) : (
                                            <div className="flex items-center gap-2 justify-center text-[13px] font-[700]" style={{ color: '#DC2626' }}>
                                                <AlertTriangle className="w-4 h-4" />
                                                <span>Outside delivery range ({confirmed.distanceKm} km). Takeaway only.</span>
                                            </div>
                                        )}
                                        <p className="text-[11px] pt-1" style={{ color: 'var(--stone)', opacity: 0.5 }}>Closing automatically…</p>
                                    </div>

                                ) : mode === 'gps' ? (
                                    /* ── GPS DETECTING ── */
                                    <div className="text-center space-y-4">
                                        <h2 className="font-display text-[20px] font-[700]" style={{ color: 'var(--charcoal)' }}>Detecting Location…</h2>
                                        {detecting ? (
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 rounded-full border-[3px] border-t-transparent animate-spin"
                                                    style={{ borderColor: 'var(--olive-base)', borderTopColor: 'transparent' }} />
                                                <p className="text-[14px]" style={{ color: 'var(--stone)' }}>Waiting for GPS signal…</p>
                                            </div>
                                        ) : error ? (
                                            <div className="space-y-3">
                                                <p role="alert" className="text-[13px] rounded-[10px] p-3" style={{ color: '#DC2626', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>{error}</p>
                                                <button onClick={() => { setMode('pick'); setError('') }}
                                                    className="text-[13px] font-[600] transition-colors"
                                                    style={{ color: 'var(--olive-base)' }}>← Back</button>
                                            </div>
                                        ) : null}
                                    </div>

                                ) : mode === 'manual' ? (
                                    /* ── MANUAL ENTRY ── */
                                    <div className="space-y-4">
                                        <h2 className="font-display text-[20px] font-[700] text-center" style={{ color: 'var(--charcoal)' }}>Enter Your Address</h2>
                                        <p className="text-[13px] text-center" style={{ color: 'var(--stone)' }}>Type your address and pin your location on the map.</p>

                                        <div>
                                            <label htmlFor="loc-manual-addr" className="block text-[11px] font-[700] uppercase tracking-wider mb-1.5"
                                                style={{ color: 'var(--stone)' }}>
                                                Delivery Address <span style={{ color: '#DC2626' }}>*</span>
                                            </label>
                                            <input
                                                id="loc-manual-addr"
                                                type="text"
                                                value={manualAddress}
                                                onChange={e => setManualAddress(e.target.value)}
                                                placeholder="e.g. E-88 Wapda Town, Lahore"
                                                className="w-full rounded-[10px] px-4 py-3 text-[14px] transition-all"
                                                style={{
                                                    background: 'var(--parchment)',
                                                    border: '2px solid var(--linen)',
                                                    color: 'var(--charcoal)',
                                                    outline: 'none'
                                                }}
                                                onFocus={e => { e.currentTarget.style.borderColor = 'var(--olive-base)' }}
                                                onBlur={e => { e.currentTarget.style.borderColor = 'var(--linen)' }}
                                            />
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-[700] uppercase tracking-wider mb-1.5" style={{ color: 'var(--stone)' }}>
                                                Pin Location on Map <span style={{ color: '#DC2626' }}>*</span>
                                            </p>
                                            <div className="h-[220px] rounded-[12px] overflow-hidden relative"
                                                style={{ border: '2px solid var(--linen)' }}>
                                                <LeafletCheckoutMap
                                                    customerCoords={manualCoords}
                                                    branches={manualBranches}
                                                    onCustomerMove={(lat, lng) => setManualCoords({ lat, lng })}
                                                />
                                                {!manualCoords && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[200]">
                                                        <div className="px-3 py-2 text-[12px] font-[600] rounded-[8px] shadow-lg"
                                                            style={{ background: 'rgba(252,248,240,0.95)', color: 'var(--stone)', backdropFilter: 'blur(8px)' }}>
                                                            Click on the map to drop your pin
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {manualFee && (
                                                <p className="mt-2 text-[12px] font-[600]" style={{ color: manualFee.outOfRange ? '#DC2626' : 'var(--olive-dark)' }}>
                                                    {manualFee.outOfRange
                                                        ? `⚠ Outside delivery range (${manualFee.distanceKm} km). Takeaway only.`
                                                        : `📍 ${manualFee.distanceKm} km · Fee: ${manualFee.fee === 0 ? 'Free' : `Rs. ${manualFee.fee}`}`}
                                                </p>
                                            )}
                                        </div>

                                        {error && (
                                            <p role="alert" className="text-[12px] rounded-[10px] p-3"
                                                style={{ color: '#DC2626', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
                                                {error}
                                            </p>
                                        )}

                                        <div className="flex gap-3 pt-1">
                                            <button
                                                onClick={() => { setMode('pick'); setError('') }}
                                                className="flex-1 py-3 rounded-[12px] text-[13px] font-[700] transition-all"
                                                style={{ background: 'transparent', border: '2px solid var(--linen)', color: 'var(--stone)' }}
                                                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--olive-base)'; el.style.color = 'var(--olive-base)' }}
                                                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--linen)'; el.style.color = 'var(--stone)' }}
                                            >
                                                ← Back
                                            </button>
                                            <button
                                                onClick={handleConfirmManual}
                                                disabled={confirming || !manualAddress.trim() || !manualCoords}
                                                className="flex-1 py-3 rounded-[12px] text-[13px] font-[700] text-white transition-all disabled:opacity-40"
                                                style={{
                                                    background: 'linear-gradient(135deg, var(--olive-darkest), var(--olive-dark))',
                                                    boxShadow: '0 4px 14px rgba(92,110,58,0.35)'
                                                }}
                                            >
                                                {confirming ? 'Saving…' : 'Confirm Location'}
                                            </button>
                                        </div>
                                    </div>

                                ) : (
                                    /* ── PICK MODE (initial) ── */
                                    <div className="space-y-4">
                                        <h2 className="font-display text-[24px] font-[700] text-center mb-1" style={{ color: 'var(--charcoal)' }}>
                                            Set Your Location
                                        </h2>
                                        <p className="text-[13px] text-center leading-relaxed" style={{ color: 'var(--stone)' }}>
                                            We need your location to find the nearest branch and calculate your delivery fee.
                                        </p>

                                        {!canDismiss && (
                                            <p className="text-[12px] text-center rounded-[10px] px-3 py-2.5 font-[600]"
                                                style={{ color: '#92400E', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)' }}>
                                                📍 Location is required to proceed with delivery.
                                            </p>
                                        )}

                                        {error && (
                                            <p role="alert" className="text-[12px] text-center rounded-[10px] p-3"
                                                style={{ color: '#DC2626', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
                                                {error}
                                            </p>
                                        )}

                                        <motion.button
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleGPS}
                                            disabled={detecting}
                                            className="w-full text-white py-4 rounded-[14px] font-[700] text-[14px] flex items-center justify-center gap-2.5 disabled:opacity-60 transition-all"
                                            style={{
                                                background: 'linear-gradient(135deg, var(--olive-darkest), var(--olive-dark))',
                                                boxShadow: '0 6px 20px rgba(92,110,58,0.35)'
                                            }}
                                        >
                                            <Navigation className="w-4 h-4" />
                                            Use My Location (GPS)
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ y: -1 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={startManual}
                                            className="w-full py-4 rounded-[14px] font-[700] text-[14px] flex items-center justify-center gap-2.5 transition-all"
                                            style={{
                                                background: 'transparent',
                                                border: '2px solid var(--olive-base)',
                                                color: 'var(--olive-base)'
                                            }}
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Enter Address Manually
                                        </motion.button>
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
