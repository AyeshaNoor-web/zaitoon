import type { Metadata } from 'next'
import { Playfair_Display, Source_Sans_3, Noto_Sans_Arabic } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const notoUrdu = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-urdu',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://zaitoon.pk'),
  title: {
    default: 'Zaitoon – House of Shawarma & BBQ | Lahore',
    template: '%s | Zaitoon Lahore',
  },
  description: 'Order authentic Lebanese shawarma, BBQ platters, and burgers online. Fast delivery from Wapda Town and Cantonment branches across Lahore. 30-minute delivery guaranteed.',
  keywords: [
    'shawarma lahore', 'shawarma delivery lahore', 'bbq lahore',
    'zaitoon restaurant', 'ziatoon lahore', 'lebanese food lahore',
    'chicken shawarma lahore', 'bbq delivery lahore', 'wapda town food',
    'cantonment restaurant lahore', 'online food order lahore',
    'best shawarma lahore', 'arabic food lahore', 'kabab lahore',
  ],
  authors: [{ name: 'Zaitoon Restaurant' }],
  creator: 'Zaitoon',
  publisher: 'Zaitoon',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://zaitoon.pk',
    siteName: 'Zaitoon – House of Shawarma & BBQ',
    title: 'Zaitoon – Lahore\'s Finest Shawarma & BBQ',
    description: 'Authentic Lebanese shawarma & BBQ delivered hot to your door in 30 minutes. Two branches in Lahore.',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Zaitoon – House of Shawarma & BBQ Lahore',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zaitoon – Lahore\'s Finest Shawarma & BBQ',
    description: 'Order authentic shawarma & BBQ online. 30-min delivery across Lahore.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'ADD_YOUR_GOOGLE_SEARCH_CONSOLE_CODE_HERE',
  },
}

import { Toaster } from 'sonner'
import RestaurantSchema from '@/components/seo/RestaurantSchema'
import { ClientLocalizationWrapper } from '@/components/layout/ClientLocalizationWrapper'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable} ${notoUrdu.variable}`} suppressHydrationWarning>
      <head>
        <RestaurantSchema />
      </head>
      <body>
        <ClientLocalizationWrapper>
          {children}
        </ClientLocalizationWrapper>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
