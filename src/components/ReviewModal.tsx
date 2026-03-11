'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star } from 'lucide-react'
import { submitReview } from '@/lib/api/reviews'

interface ReviewModalProps {
    isOpen: boolean
    onClose: () => void
    orderId: string
    customerId: string
    orderNumber: string
}

export default function ReviewModal({
    isOpen,
    onClose,
    orderId,
    customerId,
    orderNumber,
}: ReviewModalProps) {
    const [rating, setRating] = useState(0)
    const [hovered, setHovered] = useState(0)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        if (rating === 0) { setError('Please select a star rating.'); return }
        setSubmitting(true)
        setError('')
        try {
            await submitReview({ customerId, orderId, rating, comment })
            setSuccess(true)
            setTimeout(() => { onClose(); resetState() }, 2200)
        } catch (e: any) {
            setError(e.message ?? 'Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const resetState = () => {
        setRating(0); setHovered(0); setComment('')
        setSuccess(false); setError('')
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { onClose(); resetState() }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 20 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                        className="relative w-full max-w-sm bg-[#FFFDF9] rounded-3xl p-7 shadow-2xl z-10 overflow-hidden"
                    >
                        {/* Close */}
                        {!success && (
                            <button
                                onClick={() => { onClose(); resetState() }}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--linen)] text-[var(--stone)] transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}

                        <AnimatePresence mode="wait">
                            {success ? (
                                /* ── Success state ── */
                                <motion.div
                                    key="success"
                                    initial={{ scale: 0.7, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center text-center py-6 gap-4"
                                >
                                    <div className="text-6xl">🌟</div>
                                    <h2 className="font-display text-[26px] font-bold text-[var(--charcoal)]">
                                        Thanks for the review!
                                    </h2>
                                    <p className="text-[var(--stone)] text-[15px] leading-snug">
                                        <span className="font-bold text-[var(--olive-base)]">20 points</span> have been added to your loyalty account.
                                    </p>
                                    <div className="flex gap-1 mt-1">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star
                                                key={s}
                                                className="w-6 h-6"
                                                fill={s <= rating ? '#C9920A' : 'none'}
                                                stroke={s <= rating ? '#C9920A' : '#C9920A'}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                /* ── Form state ── */
                                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {/* Header */}
                                    <div className="text-center mb-5">
                                        <p className="text-[12px] font-[600] text-[var(--stone)] uppercase tracking-[0.08em] mb-1">
                                            Order #{orderNumber}
                                        </p>
                                        <h2 className="font-display text-[24px] font-bold text-[var(--charcoal)] leading-tight">
                                            How was your meal?
                                        </h2>
                                        <p className="text-[var(--stone)] text-[13px] mt-1">
                                            Leave a review — earn <span className="font-bold text-[var(--olive-base)]">20 pts</span> ⭐
                                        </p>
                                    </div>

                                    {/* Stars */}
                                    <div
                                        className="flex items-center justify-center gap-2 mb-5"
                                        role="radiogroup"
                                        aria-label="Rating"
                                    >
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                role="radio"
                                                aria-checked={rating === s}
                                                aria-label={`${s} star${s !== 1 ? 's' : ''}`}
                                                onClick={() => { setRating(s); setError('') }}
                                                onMouseEnter={() => setHovered(s)}
                                                onMouseLeave={() => setHovered(0)}
                                                className="transition-transform hover:scale-110 active:scale-95"
                                            >
                                                <Star
                                                    className="w-9 h-9 transition-colors"
                                                    fill={(hovered || rating) >= s ? '#C9920A' : 'none'}
                                                    stroke="#C9920A"
                                                    strokeWidth={1.5}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Comment */}
                                    <div className="relative mb-4">
                                        <textarea
                                            rows={3}
                                            maxLength={300}
                                            placeholder="Tell us about your experience (optional)…"
                                            value={comment}
                                            onChange={e => setComment(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border-[2px] border-[var(--linen)] rounded-2xl text-[14px] text-[var(--charcoal)] placeholder:text-[var(--stone)] focus:outline-none focus:border-[var(--olive-base)] transition-colors resize-none"
                                        />
                                        <span className="absolute bottom-3 right-3 text-[11px] text-[var(--stone)]">
                                            {comment.length}/300
                                        </span>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <p className="text-red-500 text-[13px] text-center mb-3 font-[500]">
                                            {error}
                                        </p>
                                    )}

                                    {/* Submit */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="w-full py-4 rounded-2xl bg-[var(--amber-warm)] text-[var(--olive-darkest)] font-bold text-[15px] hover:bg-[var(--amber-bright)] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <span className="w-5 h-5 border-2 border-[var(--olive-darkest)]/30 border-t-[var(--olive-darkest)] rounded-full animate-spin" />
                                        ) : (
                                            <>⭐ Submit Review</>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
