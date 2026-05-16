import { getAllReviews } from '@/lib/api/reviews'
import AdminLayout from '@/components/admin/AdminLayout'
import { ReviewsAdminClient } from './reviews-admin-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Manage Reviews | Zaitoon Admin',
}

export default async function AdminReviewsPage() {
    const reviews = await getAllReviews()

    return (
        <AdminLayout>
            <div className="p-4 md:p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Reviews</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage testimonials and order feedback displayed on the website.
                    </p>
                </div>
                
                <ReviewsAdminClient initialReviews={reviews} />
            </div>
        </AdminLayout>
    )
}
