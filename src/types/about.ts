export interface AboutPageContent {
  [key: string]: string
}

export interface AboutValue {
  id: string
  icon: string
  title: string
  description: string
  display_order: number
}

export interface Chef {
  id: string
  name: string
  title: string
  experience_years: number
  bio: string
  photo_url: string | null
  specialties: string[]
  instagram_url: string | null
  facebook_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface BlogPost {
  id: string
  cover_image_url: string | null
  category: string
  title: string
  excerpt: string
  body: string | null
  published_date: string
  is_published: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export type ChefInsert = Omit<Chef, 'id' | 'created_at'>
export type ChefUpdate = Partial<ChefInsert>
export type BlogPostInsert = Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>
export type BlogPostUpdate = Partial<BlogPostInsert>
