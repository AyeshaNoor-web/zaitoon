export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type OrderType = 'delivery' | 'takeaway' | 'dine-in'
export type PaymentMethod = 'jazzcash' | 'cod'
export type PaymentStatus = 'pending' | 'paid' | 'advance_paid' | 'refunded'
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type LoyaltyTxType = 'earned' | 'redeemed' | 'bonus' | 'expired'

export interface Database {
    public: {
        Tables: {
            branches: {
                Row: {
                    id: string
                    name: string
                    address: string
                    lat: number
                    lng: number
                    phone: string
                    whatsapp: string
                    hours: string
                    is_active: boolean
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['branches']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['branches']['Insert']>
            }
            categories: {
                Row: {
                    id: string
                    label: string
                    icon: string
                    display_order: number
                    is_active: boolean
                }
                Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['categories']['Insert']>
            }
            menu_items: {
                Row: {
                    id: string
                    name: string
                    category_id: string
                    price: number | null
                    price_large: number | null
                    rating: number
                    prep_time: number
                    tags: string[]
                    description: string | null
                    image_url: string | null
                    is_available: boolean
                    has_sizes: boolean
                    price_on_request: boolean
                    display_order: number
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['menu_items']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['menu_items']['Insert']>
            }
            customers: {
                Row: {
                    id: string
                    phone: string
                    name: string
                    loyalty_points: number
                    tier: LoyaltyTier
                    total_orders: number
                    total_spent: number
                    referral_code: string
                    referred_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at' | 'loyalty_points' | 'tier' | 'total_orders' | 'total_spent' | 'referral_code'>
                Update: Partial<Database['public']['Tables']['customers']['Insert']>
            }
            orders: {
                Row: {
                    id: string
                    order_number: string
                    customer_id: string | null
                    customer_name: string
                    customer_phone: string
                    branch_id: string
                    order_type: OrderType
                    status: OrderStatus
                    delivery_address: string | null
                    delivery_lat: number | null
                    delivery_lng: number | null
                    distance_km: number | null
                    subtotal: number
                    delivery_fee: number
                    loyalty_discount: number
                    promo_discount: number
                    total: number
                    payment_method: PaymentMethod
                    payment_status: PaymentStatus
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at' | 'order_number'>
                Update: Partial<Database['public']['Tables']['orders']['Insert']>
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    menu_item_id: string
                    name: string
                    size: string | null
                    quantity: number
                    unit_price: number
                    subtotal: number
                }
                Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['order_items']['Insert']>
            }
            loyalty_transactions: {
                Row: {
                    id: string
                    customer_id: string
                    order_id: string | null
                    type: LoyaltyTxType
                    points: number
                    description: string
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['loyalty_transactions']['Row'], 'id' | 'created_at'>
                Update: never
            }
            promo_codes: {
                Row: {
                    id: string
                    code: string
                    discount_type: 'percentage' | 'fixed'
                    discount_value: number
                    min_order: number
                    max_uses: number | null
                    uses_count: number
                    is_active: boolean
                    expires_at: string | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['promo_codes']['Row'], 'id' | 'created_at' | 'uses_count'>
                Update: Partial<Database['public']['Tables']['promo_codes']['Insert']>
            }
        }
    }
}
