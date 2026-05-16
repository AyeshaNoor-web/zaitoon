import Image from 'next/image'
import { Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StarRating } from './star-rating'
import { Review } from '@/types/reviews'
import { cn } from '@/lib/utils'

interface ReviewCardProps {
  review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
  // Format date to "Month Year"
  const formattedDate = new Date(review.date_posted).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  // Fallback for customer image (first letter)
  const firstLetter = review.customer_name.charAt(0).toUpperCase()
  const nameHash = review.customer_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colors = [
    'bg-red-100 text-red-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-yellow-100 text-yellow-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
  ]
  const bgColor = colors[nameHash % colors.length]

  return (
    <Card className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      {/* Top Row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-[60px] h-[60px] shrink-0">
          {review.customer_image_url ? (
            <Image
              src={review.customer_image_url}
              alt={review.customer_name}
              width={60}
              height={60}
              className="rounded-full object-cover"
            />
          ) : (
            <div className={cn("w-full h-full rounded-full flex items-center justify-center font-bold text-xl", bgColor)}>
              {firstLetter}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {review.customer_name}
          </h4>
          <p className="text-sm text-muted-foreground truncate">
            {review.customer_location}
          </p>
          {review.is_verified && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-100 dark:border-green-800">
                <Check className="w-2.5 h-2.5" strokeWidth={3} /> Verified Diner
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Middle Row */}
      <div className="flex items-center justify-between mb-3">
        <StarRating rating={review.rating} size="sm" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
          {formattedDate}
        </span>
      </div>

      {/* Bottom Row */}
      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        &ldquo;{review.review_text}&rdquo;
      </p>
    </Card>
  )
}
