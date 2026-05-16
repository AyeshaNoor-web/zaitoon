import { getPublishedReviews } from '@/lib/api/reviews'
import { ReviewCard } from './review-card'
import { ReviewsTicker } from './reviews-ticker'

export async function ReviewsSection() {
    const reviews = await getPublishedReviews()
    
    // Extract short quotes for the ticker
    const quotes = reviews
        .filter(r => r.review_text.length < 150)
        .map(r => r.review_text.slice(0, 100) + (r.review_text.length > 100 ? '...' : ''))
        .slice(0, 8)

    return (
        <section id="reviews" className="py-20 bg-transparent overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16 flex flex-col items-center">
                    <p className="text-[var(--green-base)] text-sm font-medium tracking-[0.2em] uppercase mb-3">
                        What People Say
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Customer Reviews
                    </h2>
                    <p className="text-muted-foreground max-w-lg">
                        Real experiences from our beloved guests who have savored the flavors of Zaitoon.
                    </p>
                    <div className="w-16 h-1 bg-[var(--green-base)] rounded-full mt-6" />
                </div>

                {/* Masonry Grid */}
                {reviews.length > 0 ? (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 mb-16">
                        {reviews.map((review) => (
                            <div key={review.id} className="break-inside-avoid">
                                <ReviewCard review={review} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground italic">
                        No reviews published yet. Be the first to share your experience!
                    </div>
                )}
            </div>

            {/* Ticker */}
            {quotes.length > 0 && <ReviewsTicker quotes={quotes} />}
        </section>
    )
}
