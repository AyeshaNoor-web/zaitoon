'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import type { AdminReview } from '@/lib/api/reviews'

export default function ReviewsWall({ reviews }: { reviews: AdminReview[] }) {
    const withText = (reviews ?? []).filter(r => r.comment?.trim())
    if (withText.length === 0) return null

    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

    return (
        <section aria-labelledby="reviews-title" className="border-y border-line bg-paper-2/60 py-20 lg:py-28">
            <div className="container-page">
                <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <span className="section-label">From our guests</span>
                        <h2 id="reviews-title">Lahore keeps coming back.</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-display text-5xl font-medium tabular">{avg.toFixed(1)}</span>
                        <div>
                            <div className="flex gap-0.5" aria-hidden="true">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} className={`h-4 w-4 ${i <= Math.round(avg) ? 'fill-saffron text-saffron' : 'text-line-strong'}`} />
                                ))}
                            </div>
                            <p className="mt-1 text-sm text-ink-2">from {reviews.length} verified order{reviews.length === 1 ? '' : 's'}</p>
                        </div>
                    </div>
                </div>

                <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3">
                    {withText.slice(0, 9).map((review, i) => {
                        const name = review.customers?.name?.trim() || 'Zaitoon guest'
                        return (
                            <motion.li
                                key={review.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                                className="mb-5 break-inside-avoid rounded-[24px] bg-surface p-6 shadow-[var(--shadow-soft)]"
                            >
                                <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`h-4 w-4 ${s <= review.rating ? 'fill-saffron text-saffron' : 'text-line-strong'}`} />
                                    ))}
                                </div>
                                <blockquote className="mt-4 font-display text-[1.1875rem] leading-snug text-ink">
                                    &ldquo;{review.comment}&rdquo;
                                </blockquote>
                                <div className="mt-5 flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-olive-100 text-sm font-semibold text-olive-700">
                                        {name.charAt(0).toUpperCase()}
                                    </span>
                                    <div className="text-sm">
                                        <p className="font-semibold text-ink">{name}</p>
                                        <p className="text-ink-3">
                                            {new Date(review.created_at).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </motion.li>
                        )
                    })}
                </ul>
            </div>
        </section>
    )
}
