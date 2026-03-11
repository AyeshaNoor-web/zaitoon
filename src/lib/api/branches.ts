import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function getBranches() {
    const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('created_at')

    if (error) throw error
    return data
}

export async function getBranchById(id: string) {
    const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}
