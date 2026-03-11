export type OrderType = 'delivery' | 'takeaway' | 'dine-in'
export type PaymentMethod = 'jazzcash' | 'cod'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type ItemTag = 'bestseller' | 'new'

export interface Branch {
    id: string
    name: string
    address: string
    lat: number
    lng: number
    phone: string
    whatsapp: string
    hours: string
    is_active?: boolean
}

export interface MenuItem {
    id: string
    name: string
    // DB column name (used by API layer)
    category_id?: string
    // Legacy field used by UI components
    category?: string
    price: number | null
    price_large?: number | null
    // Legacy field used by MenuItemCard
    priceL?: number | null
    rating: number
    prep_time?: number
    // Legacy camelCase used by UI
    prepTime?: number
    tags: ItemTag[]
    description?: string | null
    image_url?: string | null
    is_available?: boolean
    has_sizes?: boolean
    price_on_request?: boolean
    display_order?: number
    categories?: { label: string; icon: string }
    // Legacy camelCase used by MenuItemCard
    isAvailable?: boolean
    hasSizes?: boolean
    priceOnRequest?: boolean
}

export interface Order {
    id: string
    order_number: string
    customer_name: string
    customer_phone: string
    branch_id: string
    order_type: OrderType
    status: OrderStatus
    delivery_address: string | null
    delivery_lat: number | null
    delivery_lng: number | null
    subtotal: number
    delivery_fee: number
    loyalty_discount: number
    tier_discount: number
    total: number
    payment_method: PaymentMethod
    created_at: string
    updated_at: string
    branches?: Branch
    order_items?: OrderItem[]
}

export interface OrderItem {
    id: string
    order_id: string
    menu_item_id: string
    name: string
    size: 'small' | 'large' | null
    quantity: number
    unit_price: number
    subtotal: number
}

export interface Customer {
    id: string
    phone: string
    name: string
    loyalty_points: number
    tier: LoyaltyTier
    total_orders: number
    total_spent: number
    referral_code: string
    referred_by: string | null
}

export interface CartItem {
    id: string
    menuItemId: string
    name: string
    size: 'small' | 'large' | null
    unitPrice: number
    quantity: number
    subtotal: number
    imageUrl: string | null
}

export interface CustomerLocation {
    lat: number
    lng: number
    address: string
}

export interface LoyaltyTransaction {
    id: string
    date: Date
    description: string
    points: number
    type: 'earned' | 'redeemed'
}
