'use client'
import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    Tooltip, ResponsiveContainer, XAxis, YAxis, Legend,
} from 'recharts'
import { getAnalytics } from '@/lib/api/analytics'
import { getBranches } from '@/lib/api/branches'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAdminRole } from '@/hooks/useAdminRole'

const RANGES = ['Today', 'This Week', 'This Month'] as const
type Range = typeof RANGES[number]

export default function AdminAnalyticsPage() {
    const { role, loading: roleLoading } = useAdminRole()
    const router = useRouter()

    useEffect(() => {
        if (!roleLoading && role !== 'owner') {
            router.replace('/admin/orders')
        }
    }, [role, roleLoading, router])
    const [range, setRange] = useState<Range>('This Week')
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [branches, setBranches] = useState<any[]>([])

    useEffect(() => {
        let isMounted = true
        async function load() {
            setLoading(true)
            try {
                const apiRange = range === 'Today' ? 'today' : range === 'This Week' ? 'week' : 'month'
                const [analytics, branchData] = await Promise.all([
                    getAnalytics(apiRange),
                    getBranches()
                ])
                if (isMounted) {
                    setData(analytics)
                    setBranches(branchData)
                }
            } catch (err) {
                console.error(err)
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        load()
        return () => { isMounted = false }
    }, [range])

    // --- Compute Chart Data ---
    const chartData = useMemo(() => {
        if (!data) return { revenueData: [], topItems: [], orderSplit: [] }

        // Revenue over time
        const dayMap = new Map<string, Record<string, string | number>>()

        data.orders.forEach((o: any) => {
            const date = new Date(o.created_at)
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (!dayMap.has(dateStr)) dayMap.set(dateStr, { day: dateStr })
            const entry = dayMap.get(dateStr)!

            const branchName = branches.find(b => b.id === o.branch_id)?.name || 'Unknown'
            entry[branchName] = (Number(entry[branchName]) || 0) + o.total
        })

        const revenueData = Array.from(dayMap.values()).sort((a: any, b: any) => new Date(a.day).getTime() - new Date(b.day).getTime())

        // Top Items
        const itemsMap = new Map<string, number>()
        data.orders.forEach((o: any) => {
            if (o.order_items) {
                o.order_items.forEach((item: any) => {
                    itemsMap.set(item.name, (itemsMap.get(item.name) || 0) + item.quantity)
                })
            }
        })
        const topItems = Array.from(itemsMap.entries())
            .map(([name, orders]) => ({ name, orders }))
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 5)

        // Order Type split
        const typeMap = new Map<string, number>()
        data.orders.forEach((o: any) => {
            const t = o.order_type === 'delivery' ? 'Delivery' : o.order_type === 'takeaway' ? 'Takeaway' : 'Dine-In'
            typeMap.set(t, (typeMap.get(t) || 0) + 1)
        })
        const totalSplit = Array.from(typeMap.values()).reduce((a, b) => a + b, 0)

        const COLORS: Record<string, string> = { 'Delivery': '#1B4332', 'Takeaway': '#B45309', 'Dine-In': '#2D6A4F' }
        const orderSplit = Array.from(typeMap.entries()).map(([name, value]) => ({
            name,
            value: totalSplit > 0 ? Math.round((value / totalSplit) * 100) : 0,
            color: COLORS[name] || '#18181B'
        }))

        return { revenueData, topItems, orderSplit }
    }, [data, range, branches])

    if (roleLoading || role !== 'owner') {
        return null // show nothing while redirecting
    }

    if (loading && !data) {
        return (
            <AdminLayout>
                <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
                    <Loader2 className="w-10 h-10 text-[#1B4332] animate-spin" />
                    <p className="text-[#47423D] font-medium animate-pulse">Loading Live Analytics...</p>
                </div>
            </AdminLayout>
        )
    }

    const STAT_CARDS = [
        { emoji: '📦', label: 'Total Orders', value: data?.totalOrders?.toLocaleString() || '0' },
        { emoji: '💰', label: 'Revenue', value: `Rs. ${data?.totalRevenue?.toLocaleString() || '0'}` },
        { emoji: '📊', label: 'Avg Order Value', value: `Rs. ${data?.avgOrderValue?.toLocaleString() || '0'}` },
        { emoji: '👥', label: 'New Customers', value: data?.newCustomers?.toLocaleString() || '0' },
    ]

    const branchNames = branches.map(b => b.name)
    const noOrders = !data || data.totalOrders === 0

    return (
        <AdminLayout>
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                {/* Header + date tabs */}
                <div className="flex flex-wrap items-center gap-4">
                    <h1 className="font-display text-3xl font-bold mr-auto text-[#18181B]">Analytics</h1>
                    <div className="flex gap-1 p-1.5 rounded-2xl bg-white border border-[#E7E0D8]">
                        {RANGES.map(r => (
                            <button key={r} onClick={() => setRange(r)} disabled={loading}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${range === r ? 'bg-[#1B4332] text-white shadow-md' : 'text-[#47423D] hover:bg-[#FAF6EF]'
                                    }`}>
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {STAT_CARDS.map(s => (
                        <div key={s.label} className="bg-white rounded-3xl p-6 card-md border border-[#E7E0D8]">
                            <div className="text-3xl mb-3">{s.emoji}</div>
                            <p className="font-display text-2xl font-bold text-[#18181B]">{s.value}</p>
                            <p className="text-xs mt-1 font-semibold text-[#47423D]">{s.label}</p>
                        </div>
                    ))}
                </div>

                {noOrders ? (
                    <div className="bg-white rounded-3xl p-16 card-lg border border-[#E7E0D8] text-center">
                        <div className="text-5xl mb-4 opacity-50">📊</div>
                        <h2 className="font-display text-2xl font-bold text-[#18181B] mb-2">No orders yet</h2>
                        <p className="text-[#47423D]">There is no order data to display for "{range}".</p>
                    </div>
                ) : (
                    <>
                        {/* Revenue Line Chart */}
                        <div className="bg-white rounded-3xl p-6 card-lg border border-[#E7E0D8]">
                            <h2 className="font-display text-xl font-bold text-[#18181B] mb-6">Revenue Over Time</h2>
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={chartData.revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#47423D' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#47423D' }} tickFormatter={v => `${Math.round((v as number) / 1000)}k`} axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(v: any) => `Rs. ${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: '16px', border: '1px solid #E7E0D8', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                                    {branchNames.map((name, i) => (
                                        <Line key={name} type="monotone" dataKey={name} name={name} stroke={i === 0 ? "#1B4332" : "#B45309"} strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Items Bar Chart */}
                            <div className="bg-white rounded-3xl p-6 card-md border border-[#E7E0D8]">
                                <h2 className="font-display text-xl font-bold text-[#18181B] mb-6">Top Items</h2>
                                <ResponsiveContainer width="100%" height={240}>
                                    {chartData.topItems.length > 0 ? (
                                        <BarChart data={chartData.topItems} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: '#18181B', fontWeight: 500 }} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: '#FAF6EF' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Bar dataKey="orders" fill="#1B4332" radius={[0, 8, 8, 0]} barSize={24} />
                                        </BarChart>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-sm text-gray-600">Not enough item data</div>
                                    )}
                                </ResponsiveContainer>
                            </div>

                            {/* Order Type Pie */}
                            <div className="bg-white rounded-3xl p-6 card-md border border-[#E7E0D8] flex flex-col items-center">
                                <h2 className="font-display text-xl font-bold text-[#18181B] mb-2 self-start">Order Type Split</h2>
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={chartData.orderSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} label={({ name, value }) => `${name} ${value}%`} labelLine={false} stroke="none">
                                            {chartData.orderSplit.map((entry, i) => <Cell key={entry.name} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    )
}

