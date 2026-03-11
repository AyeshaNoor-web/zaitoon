import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Full Menu \u2013 Shawarma, BBQ & More',
    description: 'Browse Zaitoon\'s complete menu: Lebanese shawarma, BBQ platters, smash burgers, family platters and more. Order online for delivery in Lahore.',
    openGraph: {
        title: 'Zaitoon Menu \u2013 Shawarma, BBQ & Burgers',
        description: 'Full menu with prices. Order online for delivery across Lahore.',
        images: ['/og-menu.jpg'],
    },
}

export default function MenuLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
