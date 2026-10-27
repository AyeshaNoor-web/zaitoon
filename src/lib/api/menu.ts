import { createClient } from '@/lib/supabase/client'
import { adminCall } from '@/lib/api/adminClient'
import type { MenuItem, Category, MenuItemVariant } from '@/types'

const supabase = createClient()

// Public catalog reads use the anon key. Every write and admin-only read goes
// through /api/admin/rpc, which checks the admin session on the server.

// ── Categories ──────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

    if (error) throw error
    return (data || []) as Category[]
}

// ── Menu Items ───────────────────────────────────────────────────────────────

export async function getMenuItems(categoryId?: string): Promise<MenuItem[]> {
    let query = supabase
        .from('menu_items')
        .select(`*, categories(label, icon), item_variants(id, label, price, display_order)`)
        .eq('is_available', true)
        .order('display_order')

    if (categoryId) {
        query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as MenuItem[]
}

// ── Admin ────────────────────────────────────────────────────────────────────

export const getAllMenuItemsAdmin = () => adminCall<MenuItem[]>('menu.listAll')
export const updateMenuItemAvailability = (id: string, isAvailable: boolean) => adminCall('menu.setAvailability', id, isAvailable)
export const updateMenuItem = (id: string, updates: Record<string, unknown>) => adminCall<MenuItem>('menu.update', id, updates)
export const createMenuItem = (item: Record<string, unknown>) => adminCall<MenuItem>('menu.create', item)
export const deleteMenuItem = (id: string) => adminCall('menu.delete', id)

export const createCategory = (payload: { label: string; icon?: string; display_order?: number }) =>
    adminCall<Category>('categories.create', payload)
export const updateCategory = (id: string, updates: { label?: string; icon?: string; display_order?: number }) =>
    adminCall<Category>('categories.update', id, updates)
export const deleteCategory = (id: string) => adminCall('categories.delete', id)

export const getItemVariants = (menuItemId: string) => adminCall<MenuItemVariant[]>('variants.list', menuItemId)
export const upsertItemVariants = (menuItemId: string, variants: { id?: string; label: string; price: number }[]) =>
    adminCall<MenuItemVariant[]>('variants.replace', menuItemId, variants)

// ── Site Content (CMS) ──────────────────────────────────────────────────────

/** Fetch all site content key-value pairs as a flat Record */
export async function getSiteContent(): Promise<Record<string, string>> {
    const { data, error } = await supabase
        .from('site_content')
        .select('key, value')
    if (error) throw error
    const map: Record<string, string> = {}
    ;(data ?? []).forEach((row: { key: string, value: string }) => { map[row.key] = row.value })
    return map
}

export const updateSiteContentBulk = (entries: Record<string, string>) => adminCall('content.updateBulk', entries)

// ── Popular Combos (CMS) ─────────────────────────────────────────────────────

export interface PopularCombo {
    id: string
    name: string
    description: string | null
    price: number | null
    image_url: string | null
    is_active: boolean
    display_order: number
    created_at: string
    updated_at: string
}

export async function getPopularCombos(activeOnly = true): Promise<PopularCombo[]> {
    if (!activeOnly) return adminCall<PopularCombo[]>('combos.list')
    const { data, error } = await supabase
        .from('popular_combos')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
    if (error) throw error
    return (data ?? []) as PopularCombo[]
}

export const createPopularCombo = (payload: Omit<PopularCombo, 'id' | 'created_at' | 'updated_at'>) =>
    adminCall<PopularCombo>('combos.create', payload)
export const updatePopularCombo = (id: string, updates: Partial<Omit<PopularCombo, 'id' | 'created_at'>>) =>
    adminCall<PopularCombo>('combos.update', id, updates)
export const deletePopularCombo = (id: string) => adminCall('combos.delete', id)
