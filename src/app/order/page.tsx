'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'

export default function OrderIndexPage() {
    const router = useRouter()
    const [orderNumber, setOrderNumber] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = orderNumber.trim().toUpperCase()
        if (!trimmed) return
        // Strip leading # if user typed it
        const clean = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed
        router.push(`/order/${clean}`)
    }

    return (
        <>
            <Navbar />
            <main
                role="main"
                className="min-h-screen bg-[#0D2015] pt-[110px] pb-24 px-4 flex items-center justify-center"
            >
                <div className="w-full max-w-sm text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 rounded-2xl bg-[var(--orange-warm)]/20 flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">📦</span>
                    </div>

                    <h1 className="font-display text-[28px] font-[700] text-[var(--orange-pale)] mb-2">
                        Track Your Order
                    </h1>
                    <p className="text-white/60 text-[14px] mb-8 leading-relaxed">
                        Enter your order number to see live status updates.
                        Your order number was shown after placing the order.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="order-number-input" className="sr-only">
                                Order number
                            </label>
                            <input
                                id="order-number-input"
                                type="text"
                                value={orderNumber}
                                onChange={e => setOrderNumber(e.target.value)}
                                placeholder="e.g. ZT-ON-1234"
                                autoCapitalize="characters"
                                className="w-full bg-white/10 border-[2px] border-white/20 rounded-xl px-5 py-4 text-white placeholder:text-white/30 text-[16px] font-mono tracking-wider text-center focus:outline-none focus:border-[var(--orange-warm)] transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!orderNumber.trim()}
                            className="w-full btn-primary py-4 text-[15px] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Track Order →
                        </button>
                    </form>

                    <p className="mt-6 text-white/30 text-[13px]">
                        Your order number starts with <span className="text-white/50 font-mono">ZT-ON-</span>
                    </p>

                    <div className="mt-12 pt-6 border-t border-white/10">
                        <Link
                            href="/menu"
                            className="text-[var(--orange-pale)]/70 hover:text-[var(--orange-pale)] text-[14px] font-[600] transition-colors"
                        >
                            ← Back to Menu
                        </Link>
                    </div>
                </div>
            </main>
        </>
    )
}
