'use client'

import { cn } from '@/lib/utils'

interface ReviewsTickerProps {
  quotes: string[]
}

export function ReviewsTicker({ quotes }: ReviewsTickerProps) {
  // Duplicate quotes for seamless loop
  const doubledQuotes = [...quotes, ...quotes, ...quotes]

  return (
    <div className="w-full overflow-hidden bg-[var(--green-base)]/10 dark:bg-[var(--green-base)]/20 py-4 border-y border-[var(--green-base)]/10">
      <div className="flex whitespace-nowrap animate-scroll hover:[animation-play-state:paused]">
        {doubledQuotes.map((quote, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 text-sm italic text-muted-foreground"
          >
            <span className="max-w-md truncate">&ldquo;{quote}&rdquo;</span>
            <span className="text-[var(--green-base)] font-bold">·</span>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
      `}</style>
    </div>
  )
}
