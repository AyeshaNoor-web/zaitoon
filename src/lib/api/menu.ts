import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function getCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

    if (error) throw error
    return data
}

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

// Admin only
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
    // Delete existing, then insert fresh (simple and reliable)
    await supabase.from('item_variants').delete().eq('menu_item_id', menuItemId)
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
