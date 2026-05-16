import { getOrders } from '@/lib/orders'
import { getMenuItems } from '@/lib/api/menu'
import AdminLayout from '@/components/admin/AdminLayout'
import { OrdersClient } from './orders-client'

export const metadata = {
  title: 'Order Management | Zaitoon Admin',
}

export default async function AdminOrdersPage() {
    // Fetch first page of orders and all menu items for the form
    const [{ data: initialOrders, total }, menuItems] = await Promise.all([
        getOrders({ page: 1, limit: 10 }),
        getMenuItems()
    ])

    return (
        <AdminLayout>
            <div className="p-4 md:p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track, manage, and place new orders directly from the dashboard.
                    </p>
                </div>
                
                <OrdersClient 
                    initialOrders={initialOrders} 
                    totalOrders={total}
                    menuItems={menuItems}
                />
            </div>
        </AdminLayout>
    )
}
