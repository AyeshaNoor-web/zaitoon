import { createClient } from '@/lib/supabase/client'
import { 
  AboutPageContent, AboutValue, Chef, ChefInsert, ChefUpdate, 
  BlogPost, BlogPostInsert, BlogPostUpdate 
} from '@/types/about'

const supabase = createClient()

// ── Public Functions ─────────────────────────────────────────────────────────

export async function getAboutPageContent(): Promise<AboutPageContent> {
  const { data, error } = await supabase
    .from('about_page_content')
    .select('section_key, content_value')

  if (error) throw error
  
  const content: AboutPageContent = {}
  data.forEach((row) => {
    content[row.section_key] = row.content_value
  })
  return content
}

export async function getAboutValues(): Promise<AboutValue[]> {
  const { data, error } = await supabase
    .from('about_values')
    .select('*')
    .order('display_order')

  if (error) throw error
  return data as AboutValue[]
}

export async function getChefs(activeOnly = true): Promise<Chef[]> {
  let query = supabase.from('chefs').select('*').order('display_order')
  
  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Chef[]
}

export async function getBlogPosts(publishedOnly = true): Promise<BlogPost[]> {
  let query = supabase.from('blog_posts').select('*').order('display_order')
  
  if (publishedOnly) {
    query = query.eq('is_published', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as BlogPost[]
}

// ── Admin Functions ──────────────────────────────────────────────────────────

export async function updateAboutContent(key: string, value: string) {
  const { error } = await supabase
    .from('about_page_content')
    .upsert({ section_key: key, content_value: value, updated_at: new Date().toISOString() }, { onConflict: 'section_key' })
  
  if (error) throw error
}

export async function updateAboutValue(id: string, data: Partial<AboutValue>) {
  const { error } = await supabase
    .from('about_values')
    .update(data)
    .eq('id', id)
  
  if (error) throw error
}

export async function createChef(data: ChefInsert): Promise<Chef> {
  const { data: chef, error } = await supabase
    .from('chefs')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return chef as Chef
}

export async function updateChef(id: string, data: ChefUpdate): Promise<Chef> {
  const { data: chef, error } = await supabase
    .from('chefs')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return chef as Chef
}

export async function deleteChef(id: string) {
  const { error } = await supabase
    .from('chefs')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function createBlogPost(data: BlogPostInsert): Promise<BlogPost> {
  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return post as BlogPost
}

export async function updateBlogPost(id: string, data: BlogPostUpdate): Promise<BlogPost> {
  const { data: post, error } = await supabase
    .from('blog_posts')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return post as BlogPost
}

export async function deleteBlogPost(id: string) {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function toggleBlogPostPublished(id: string, is_published: boolean) {
  const { error } = await supabase
    .from('blog_posts')
    .update({ is_published, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
