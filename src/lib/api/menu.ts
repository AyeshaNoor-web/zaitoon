import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// ── Categories ──────────────────────────────────────────────────────────────

export async function getCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

    if (error) throw error
    return data
}

// ── Menu Items ───────────────────────────────────────────────────────────────

export async function getMenuItems(categoryId?: string) {
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
    return data
}

// Admin-facing — all items including unavailable ones
export async function getAllMenuItemsAdmin() {
    const { data, error } = await supabase
        .from('menu_items')
        .select(`*, categories(label, icon), item_variants(id, label, price, display_order)`)
        .order('display_order')

    if (error) throw error
    return data
}

export async function getMenuItemById(id: string) {
    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}

export async function searchMenuItems(query: string) {
    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_available', true)

    if (error) throw error
    return data
}

// ── Admin Menu Item CRUD ─────────────────────────────────────────────────────

export async function updateMenuItemAvailability(id: string, isAvailable: boolean) {
    const { error } = await supabase
        .from('menu_items')
        .update({ is_available: isAvailable })
        .eq('id', id)

    if (error) throw error
}

export async function updateMenuItem(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function createMenuItem(item: Record<string, unknown>) {
    const { data, error } = await supabase
        .from('menu_items')
        .insert(item)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteMenuItem(id: string) {
    const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// ── Category Admin CRUD ─────────────────────────────────────────────────────

export async function createCategory(payload: { label: string; icon?: string; display_order?: number }) {
    const { data, error } = await supabase
        .from('categories')
        .insert({ ...payload, is_active: true })
        .select()
        .single()
    if (error) throw error
    return data
}

export async function updateCategory(id: string, updates: { label?: string; icon?: string }) {
    const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

export async function deleteCategory(id: string) {
    const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id)
    if (error) throw error
}

// ── Item Variants ───────────────────────────────────────────────────────────

export async function getItemVariants(menuItemId: string) {
    const { data, error } = await supabase
        .from('item_variants')
        .select('*')
        .eq('menu_item_id', menuItemId)
        .order('display_order')
    if (error) throw error
    return data ?? []
}

export async function upsertItemVariants(
    menuItemId: string,
    variants: { id?: string; label: string; price: number }[]
) {
    // Delete existing rows for this item, then re-insert fresh
    const { error: delErr } = await supabase
        .from('item_variants')
        .delete()
        .eq('menu_item_id', menuItemId)
    if (delErr) throw delErr

    if (variants.length === 0) return []

    const rows = variants.map((v, i) => ({
        menu_item_id: menuItemId,
        label: v.label,
        price: v.price,
        display_order: i,
    }))
    const { data, error } = await supabase.from('item_variants').insert(rows).select()
    if (error) throw error
    return data
}

// ── Site Content (CMS) ──────────────────────────────────────────────────────

/** Fetch all site content key-value pairs as a flat Record */
export async function getSiteContent(): Promise<Record<string, string>> {
    const { data, error } = await supabase
        .from('site_content')
        .select('key, value')
    if (error) throw error
    const map: Record<string, string> = {}
    ;(data ?? []).forEach((row: any) => { map[row.key] = row.value })
    return map
}

/** Upsert a single site content value */
export async function updateSiteContent(key: string, value: string) {
    const { error } = await supabase
        .from('site_content')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) throw error
}

/** Upsert multiple site content values at once */
export async function updateSiteContentBulk(entries: Record<string, string>) {
    const rows = Object.entries(entries).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase
        .from('site_content')
        .upsert(rows, { onConflict: 'key' })
    if (error) throw error
}

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
    let query = supabase
        .from('popular_combos')
        .select('*')
        .order('display_order')
    if (activeOnly) query = query.eq('is_active', true)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as PopularCombo[]
}

export async function createPopularCombo(payload: Omit<PopularCombo, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
        .from('popular_combos')
        .insert({ ...payload, updated_at: new Date().toISOString() })
        .select()
        .single()
    if (error) throw error
    return data as PopularCombo
}

export async function updatePopularCombo(id: string, updates: Partial<Omit<PopularCombo, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
        .from('popular_combos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data as PopularCombo
}

export async function deletePopularCombo(id: string) {
    const { error } = await supabase
        .from('popular_combos')
        .delete()
        .eq('id', id)
    if (error) throw error
}
