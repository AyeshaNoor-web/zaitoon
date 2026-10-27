import type { Metadata, Viewport } from 'next'
import { Fraunces, Figtree, Noto_Sans_Arabic } from 'next/font/google'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import RestaurantSchema from '@/components/seo/RestaurantSchema'
import { ClientLocalizationWrapper } from '@/components/layout/ClientLocalizationWrapper'
import { StoreHydrator } from '@/store/hydration'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz', 'SOFT'],
  variable: '--font-fraunces',
  display: 'swap',
})

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
})

const notoUrdu = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-urdu',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#20251A',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://zaitoon.pk'),
  title: {
    default: 'Zaitoon – House of Shawarma & BBQ | Lahore',
    template: '%s | Zaitoon Lahore',
  },
  description: 'Order Lebanese shawarma, charcoal BBQ platters and burgers online. Delivery from our Wapda Town and Cantonment branches across Lahore.',
  keywords: [
    'shawarma lahore', 'shawarma delivery lahore', 'bbq lahore',
    'zaitoon restaurant', 'lebanese food lahore', 'chicken shawarma lahore',
    'bbq delivery lahore', 'wapda town food', 'cantonment restaurant lahore',
    'online food order lahore', 'arabic food lahore',
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
    siteName: 'Zaitoon – House of Shawarma & BBQ',
    title: 'Zaitoon – Shawarma & charcoal BBQ in Lahore',
    description: 'Lebanese shawarma and charcoal BBQ, delivered hot across Lahore.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zaitoon – Shawarma & charcoal BBQ in Lahore',
    description: 'Order shawarma and BBQ online for delivery across Lahore.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${figtree.variable} ${notoUrdu.variable}`} suppressHydrationWarning>
      <head>
        <RestaurantSchema />
      </head>
      <body>
        <StoreHydrator />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <ClientLocalizationWrapper>
          {children}
        </ClientLocalizationWrapper>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-body)',
              borderRadius: '14px',
              border: '1px solid var(--color-line)',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
