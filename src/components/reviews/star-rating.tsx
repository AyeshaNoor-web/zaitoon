import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StarRating({ rating, size = 'md', className }: StarRatingProps) {
  const sizeMap = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }
  
  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  return (
    <div className={cn("flex gap-0.5", textSizeMap[size], className)}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(sizeMap[size])}
          fill={s <= Math.round(rating) ? '#FACC15' : 'transparent'} // yellow-400
          stroke="#FACC15"
          strokeWidth={1.5}
        />
      ))}
    </div>
  )
}
