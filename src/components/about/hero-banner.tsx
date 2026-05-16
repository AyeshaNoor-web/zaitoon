import Image from 'next/image'
import { AboutPageContent } from '@/types/about'

interface Props {
  content: AboutPageContent
}

export function HeroBanner({ content }: Props) {
  return (
    <section className="relative overflow-hidden h-[420px] w-full">
      <Image
        src={content.hero_image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400'}
        alt={content.hero_heading || 'Our Story'}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 flex items-center justify-center text-center px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {content.hero_heading}
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-medium max-w-2xl mx-auto">
            {content.hero_subheading}
          </p>
        </div>
      </div>
    </section>
  )
}
