import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface FAQ {
    id: string
    question: string
    question_ur: string | null
    answer: string
    answer_ur: string | null
    is_active: boolean
    display_order: number
    created_at: string
    updated_at: string
}

export async function getFAQs(activeOnly = true): Promise<FAQ[]> {
    let query = supabase.from('faqs').select('*').order('display_order')
    if (activeOnly) query = query.eq('is_active', true)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as FAQ[]
}

export async function createFAQ(payload: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>): Promise<FAQ> {
    const { data, error } = await supabase
        .from('faqs')
        .insert({ ...payload, updated_at: new Date().toISOString() })
        .select()
        .single()
    if (error) throw error
    return data as FAQ
}

export async function updateFAQ(id: string, updates: Partial<Omit<FAQ, 'id' | 'created_at'>>): Promise<FAQ> {
    const { data, error } = await supabase
        .from('faqs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data as FAQ
}

export async function deleteFAQ(id: string): Promise<void> {
    const { error } = await supabase.from('faqs').delete().eq('id', id)
    if (error) throw error
}
