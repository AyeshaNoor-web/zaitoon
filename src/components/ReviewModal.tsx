'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Check, Loader2 } from 'lucide-react'
import { submitReview } from '@/lib/api/reviews'

interface ReviewModalProps {
    isOpen: boolean
    onClose: () => void
    orderId: string
    orderNumber: string
}

const LABELS = ['', 'Not great', 'Could be better', 'Good', 'Really good', 'Outstanding']

export default function ReviewModal({ isOpen, onClose, orderId, orderNumber }: ReviewModalProps) {
    const [rating, setRating] = useState(0)
    const [hovered, setHovered] = useState(0)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const close = () => {
        onClose()
        setRating(0); setHovered(0); setComment(''); setSuccess(false); setError('')
    }

    useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [isOpen, onClose])

    const handleSubmit = async () => {
        if (rating === 0) { setError('Choose a star rating first.'); return }
        setSubmitting(true)
        setError('')
        try {
            await submitReview({ orderId, rating, comment })
            setSuccess(true)
            setTimeout(close, 2000)
        } catch (e) {
            setError((e as Error).message || 'Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const shown = hovered || rating

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={close}
                        className="absolute inset-0 bg-olive-950/55 backdrop-blur-sm"
                    />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="review-title"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                        className="relative w-full overflow-hidden rounded-t-[28px] bg-paper p-7 shadow-[var(--shadow-float)] sm:max-w-[420px] sm:rounded-[28px]"
                    >
                        {!success && (
                            <button
                                onClick={close}
                                aria-label="Close"
                                className="absolute end-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink hover:border-line-strong"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}

                        {success ? (
                            <div className="flex flex-col items-center py-6 text-center">
                                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-olive-700 text-white">
                                    <Check className="h-8 w-8" strokeWidth={2.5} />
                                </span>
                                <h2 id="review-title" className="mt-5 text-2xl">Thanks for the review</h2>
                                <p className="mt-1.5 text-ink-2">The kitchen reads every one.</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-ink-2">Order #{orderNumber}</p>
                                <h2 id="review-title" className="mt-1 text-[1.75rem]">How was your meal?</h2>

                                <div role="radiogroup" aria-label="Rating" className="mt-6 flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            role="radio"
                                            aria-checked={rating === s}
                                            aria-label={`${s} star${s === 1 ? '' : 's'}`}
                                            onClick={() => { setRating(s); setError('') }}
                                            onMouseEnter={() => setHovered(s)}
                                            onMouseLeave={() => setHovered(0)}
                                            className="rounded-lg p-1 transition-transform hover:scale-110 active:scale-95"
                                        >
                                            <Star className={`h-9 w-9 transition-colors ${shown >= s ? 'fill-saffron text-saffron' : 'text-line-strong'}`} strokeWidth={1.5} />
                                        </button>
                                    ))}
                                    <span className="ms-2 text-sm font-medium text-ink-2">{LABELS[shown]}</span>
                                </div>

                                <div className="relative mt-5">
                                    <label htmlFor="review-comment" className="sr-only">Comment</label>
                                    <textarea
                                        id="review-comment"
                                        rows={3}
                                        maxLength={300}
                                        placeholder="What did you order? What stood out? (optional)"
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        className="field resize-none pb-7"
                                    />
                                    <span className="tabular absolute bottom-2.5 end-3 text-xs text-ink-3">{comment.length}/300</span>
                                </div>

                                {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}

                                <button onClick={handleSubmit} disabled={submitting} className="btn-primary mt-5 w-full">
                                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : 'Submit review'}
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
