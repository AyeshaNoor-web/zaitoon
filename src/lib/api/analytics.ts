import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface AnalyticsOrderRow {
    id: string;
    total: number;
    status: string;
    order_type: string;
    branch_id: string;
    created_at: string;
    customer_phone: string;
    order_items: { name: string; quantity: number }[];
}

export async function getAnalytics(range: 'today' | 'week' | 'month') {
    const now = new Date()
    const start = new Date()

    if (range === 'today') start.setHours(0, 0, 0, 0)
    else if (range === 'week') start.setDate(now.getDate() - 7)
    else if (range === 'month') start.setDate(now.getDate() - 30)

    const { data, error } = await supabase
    .from('orders')
    .select(`
            id, total, status, order_type, branch_id, created_at, customer_phone,
            order_items ( name, quantity )
        `)
        .gte('created_at', start.toISOString())
        .neq('status', 'cancelled')

    if (error) throw error
    const orders = (data || []) as unknown as AnalyticsOrderRow[]

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
    const newCustomers = new Set(orders.map(o => o.customer_phone)).size

    return { totalRevenue, totalOrders, avgOrderValue, newCustomers, orders }
}
