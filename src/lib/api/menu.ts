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
        .select(`*, categories(label, icon)`)
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
        .select(`*, categories(label, icon)`)
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
