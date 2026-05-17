'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { AdminReview } from '@/lib/api/reviews'

export default function ReviewsWall({ reviews }: { reviews: AdminReview[] }) {
    if (!reviews || reviews.length === 0) return null

    return (
        <section className="py-20 relative overflow-hidden bg-[var(--parchment)] dark:bg-[var(--background)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="font-display text-4xl md:text-5xl font-[700] text-[var(--green-darkest)] dark:text-[var(--foreground)] mb-4"
                    >
                        What Our Customers Say
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-lg text-[var(--stone)] max-w-2xl mx-auto"
                    >
                        Real reviews from our amazing customers across Lahore.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reviews.map((review, i) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="bg-[var(--cream)] dark:bg-[var(--muted)] p-6 rounded-2xl shadow-card-sm border border-[rgba(106,126,63,0.1)] relative"
                        >
                            <Quote className="absolute top-6 right-6 w-8 h-8 text-[var(--orange-pale)] opacity-50" />
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, idx) => (
                                    <Star
                                        key={idx}
                                        className={`w-4 h-4 ${idx < review.rating ? 'text-[var(--gold-bright)] fill-current' : 'text-gray-300'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-[var(--charcoal)] dark:text-[var(--foreground)] text-[15px] leading-relaxed mb-6 italic">
                                "{review.comment}"
                            </p>
                            <div className="flex items-center gap-3 mt-auto">
                                <div className="w-10 h-10 rounded-full bg-[var(--green-light)] flex items-center justify-center text-white font-bold text-sm">
                                    {review.customers?.name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div>
                                    <p className="font-bold text-[14px] text-[var(--green-darkest)] dark:text-[var(--foreground)]">
                                        {review.customers?.name || 'Anonymous'}
                                    </p>
                                    <p className="text-[12px] text-[var(--stone)]">
                                        Verified Buyer
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
