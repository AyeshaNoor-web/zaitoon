'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Navigation, X, Search, Loader2, CheckCircle2, AlertTriangle, ArrowLeft, PenLine } from 'lucide-react'
import { getBranches } from '@/lib/api/branches'
import { haversineDistance, calculateRealWorldDistance, getDeliveryFeeDetails, calculateEstimatedDeliveryTime, formatDistance } from '@/lib/distance'
import { getDeliverySettings } from '@/lib/api/settings'
import { formatPrice } from '@/lib/payment'
import { useLocationStore } from '@/store/useLocationStore'
import type { Branch } from '@/types'

const LeafletCheckoutMap = dynamic(() => import('@/components/map/LeafletCheckoutMap'), {
    ssr: false,
    loading: () => <div className="skeleton h-full w-full" />,
})

interface GeoSuggestion { display_name: string; lat?: string; lon?: string; place_id?: string }
type Coords = { lat: number; lng: number }

async function reverseGeocode({ lat, lng }: Coords): Promise<string> {
    try {
        const res = await fetch(`/api/geocode?type=reverse&lat=${lat}&lng=${lng}`)
        const data = await res.json()
        if (data.address) return data.address
    } catch { /* fall through */ }
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

async function searchAddress(q: string): Promise<GeoSuggestion[]> {
    try {
        const res = await fetch(`/api/geocode?type=autocomplete&q=${encodeURIComponent(q)}`)
        const data = await res.json()
        return data.suggestions ?? []
    } catch {
        return []
    }
}

async function resolveSuggestion(s: GeoSuggestion): Promise<Coords | null> {
    if (s.lat && s.lon) return { lat: parseFloat(s.lat), lng: parseFloat(s.lon) }
    if (!s.place_id) return null
    try {
        const res = await fetch(`/api/geocode?type=details&place_id=${encodeURIComponent(s.place_id)}`)
        const data = await res.json()
        return data.location ?? null
    } catch {
        return null
    }
}

function nearestBranch(c: Coords, branches: Branch[]): Branch {
    return branches.reduce((best, b) =>
        haversineDistance(c.lat, c.lng, b.lat, b.lng) < haversineDistance(c.lat, c.lng, best.lat, best.lng) ? b : best
    )
}

interface Quote {
    branch: Branch
    distanceKm: number
    fee: number | null
    outOfRange: boolean
    etaMin: number
    breakdown: string
}

async function quoteFor(c: Coords, branches: Branch[]): Promise<Quote> {
    const branch = nearestBranch(c, branches)
    const [config, route] = await Promise.all([
        getDeliverySettings(),
        calculateRealWorldDistance(c.lat, c.lng, branch.lat, branch.lng),
    ])
    const details = getDeliveryFeeDetails(route.distanceKm, config)
    return {
        branch,
        distanceKm: route.distanceKm,
        fee: details.outOfRange ? null : details.fee,
        outOfRange: details.outOfRange,
        etaMin: calculateEstimatedDeliveryTime(route.distanceKm),
        breakdown: details.breakdownText,
    }
}

interface Props {
    /** When true the modal cannot be dismissed until a location is set */
    forceOpen?: boolean
    /** Called when the modal is dismissed or a location confirmed */
    onClose?: () => void
    /** Whether clicking the backdrop closes the modal */
    allowBackdropClose?: boolean
}

export default function LocationModal({ forceOpen = false, onClose, allowBackdropClose = true }: Props) {
    const { locationSet, setLocation } = useLocationStore()
    const [mode, setMode] = useState<'pick' | 'gps' | 'manual'>('pick')
    const [error, setError] = useState('')
    const [confirmed, setConfirmed] = useState<(Quote & { address: string }) | null>(null)

    const [branches, setBranches] = useState<Branch[]>([])
    const [manualAddress, setManualAddress] = useState('')
    const [manualCoords, setManualCoords] = useState<Coords | null>(null)
    const [manualQuote, setManualQuote] = useState<Quote | null>(null)
    const [busy, setBusy] = useState(false)

    const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([])
    const [searching, setSearching] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const canDismiss = !forceOpen || locationSet
    const dismiss = useCallback(() => {
        if (!canDismiss) return
        onClose?.()
    }, [canDismiss, onClose])

    useEffect(() => {
        getBranches().then(b => setBranches(b ?? [])).catch(() => {})
    }, [])

    useEffect(() => {
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
        document.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = prev
            document.removeEventListener('keydown', onKey)
        }
    }, [dismiss])

    const save = useCallback((coords: Coords, address: string, q: Quote) => {
        setLocation({
            coords,
            nearestBranchId: q.branch.id,
            nearestBranchName: q.branch.name,
            deliveryAddress: address,
            distanceKm: q.distanceKm,
            deliveryFee: q.fee ?? 0,
            outOfRange: q.outOfRange,
        })
        setConfirmed({ ...q, address })
    }, [setLocation])

    // ── GPS ──
    const handleGPS = async () => {
        if (!navigator.geolocation) { setError('Your browser does not support location detection.'); return }
        setMode('gps')
        setError('')
        try {
            const pos = await new Promise<GeolocationPosition>((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
            )
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            const list = branches.length ? branches : await getBranches()
            if (!list?.length) throw new Error('no-branches')
            const [q, address] = await Promise.all([quoteFor(coords, list), reverseGeocode(coords)])
            save(coords, address, q)
        } catch (err) {
            const code = (err as GeolocationPositionError)?.code
            setError(
                code === 1 ? 'Location access was denied. Enter your address instead.'
                    : code === 3 ? 'Finding your location took too long. Try again or enter your address.'
                        : "We couldn't detect your location. Enter your address instead."
            )
            setMode('pick')
        }
    }

    // ── Manual search ──
    const handleAddressChange = (value: string) => {
        setManualAddress(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (value.trim().length < 4) { setSuggestions([]); setShowSuggestions(false); return }
        debounceRef.current = setTimeout(async () => {
            setSearching(true)
            const results = await searchAddress(value)
            setSuggestions(results)
            setShowSuggestions(results.length > 0)
            setSearching(false)
        }, 450)
    }

    const handleSelectSuggestion = async (s: GeoSuggestion) => {
        setManualAddress(s.display_name)
        setSuggestions([])
        setShowSuggestions(false)
        const coords = await resolveSuggestion(s)
        if (coords) setManualCoords(coords)
        else setError("We couldn't pin that address. Tap the map to place your pin.")
    }

    const onPinMove = useCallback((lat: number, lng: number) => setManualCoords({ lat, lng }), [])

    // Live fee preview as the pin moves
    useEffect(() => {
        if (!manualCoords || branches.length === 0) return
        let active = true
        quoteFor(manualCoords, branches).then(q => { if (active) setManualQuote(q) }).catch(() => {})
        return () => { active = false }
    }, [manualCoords, branches])

    const handleConfirmManual = async () => {
        if (!manualAddress.trim()) { setError('Please enter your address.'); return }
        if (!manualCoords) { setError('Please drop a pin on the map.'); return }
        setBusy(true)
        setError('')
        try {
            const q = manualQuote ?? await quoteFor(manualCoords, branches)
            save(manualCoords, manualAddress.trim(), q)
        } catch {
            setError("We couldn't calculate delivery for that spot. Please try again.")
        } finally {
            setBusy(false)
        }
    }

    const back = () => { setMode('pick'); setError('') }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-olive-950/55 backdrop-blur-sm"
                    onClick={allowBackdropClose ? dismiss : undefined}
                    aria-hidden="true"
                />

                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="loc-title"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                    className={`relative max-h-[94dvh] w-full overflow-y-auto overscroll-contain rounded-t-[28px] bg-paper shadow-[var(--shadow-float)] sm:rounded-[28px] ${mode === 'manual' && !confirmed ? 'sm:max-w-[560px]' : 'sm:max-w-[440px]'}`}
                >
                    {canDismiss && (
                        <button
                            onClick={dismiss}
                            aria-label="Close"
                            className="absolute end-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink hover:border-line-strong"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    <div className="p-6 pt-8 sm:p-8">
                        {confirmed ? (
                            <div className="text-center">
                                <motion.span
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', damping: 14, stiffness: 260 }}
                                    className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${confirmed.outOfRange ? 'bg-danger/10 text-danger' : 'bg-olive-700 text-white'}`}
                                >
                                    {confirmed.outOfRange ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-7 w-7" />}
                                </motion.span>
                                <h2 id="loc-title" className="mt-5 text-[1.75rem]">
                                    {confirmed.outOfRange ? 'A little too far for delivery' : `We deliver to you`}
                                </h2>
                                <p className="mx-auto mt-2 line-clamp-2 max-w-xs text-sm text-ink-2">{confirmed.address}</p>

                                <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface text-start text-sm">
                                    <div className="flex justify-between px-4 py-3">
                                        <dt className="text-ink-2">Nearest branch</dt>
                                        <dd className="font-semibold">{confirmed.branch.name}</dd>
                                    </div>
                                    <div className="flex justify-between px-4 py-3">
                                        <dt className="text-ink-2">Distance</dt>
                                        <dd className="tabular font-semibold">{formatDistance(confirmed.distanceKm)}</dd>
                                    </div>
                                    {!confirmed.outOfRange && (
                                        <>
                                            <div className="flex justify-between px-4 py-3">
                                                <dt className="text-ink-2">Delivery fee</dt>
                                                <dd className="tabular font-semibold">{confirmed.fee === 0 ? 'Free' : formatPrice(confirmed.fee ?? 0)}</dd>
                                            </div>
                                            <div className="flex justify-between px-4 py-3">
                                                <dt className="text-ink-2">Estimated time</dt>
                                                <dd className="tabular font-semibold">~{confirmed.etaMin} min</dd>
                                            </div>
                                        </>
                                    )}
                                </dl>
                                {confirmed.outOfRange && (
                                    <p className="mt-4 text-sm text-ink-2">You can still order for takeaway or dine-in at {confirmed.branch.name}.</p>
                                )}

                                <button onClick={() => onClose?.()} className="btn-primary mt-6 w-full">
                                    Continue
                                </button>
                                <button onClick={() => { setConfirmed(null); setMode('manual') }} className="btn-quiet mt-2 w-full">
                                    Use a different address
                                </button>
                            </div>
                        ) : mode === 'gps' ? (
                            <div className="py-6 text-center" role="status">
                                <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-olive-100">
                                    <span className="absolute inset-0 animate-ping rounded-full bg-olive-300/50" />
                                    <Navigation className="relative h-6 w-6 text-olive-700" />
                                </span>
                                <h2 id="loc-title" className="mt-6 text-2xl">Finding you…</h2>
                                <p className="mt-2 text-sm text-ink-2">Allow location access in your browser if it asks.</p>
                            </div>
                        ) : mode === 'manual' ? (
                            <div className="space-y-5">
                                <button onClick={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink">
                                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> Back
                                </button>
                                <div>
                                    <h2 id="loc-title" className="text-[1.75rem]">Enter your address</h2>
                                    <p className="mt-1 text-sm text-ink-2">Search for your area, then fine-tune the pin on the map.</p>
                                </div>

                                <div className="relative">
                                    <label htmlFor="loc-manual-addr" className="sr-only">Delivery address</label>
                                    <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                                    <input
                                        id="loc-manual-addr"
                                        type="text"
                                        value={manualAddress}
                                        onChange={e => handleAddressChange(e.target.value)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                        placeholder="e.g. E-88 Wapda Town, Lahore"
                                        autoComplete="off"
                                        role="combobox"
                                        aria-expanded={showSuggestions}
                                        aria-controls="loc-suggestions"
                                        className="field ps-11 pe-11"
                                    />
                                    {searching && <Loader2 className="absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-3" />}

                                    {showSuggestions && (
                                        <ul id="loc-suggestions" role="listbox" className="absolute inset-x-0 top-[calc(100%+6px)] z-[300] overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-lift)]">
                                            {suggestions.map((s, i) => (
                                                <li key={`${s.place_id ?? s.display_name}-${i}`} role="option" aria-selected="false">
                                                    <button
                                                        type="button"
                                                        onMouseDown={e => { e.preventDefault(); handleSelectSuggestion(s) }}
                                                        className="flex w-full items-start gap-3 px-4 py-3 text-start text-sm hover:bg-paper"
                                                    >
                                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-olive-600" />
                                                        <span className="line-clamp-2 text-ink">{s.display_name}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div>
                                    <div className="relative h-[240px] overflow-hidden rounded-2xl border border-line">
                                        <LeafletCheckoutMap customerCoords={manualCoords} branches={branches} onCustomerMove={onPinMove} />
                                        {!manualCoords && (
                                            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[500] flex justify-center">
                                                <span className="rounded-full bg-ink/85 px-3.5 py-1.5 text-xs font-medium text-paper backdrop-blur">Tap the map to drop your pin</span>
                                            </div>
                                        )}
                                    </div>
                                    {manualQuote && (
                                        <p className={`mt-2.5 text-sm font-medium ${manualQuote.outOfRange ? 'text-danger' : 'text-olive-700'}`}>
                                            {manualQuote.outOfRange
                                                ? `Outside our delivery range (${formatDistance(manualQuote.distanceKm)}). Takeaway only.`
                                                : `${formatDistance(manualQuote.distanceKm)} from ${manualQuote.branch.name} · Delivery ${manualQuote.fee === 0 ? 'free' : formatPrice(manualQuote.fee ?? 0)}`}
                                        </p>
                                    )}
                                </div>

                                {error && <p role="alert" className="rounded-xl bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>}

                                <button
                                    onClick={handleConfirmManual}
                                    disabled={busy || !manualAddress.trim() || !manualCoords}
                                    className="btn-primary w-full"
                                >
                                    {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Confirm location'}
                                </button>
                            </div>
                        ) : (
                            <div>
                                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-olive-700 text-white">
                                    <MapPin className="h-6 w-6" />
                                </span>
                                <h2 id="loc-title" className="mt-6 text-[2rem] leading-tight">Where should we deliver?</h2>
                                <p className="mt-2 text-ink-2">We&apos;ll find your nearest branch and show the delivery fee before you order.</p>

                                {!canDismiss && (
                                    <p className="mt-4 rounded-xl bg-saffron/15 px-4 py-2.5 text-sm font-medium text-[#7A4F06]">
                                        A delivery location is needed to continue.
                                    </p>
                                )}
                                {error && <p role="alert" className="mt-4 rounded-xl bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>}

                                <div className="mt-7 space-y-2.5">
                                    <button onClick={handleGPS} className="btn-primary h-14 w-full text-base">
                                        <Navigation className="h-4 w-4" /> Use my current location
                                    </button>
                                    <button onClick={() => { setMode('manual'); setError('') }} className="btn-outline-dark h-14 w-full text-base">
                                        <PenLine className="h-4 w-4" /> Enter address manually
                                    </button>
                                    {canDismiss && (
                                        <button onClick={dismiss} className="btn-quiet w-full">
                                            Just browsing
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
