import HomeClient from '@/components/home/HomeClient'
import { ReviewsSection } from '@/components/reviews/reviews-section'

export default function HomePage() {
  return (
    <HomeClient>
      <ReviewsSection />
    </HomeClient>
  )
}
