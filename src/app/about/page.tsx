import type { Metadata } from 'next'
import { getSiteContent } from '@/lib/api/menu'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'About Us | Zaitoon – Authentic Lebanese Cuisine',
  description: 'Learn about the story behind Zaitoon – our heritage, mission, and dedication to bringing authentic Lebanese flavours to Pakistan.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Server component – fetches CMS data at request time
export default async function AboutPage() {
  let cms: Record<string, string> = {}
  try {
    cms = await getSiteContent()
  } catch {
    /* fallback to defaults */
  }

  return <AboutClient cms={cms} />
}
