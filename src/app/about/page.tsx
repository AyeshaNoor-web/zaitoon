import { Metadata } from 'next'
import { getAboutPageContent, getAboutValues, getChefs, getBlogPosts } from '@/lib/about'
import { HeroBanner } from '@/components/about/hero-banner'
import { StorySection } from '@/components/about/story-section'
import { ValuesSection } from '@/components/about/values-section'
import { ChefsSection } from '@/components/about/chefs-section'
import { BlogSection } from '@/components/about/blog-section'
import { StatsBar } from '@/components/about/stats-bar'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Our Story | Zaitoon',
  description: 'Learn about Zaitoon\'s journey, our master chefs, and our commitment to authentic Pakistani flavors in Lahore.',
}

export default async function AboutPage() {
  const [content, values, chefs, posts] = await Promise.all([
    getAboutPageContent(),
    getAboutValues(),
    getChefs(),
    getBlogPosts()
  ])

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 pt-[66px] lg:pt-[76px]">
      <HeroBanner content={content} />
      <StorySection content={content} />
      <StatsBar content={content} />
      <ValuesSection values={values} />
      <ChefsSection 
        chefs={chefs} 
        heading={content.chefs_heading} 
        subheading={content.chefs_subheading} 
      />
      <BlogSection 
        posts={posts} 
        heading={content.blog_heading} 
      />
    </main>
  )
}
