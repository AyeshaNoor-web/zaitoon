export interface OrderItem {
  item_id: string
  item_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export type OrderType = 'dine_in' | 'takeaway' | 'phone' | 'delivery'
export type PaymentMethod = 'cash' | 'card' | 'jazzcash' | 'easypaisa'
export type PaymentStatus = 'paid' | 'pending' | 'partial'
export type OrderStatus = 'received' | 'preparing' | 'ready' | 'served' | 'completed'

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string | null
  order_type: OrderType
  table_number: string | null
  items: OrderItem[]
  special_instructions: string | null
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  order_status: OrderStatus
  discount_amount: number
  total_amount: number
  created_at: string
  updated_at: string
}

export interface AnalyticsSummary {
  today_revenue: number
  today_orders: number
  prev_today_revenue: number
  week_revenue: number
  prev_week_revenue: number
  month_revenue: number
  prev_month_revenue: number
  month_orders: number
  prev_month_orders: number
}

export interface ChartDataPoint {
  label: string
  revenue: number
  orders: number
}

export interface TopItem {
  name: string
  count: number
  revenue: number
}

export type OrderInsert = Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>
export type OrderUpdate = Partial<OrderInsert>
