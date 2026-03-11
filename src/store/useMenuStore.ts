import { create } from 'zustand'
import { MENU_ITEMS } from '@/lib/mock/data'
import type { MenuItem } from '@/types'

interface MenuStore {
    items: MenuItem[]
    toggleAvailability: (id: string) => void
    updateItem: (id: string, updates: Partial<MenuItem>) => void
    addItem: (item: MenuItem) => void
    deleteItem: (id: string) => void
}

export const useMenuStore = create<MenuStore>(set => ({
    items: [...MENU_ITEMS],
    toggleAvailability: id => set(s => ({
        items: s.items.map(i => i.id === id ? { ...i, isAvailable: !i.isAvailable } : i)
    })),
    updateItem: (id, updates) => set(s => ({
        items: s.items.map(i => i.id === id ? { ...i, ...updates } : i)
    })),
    addItem: item => set(s => ({ items: [...s.items, item] })),
    deleteItem: id => set(s => ({ items: s.items.filter(i => i.id !== id) })),
}))
