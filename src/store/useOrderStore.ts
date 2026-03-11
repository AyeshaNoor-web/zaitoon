import { create } from 'zustand'
import type { Order } from '@/types'

interface OrderStore {
    currentOrder: Order | null
    orderHistory: Order[]
    setCurrentOrder: (order: Order) => void
    addToHistory: (order: Order) => void
}

export const useOrderStore = create<OrderStore>()(set => ({
    currentOrder: null,
    orderHistory: [],
    setCurrentOrder: order => set({ currentOrder: order }),
    addToHistory: order => set(state => ({ orderHistory: [order, ...state.orderHistory] })),
}))
