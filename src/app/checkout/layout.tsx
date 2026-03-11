import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Checkout \u2013 Place Your Order',
    robots: { index: false },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
