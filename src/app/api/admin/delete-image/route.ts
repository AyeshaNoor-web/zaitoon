import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const token = (await cookies()).get('admin_session')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { menuItemId, imageUrl } = await req.json()
  if (!menuItemId) {
    return NextResponse.json({ error: 'Missing item ID' }, { status: 400 })
  }

  // Extract file path from URL for storage deletion
  if (imageUrl) {
    const urlParts  = imageUrl.split('/menu-images/')
    const filePath  = urlParts[1]  // e.g. "menu-items/uuid-timestamp.jpg"
    if (filePath) {
      await adminSupabase.storage
        .from('menu-images')
        .remove([filePath])
      // Don't throw if delete fails — image may not be in our bucket
    }
  }

  // Set image_url to null in DB
  const { error } = await adminSupabase
    .from('menu_items')
    .update({ image_url: null })
    .eq('id', menuItemId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
