import { createClient } from '@/lib/supabase/client'
import { adminCall } from '@/lib/api/adminClient'

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

/** Public: active FAQs. Admin (activeOnly = false): every FAQ, via the admin API. */
export async function getFAQs(activeOnly = true): Promise<FAQ[]> {
    if (!activeOnly) return adminCall<FAQ[]>('faqs.list')
    const { data, error } = await supabase.from('faqs').select('*').eq('is_active', true).order('display_order')
    if (error) throw error
    return (data ?? []) as FAQ[]
}

export const createFAQ = (payload: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) => adminCall<FAQ>('faqs.create', payload)
export const updateFAQ = (id: string, updates: Partial<Omit<FAQ, 'id' | 'created_at'>>) => adminCall<FAQ>('faqs.update', id, updates)
export const deleteFAQ = (id: string) => adminCall('faqs.delete', id)
