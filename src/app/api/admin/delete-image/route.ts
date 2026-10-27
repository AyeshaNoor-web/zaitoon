import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/adminSession'

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
