export interface Review {
  id: string
  customer_id?: string | null // For order-linked reviews
  order_id?: string | null    // For order-linked reviews
  customer_name: string       // Manually entered or synced from customer
  customer_location: string
  customer_image_url: string | null
  rating: number
  review_text: string
  date_posted: string
  is_published: boolean
  is_verified: boolean
  display_order: number
  created_at: string
  updated_at: string
  
  // Joined data for admin panel
  customers?: { name: string; phone: string }
  orders?: { order_number: string }
}

export type ReviewInsert = Omit<Review, 'id' | 'created_at' | 'updated_at' | 'customers' | 'orders'>
export type ReviewUpdate = Partial<ReviewInsert>
