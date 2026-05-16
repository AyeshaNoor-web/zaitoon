'use client'

import { useState, useMemo } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, 
  PieChart, Pie, Cell, Legend 
} from 'recharts'
import { 
  TrendingUp, TrendingDown, DollarSign, 
  ShoppingBag, Users, Calendar, ArrowRight,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

import { 
  AnalyticsSummary, ChartDataPoint, TopItem, Order 
} from '@/types/orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const COLORS = ['#006b5c', '#cc845f', '#4c5c2d', '#9caf88', '#fdf8f0']

interface Props {
  initialSummary: AnalyticsSummary
  initialRevenueData: ChartDataPoint[]
  initialTopItems: TopItem[]
  initialTypeBreakdown: any[]
  initialPaymentBreakdown: any[]
  recentOrders: Order[]
}

export function AnalyticsClient({ 
  initialSummary, 
  initialRevenueData, 
  initialTopItems,
  initialTypeBreakdown,
  initialPaymentBreakdown,
  recentOrders
}: Props) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Trends calculation
  const getTrend = (current: number, previous: number) => {
    if (!previous) return { val: 0, up: true }
    const diff = ((current - previous) / previous) * 100
    return { val: Math.abs(diff).toFixed(1), up: diff >= 0 }
  }

  const revenueTrend = getTrend(initialSummary.month_revenue, initialSummary.prev_month_revenue)
  const ordersTrend = getTrend(initialSummary.month_orders, initialSummary.prev_month_orders)

  return (
    <div className="space-y-8">
      {/* ── Date Filter Bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {['Today', 'This Week', 'This Month'].map((p) => (
            <Button key={p} variant="ghost" size="sm" className="h-8 text-xs font-bold uppercase tracking-wider">
              {p}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-32 text-xs" />
            <span className="text-muted-foreground text-xs">to</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-32 text-xs" />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[var(--green-base)] font-bold">Apply</Button>
        </div>
      </div>

      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Today's Revenue" 
          value={`PKR ${initialSummary.today_revenue.toLocaleString()}`}
          icon={DollarSign}
          trend={getTrend(initialSummary.today_revenue, initialSummary.prev_today_revenue)}
          color="text-green-600"
        />
        <StatCard 
          label="Weekly Revenue" 
          value={`PKR ${initialSummary.week_revenue.toLocaleString()}`}
          icon={TrendingUp}
          trend={getTrend(initialSummary.week_revenue, initialSummary.prev_week_revenue)}
          color="text-blue-600"
        />
        <StatCard 
          label="Monthly Revenue" 
          value={`PKR ${initialSummary.month_revenue.toLocaleString()}`}
          icon={Calendar}
          trend={revenueTrend}
          color="text-purple-600"
        />
        <StatCard 
          label="Orders This Month" 
          value={initialSummary.month_orders}
          icon={ShoppingBag}
          trend={ordersTrend}
          color="text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Revenue Chart ─────────────────────────────────────────────────── */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold">Revenue Trend</CardTitle>
              <p className="text-xs text-muted-foreground">Historical sales performance</p>
            </div>
            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
              {['daily', 'weekly', 'monthly'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as any)}
                  className={cn(
                    "px-3 py-1 rounded text-[10px] font-bold uppercase transition-all",
                    period === p ? "bg-white dark:bg-zinc-700 shadow-sm text-[var(--green-base)]" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={initialRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--green-base)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--green-base)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888' }}
                    tickFormatter={(val) => `PKR ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(val: any) => [`PKR ${val?.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--green-base)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ── Order Type Breakdown ──────────────────────────────────────────── */}
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-bold">Order Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">Breakdown by order type</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={initialTypeBreakdown}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {initialTypeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full mt-4 space-y-2">
              {initialTypeBreakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="capitalize">{item.name.replace('_', ' ')}</span>
                  </div>
                  <span className="font-bold">{item.value} orders</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Top Selling Items ─────────────────────────────────────────────── */}
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-bold">Top Selling Items</CardTitle>
            <p className="text-xs text-muted-foreground">Most popular menu choices</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {initialTopItems.map((item, i) => {
                const maxCount = initialTopItems[0].count
                const percentage = (item.count / maxCount) * 100
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{i + 1}. {item.name}</span>
                      <span className="text-muted-foreground">{item.count} orders</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--green-base)] rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Payment Methods ───────────────────────────────────────────────── */}
        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base font-bold">Revenue by Payment</CardTitle>
            <p className="text-xs text-muted-foreground">Preferred payment channels</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={initialPaymentBreakdown} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888', fontWeight: 'bold' }} 
                    width={80}
                  />
                  <Tooltip 
                    formatter={(val: any) => [`PKR ${val?.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {initialPaymentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Orders ─────────────────────────────────────────────────── */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">Recent Transactions</CardTitle>
            <p className="text-xs text-muted-foreground">Latest order activity</p>
          </div>
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm" className="text-xs font-bold gap-2">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-zinc-950/50">
              <TableRow>
                <TableHead>Order#</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs font-bold">{o.order_number}</TableCell>
                  <TableCell className="text-sm">{o.customer_name}</TableCell>
                  <TableCell className="font-bold">PKR {Number(o.total_amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                      o.order_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      {o.order_status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, trend, color }: any) {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-lg bg-opacity-10", color.replace('text', 'bg'))}>
            <Icon className={cn("w-5 h-5", color)} />
          </div>
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            trend.up ? "bg-green-50 text-green-600 dark:bg-green-900/30" : "bg-red-50 text-red-600 dark:bg-red-900/30"
          )}>
            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.val}%
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <h3 className="text-2xl font-black mt-1">{value}</h3>
      </CardContent>
    </Card>
  )
}
