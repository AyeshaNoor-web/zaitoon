import AdminLayout from '@/components/admin/AdminLayout'
import { AnalyticsClient } from './analytics-client'
import { 
    getAnalyticsSummary, 
    getRevenueChartData, 
    getTopSellingItems,
    getOrderTypeBreakdown,
    getPaymentMethodBreakdown,
    getOrders
} from '@/lib/orders'

export const metadata = {
  title: 'Revenue & Analytics | Zaitoon Admin',
}

export default async function AnalyticsPage() {
    // Fetch initial data for the dashboard
    const [
        summary, 
        revenueData, 
        topItems, 
        typeBreakdown, 
        paymentBreakdown,
        { data: recentOrders }
    ] = await Promise.all([
        getAnalyticsSummary(),
        getRevenueChartData('daily'),
        getTopSellingItems(10),
        getOrderTypeBreakdown(),
        getPaymentMethodBreakdown(),
        getOrders({ page: 1, limit: 5 })
    ])

    return (
        <AdminLayout>
            <div className="p-4 md:p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revenue & Analytics</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Comprehensive overview of your restaurant's performance and sales trends.
                    </p>
                </div>
                
                <AnalyticsClient 
                    initialSummary={summary}
                    initialRevenueData={revenueData}
                    initialTopItems={topItems}
                    initialTypeBreakdown={typeBreakdown}
                    initialPaymentBreakdown={paymentBreakdown}
                    recentOrders={recentOrders}
                />
            </div>
        </AdminLayout>
    )
}
