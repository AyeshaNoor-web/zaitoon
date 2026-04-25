'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Package, TrendingUp, ClipboardList, CheckCircle } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { formatPrice } from '@/lib/payment'
import { getAllOrders } from '@/lib/api/orders'
import { useAdminRole } from '@/hooks/useAdminRole'

export default function AdminPage() {
    const router = useRouter()
    const { role } = useAdminRole()
    const [orders, setOrders] = useState<any[]>([])

    useEffect(() => {
        if (role === 'employee') {
            router.replace('/admin/orders')
            return
        }
        getAllOrders(1, 1000).then(({ orders }) => setOrders(orders)).catch(console.error)
    }, [role, router])

    const revenue = orders.reduce((s, o) => s + o.total, 0)
    const active = orders.filter(o => o.status !== 'delivered' && o.status !== 'pending').length
    const delivered = orders.filter(o => o.status === 'delivered').length

    const STATS = [
        { icon: Package, label: 'Total Orders', value: orders.length, bg: 'bg-[var(--green-mid)]', text: 'text-[var(--cream)]' },
        { icon: TrendingUp, label: 'Revenue', value: formatPrice(revenue), bg: 'bg-[var(--orange-warm)]', text: 'text-[#0D2015]' },
        { icon: ClipboardList, label: 'Active Orders', value: active, bg: 'bg-[var(--parchment)]', text: 'text-[var(--charcoal)]' },
        { icon: CheckCircle, label: 'Delivered', value: delivered, bg: 'bg-[var(--parchment)]', text: 'text-[var(--charcoal)]' },
    ]

    return (
        <AdminLayout>
            <div className="p-6 md:p-10 max-w-[1200px] mx-auto min-h-full">
                <header className="mb-10 border-b border-[var(--linen)] pb-6">
                    <h1 className="font-display text-[32px] font-[700] text-white">Dashboard Overview</h1>
                    <p className="text-[14px] mt-2 text-[rgba(251,246,246,0.82)] font-[400]">Monitor real-time metrics and manage restaurant operations.</p>
                </header>

                {/* Stat cards */}
                <section aria-label="Key Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[24px] mb-[40px]">
                    {STATS.map((s, i) => {
                        const Icon = s.icon
                        return (
                            <motion.div
                                key={s.label}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08, ease: "easeOut", duration: 0.4 }}
                                className={`${s.bg} rounded-[8px] p-6 border-[2px] ${s.bg === 'bg-[var(--parchment)]' ? 'border-[var(--linen)]' : 'border-transparent'} shadow-md`}
                            >
                                <Icon className={`w-8 h-8 mb-4 ${s.bg === 'bg-[var(--orange-warm)]' ? 'text-[#0D2015]' : 'text-[var(--charcoal)]'}`} />
                                <div className={`font-display text-[36px] font-[700] leading-none mb-1 ${s.text}`}>{s.value}</div>
                                <div className={`text-[13px] font-[600] uppercase tracking-[0.05em] ${s.bg === 'bg-[var(--parchment)]' ? 'text-[var(--stone)]' : 'text-[rgba(251,246,246,0.9)]'} ${s.bg === 'bg-[var(--orange-warm)]' ? '!text-[#0D2015]' : ''}`}>
                                    {s.label}
                                </div>
                            </motion.div>
                        )
                    })}
                </section>

                {/* Quick links */}
                <section aria-label="Quick Actions">
                    <h2 className="text-[18px] font-display font-[700] text-[var(--cream)] mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-[24px]">
                        {[
                            { label: 'Manage Orders', href: '/admin/orders', emoji: '📋', desc: 'Process live incoming orders.' },
                            { label: 'Edit Menu', href: '/admin/menu', emoji: '🍽️', desc: 'Update items and availability.' },
                            { label: 'View Analytics', href: '/admin/analytics', emoji: '📊', desc: 'Revenue and sales insights.' },
                        ].map((card, i) => (
                            <motion.div
                                key={card.href}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (i * 0.1) }}
                            >
                                <Link
                                    href={card.href}
                                    className="block bg-[var(--parchment)] rounded-[8px] p-[24px] border-[2px] border-[var(--linen)] hover:border-[var(--green-pale)] hover:-translate-y-1 transition-all h-full"
                                >
                                    <div className="text-[32px] mb-4 drop-shadow-sm">{card.emoji}</div>
                                    <h3 className="font-display text-[20px] font-[700] text-[var(--charcoal)] mb-2">{card.label}</h3>
                                    <p className="text-[13px] font-[400] text-[var(--stone)] leading-relaxed">{card.desc}</p>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>
        </AdminLayout>
    )
}
