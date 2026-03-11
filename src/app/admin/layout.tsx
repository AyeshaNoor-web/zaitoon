import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Admin',
    robots: { index: false, follow: false },
}

export default function AdminLayoutComponent({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
