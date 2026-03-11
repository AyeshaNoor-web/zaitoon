import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
    id: string          // menuItem.id + size (e.g. "uuid-large")
    menuItemId: string
    name: string
    size: 'small' | 'large' | null
    unitPrice: number   // LOCKED at time of adding — price changes in DB don't affect active cart
    quantity: number
    subtotal: number    // unitPrice × quantity — always recalculated, never stored separately
    imageUrl: string | null
}

interface CartStore {
    items: CartItem[]
    branchId: string | null        // which branch this cart belongs to
    orderType: 'delivery' | 'takeaway' | 'dine-in' | null
    deliveryFee: number
    loyaltyPointsToRedeem: number

    // Computed (not stored — derived from items)
    itemCount: () => number        // sum of all quantities
    subtotal: () => number         // sum of all item subtotals
    isEmpty: () => boolean
    total: () => number

    // Actions
    addItem: (item: Omit<CartItem, 'id' | 'subtotal'>) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    clearCart: () => void
    setBranch: (branchId: string) => void
    setOrderType: (type: 'delivery' | 'takeaway' | 'dine-in') => void
    setDeliveryFee: (fee: number) => void
    setLoyaltyPointsToRedeem: (points: number) => void
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            branchId: null,
            orderType: null,
            deliveryFee: 0,
            loyaltyPointsToRedeem: 0,

            itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
            isEmpty: () => get().items.length === 0,
            total: () => get().subtotal() + get().deliveryFee - get().loyaltyPointsToRedeem,

            addItem: (newItem) => {
                const id = `${newItem.menuItemId}-${newItem.size ?? 'default'}`
                set(state => {
                    const existing = state.items.find(i => i.id === id)
                    if (existing) {
                        // INCREMENT quantity — don't add duplicate
                        return {
                            items: state.items.map(i => i.id === id
                                ? {
                                    ...i,
                                    quantity: i.quantity + newItem.quantity,
                                    subtotal: (i.quantity + newItem.quantity) * i.unitPrice
                                }
                                : i
                            )
                        }
                    }
                    return {
                        items: [...state.items, {
                            ...newItem,
                            id,
                            subtotal: newItem.unitPrice * newItem.quantity,
                        }]
                    }
                })
            },

            removeItem: (id) =>
                set(state => ({ items: state.items.filter(i => i.id !== id) })),

            updateQuantity: (id, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(id)
                    return
                }
                set(state => ({
                    items: state.items.map(i => i.id === id
                        ? { ...i, quantity, subtotal: quantity * i.unitPrice }
                        : i
                    )
                }))
            },

            clearCart: () => set({ items: [], branchId: null, orderType: null, deliveryFee: 0, loyaltyPointsToRedeem: 0 }),
            setBranch: (branchId) => set({ branchId }),
            setOrderType: (type) => set({ orderType: type }),
            setDeliveryFee: (fee) => set({ deliveryFee: fee }),
            setLoyaltyPointsToRedeem: (points) => set({ loyaltyPointsToRedeem: points })
        }),
        {
            name: 'zaitoon-cart',
            // Only persist items and branchId — not computed functions
            partialize: (state) => ({
                items: state.items,
                branchId: state.branchId,
                orderType: state.orderType,
                deliveryFee: state.deliveryFee,
                loyaltyPointsToRedeem: state.loyaltyPointsToRedeem
            }),
        }
    )
)
