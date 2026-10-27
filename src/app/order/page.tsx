'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, PackageSearch } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { useAuthStore } from '@/store/useAuthStore'
import { useHydrated } from '@/store/hydration'

export default function OrderIndexPage() {
    const router = useRouter()
    const hydrated = useHydrated()
    const { isAuthenticated } = useAuthStore()
    const [orderNumber, setOrderNumber] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const clean = orderNumber.trim().toUpperCase().replace(/^#/, '')
        if (clean) router.push(`/order/${encodeURIComponent(clean)}`)
    }

    return (
        <>
            <Navbar />
            <main id="main" className="pt-nav flex min-h-screen items-center justify-center px-5 pb-24">
                <div className="w-full max-w-md py-16 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-olive-700 text-white">
                        <PackageSearch className="h-7 w-7" />
                    </div>
                    <h1 className="mt-6 text-[clamp(2.5rem,6vw,3.5rem)]">Track your order</h1>
                    <p className="mt-3 text-ink-2">
                        Enter the order number from your confirmation. It starts with <span className="font-semibold text-ink">ZT-</span>.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <label htmlFor="order-number-input" className="sr-only">Order number</label>
                        <input
                            id="order-number-input"
                            type="text"
                            value={orderNumber}
                            onChange={e => setOrderNumber(e.target.value)}
                            placeholder="e.g. ZT-ON-1234"
                            autoCapitalize="characters"
                            autoComplete="off"
                            className="field !h-14 flex-1 text-center font-medium uppercase tracking-wider sm:text-start"
                        />
                        <button type="submit" disabled={!orderNumber.trim()} className="btn-primary !h-14">
                            Track <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </button>
                    </form>

                    {hydrated && isAuthenticated && (
                        <p className="mt-8 text-sm text-ink-2">
                            Signed in? Your recent orders are in{' '}
                            <Link href="/account" className="font-semibold text-ink underline underline-offset-4">your account</Link>.
                        </p>
                    )}
                </div>
            </main>
        </>
    )
}
