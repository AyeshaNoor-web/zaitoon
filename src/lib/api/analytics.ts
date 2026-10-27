import { adminCall } from '@/lib/api/adminClient'

export interface AnalyticsResult {
    orders: {
        id: string
        total: number
        status: string
        order_type: string
        branch_id: string
        created_at: string
        customer_phone: string
        order_items: { name: string; quantity: number }[]
    }[]
    totalOrders: number
    totalRevenue: number
    avgOrderValue: number
    newCustomers: number
}

export const getAnalytics = (range: 'today' | 'week' | 'month') => adminCall<AnalyticsResult>('analytics.get', range)
