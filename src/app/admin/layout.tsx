import { Metadata } from 'next'
import Providers from '@/components/providers/Providers'

export const metadata: Metadata = {
    title: 'Admin',
    robots: { index: false, follow: false },
}

export default function AdminLayoutComponent({ children }: { children: React.ReactNode }) {
    return <Providers>{children}</Providers>
}
