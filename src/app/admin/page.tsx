'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ClipboardList, UtensilsCrossed, BarChart3 } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { formatPrice } from '@/lib/payment'
import { getAllOrders } from '@/lib/api/orders'
import { useAdminRole } from '@/hooks/useAdminRole'
import { titleCase } from '@/lib/site'
import type { Order } from '@/types'

const ACTIVE = ['confirmed', 'preparing', 'out_for_delivery']

export default function AdminPage() {
    const router = useRouter()
    const { role, loading } = useAdminRole()
    const [orders, setOrders] = useState<Order[] | null>(null)

    useEffect(() => {
        if (loading) return
        if (role === 'employee') { router.replace('/admin/orders'); return }
        getAllOrders(1, 1000).then(({ orders }) => setOrders(orders)).catch(() => setOrders([]))
    }, [role, loading, router])

    const list = orders ?? []
    const valid = list.filter(o => o.status !== 'cancelled')
    const today = new Date().toDateString()
    const todays = valid.filter(o => new Date(o.created_at).toDateString() === today)

    const stats = [
        { label: 'Revenue today', value: formatPrice(todays.reduce((s, o) => s + (o.total ?? 0), 0)), hint: `${todays.length} orders` },
        { label: 'Waiting to confirm', value: list.filter(o => o.status === 'pending').length, hint: 'Needs a reply on WhatsApp' },
        { label: 'In progress', value: list.filter(o => ACTIVE.includes(o.status)).length, hint: 'Confirmed, cooking or on the road' },
        { label: 'All-time revenue', value: formatPrice(valid.reduce((s, o) => s + (o.total ?? 0), 0)), hint: `${valid.length} orders, excl. cancelled` },
    ]

    return (
        <AdminLayout>
            <div className="mx-auto max-w-6xl p-5 md:p-10">
                <header className="mb-8">
                    <p className="text-sm font-medium text-ink-2">{new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    <h1 className="mt-1 text-[clamp(2rem,4vw,2.75rem)]">Dashboard</h1>
                </header>

                <section aria-label="Key metrics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((s, i) => (
                        <div key={s.label} className={`rounded-[22px] p-5 ${i === 0 ? 'bg-olive-800 text-paper' : 'border border-line bg-surface'}`}>
                            <p className={`text-sm font-medium ${i === 0 ? 'text-paper/70' : 'text-ink-2'}`}>{s.label}</p>
                            {orders === null
                                ? <div className={`mt-3 h-8 w-28 animate-pulse rounded-lg ${i === 0 ? 'bg-white/10' : 'bg-paper-2'}`} />
                                : <p className="mt-2 font-display text-3xl tabular">{s.value}</p>}
                            <p className={`mt-1 text-xs ${i === 0 ? 'text-paper/55' : 'text-ink-3'}`}>{s.hint}</p>
                        </div>
                    ))}
                </section>

                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                    <section aria-labelledby="recent-title" className="panel overflow-hidden !p-0 lg:col-span-2">
                        <div className="flex items-center justify-between border-b border-line px-6 py-4">
                            <h2 id="recent-title" className="text-xl">Recent orders</h2>
                            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-olive-700 hover:text-ink">
                                Open board <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        {orders === null ? (
                            <div className="space-y-2 p-4">{[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
                        ) : list.length === 0 ? (
                            <p className="px-6 py-12 text-center text-ink-2">No orders yet.</p>
                        ) : (
                            <ul className="divide-y divide-line">
                                {list.slice(0, 7).map(o => (
                                    <li key={o.id} className="flex items-center justify-between gap-4 px-6 py-3.5 text-sm">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-ink">#{o.order_number} · {o.customer_name}</p>
                                            <p className="text-ink-3">{new Date(o.created_at).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {titleCase(o.order_type)}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${o.status === 'cancelled' ? 'bg-danger/10 text-danger' : o.status === 'delivered' ? 'bg-success/10 text-success' : o.status === 'pending' ? 'bg-saffron/15 text-[#8A5A07]' : 'bg-olive-100 text-olive-700'}`}>
                                                {titleCase(o.status)}
                                            </span>
                                            <span className="price w-24 text-end">{formatPrice(o.total ?? 0)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section aria-label="Shortcuts" className="space-y-3">
                        {[
                            { label: 'Live orders', href: '/admin/orders', icon: ClipboardList, desc: 'Confirm and move orders through the kitchen.' },
                            { label: 'Menu', href: '/admin/menu', icon: UtensilsCrossed, desc: 'Prices, photos and availability.' },
                            { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, desc: 'Revenue, best sellers and trends.' },
                        ].map(card => (
                            <Link key={card.href} href={card.href} className="group flex items-start gap-4 rounded-[22px] border border-line bg-surface p-5 transition-all hover:border-line-strong hover:shadow-[var(--shadow-soft)]">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-olive-100 text-olive-700">
                                    <card.icon className="h-5 w-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block font-semibold text-ink">{card.label}</span>
                                    <span className="mt-0.5 block text-sm text-ink-2">{card.desc}</span>
                                </span>
                                <ArrowRight className="mt-1 h-4 w-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        ))}
                    </section>
                </div>
            </div>
        </AdminLayout>
    )
}
