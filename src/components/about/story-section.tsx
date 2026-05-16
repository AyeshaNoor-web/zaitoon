import Image from 'next/image'
import { AboutPageContent } from '@/types/about'

interface Props {
  content: AboutPageContent
}

export function StorySection({ content }: Props) {
  // Split body text by double newline to create paragraphs
  const paragraphs = content.story_body?.split('\n\n') || []

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {content.story_heading}
          </h2>
          <div className="space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed">
                {p.trim()}
              </p>
            ))}
          </div>
        </div>
        <div className="relative mt-12 lg:mt-0 aspect-[4/3] w-full">
          <Image
            src={content.story_image_url || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'}
            alt={content.story_heading || 'Our Story'}
            fill
            className="rounded-2xl shadow-xl object-cover"
          />
        </div>
      </div>
    </section>
  )
}
