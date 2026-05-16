import { createClient } from '@/lib/supabase/client'
import { 
  Order, OrderInsert, OrderUpdate, OrderStatus,
  AnalyticsSummary, ChartDataPoint, TopItem 
} from '@/types/orders'

const supabase = createClient()

// ── Orders CRUD ─────────────────────────────────────────────────────────────

export async function getOrders(filters?: {
  search?: string
  type?: string
  paymentStatus?: string
  orderStatus?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}): Promise<{ data: Order[]; total: number }> {
  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })

  if (filters?.search) {
    query = query.or(`customer_name.ilike.%${filters.search}%,order_number.ilike.%${filters.search}%`)
  }
  if (filters?.type && filters.type !== 'all') {
    query = query.eq('order_type', filters.type)
  }
  if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
    query = query.eq('payment_status', filters.paymentStatus)
  }
  if (filters?.orderStatus && filters.orderStatus !== 'all') {
    query = query.eq('order_status', filters.orderStatus)
  }
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  if (filters?.dateTo) {
    // Add time to cover the whole end date
    query = query.lte('created_at', `${filters.dateTo}T23:59:59`)
  }

  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)
  return { data: (data as Order[]) ?? [], total: count ?? 0 }
}

export async function getOrderById(id: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as Order
}

export async function createOrder(data: OrderInsert): Promise<Order> {
  const { data: newOrder, error } = await supabase
    .from('orders')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return newOrder as Order
}

export async function updateOrder(id: string, data: OrderUpdate): Promise<Order> {
  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return updatedOrder as Order
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ order_status: status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ── Analytics ───────────────────────────────────────────────────────────────

export async function getAnalyticsSummary(dateRange?: { from: string; to: string }): Promise<AnalyticsSummary> {
  const now = new Date()
  const todayStart = new Date(now.setHours(0,0,0,0)).toISOString()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  
  // Previous periods
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

  // Fetch all orders for the last 2 months to calculate stats in memory
  // In production, this should be done with SQL aggregations
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total_amount, created_at, order_status')
    .gte('created_at', prevMonthStart)

  if (error) throw new Error(error.message)

  const stats: AnalyticsSummary = {
    today_revenue: 0, today_orders: 0, prev_today_revenue: 0,
    week_revenue: 0, prev_week_revenue: 0,
    month_revenue: 0, prev_month_revenue: 0,
    month_orders: 0, prev_month_orders: 0
  }

  orders.forEach(o => {
    const date = o.created_at
    const total = Number(o.total_amount)
    
    if (date >= todayStart) {
      stats.today_revenue += total
      stats.today_orders += 1
    }
    if (date >= weekStart) {
      stats.week_revenue += total
    }
    if (date >= monthStart) {
      stats.month_revenue += total
      stats.month_orders += 1
    } else if (date >= prevMonthStart && date <= prevMonthEnd) {
      stats.prev_month_revenue += total
      stats.prev_month_orders += 1
    }
  })

  return stats
}

export async function getRevenueChartData(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<ChartDataPoint[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('total_amount, created_at')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  // Aggregation logic
  const map = new Map<string, { revenue: number; orders: number }>()

  data.forEach(o => {
    const d = new Date(o.created_at)
    let label = ''
    if (period === 'daily') label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    else if (period === 'weekly') label = `Week ${getWeekNumber(d)}`
    else label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

    const existing = map.get(label) || { revenue: 0, orders: 0 }
    map.set(label, { 
      revenue: existing.revenue + Number(o.total_amount),
      orders: existing.orders + 1
    })
  })

  return Array.from(map.entries()).map(([label, val]) => ({
    label,
    revenue: val.revenue,
    orders: val.orders
  }))
}

export async function getTopSellingItems(limit = 10): Promise<TopItem[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('items')

  if (error) throw new Error(error.message)

  const map = new Map<string, { count: number; revenue: number }>()
  data.forEach(o => {
    const items = o.items as any[]
    items.forEach(i => {
      const existing = map.get(i.item_name) || { count: 0, revenue: 0 }
      map.set(i.item_name, {
        count: existing.count + i.quantity,
        revenue: existing.revenue + Number(i.subtotal)
      })
    })
  })

  return Array.from(map.entries())
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export async function getOrderTypeBreakdown(): Promise<any[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('order_type')

  if (error) throw new Error(error.message)

  const map = new Map<string, number>()
  data.forEach(o => {
    map.set(o.order_type, (map.get(o.order_type) || 0) + 1)
  })

  return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
}

export async function getPaymentMethodBreakdown(): Promise<any[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('payment_method, total_amount')

  if (error) throw new Error(error.message)

  const map = new Map<string, number>()
  data.forEach(o => {
    map.set(o.payment_method, (map.get(o.payment_method) || 0) + Number(o.total_amount))
  })

  return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
}

// Helper
function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
