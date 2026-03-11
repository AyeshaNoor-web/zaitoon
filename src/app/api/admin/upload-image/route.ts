import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Verify admin session first
  const token = (await cookies()).get('admin_session')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file       = formData.get('file') as File
  const menuItemId = formData.get('menuItemId') as string

  if (!file || !menuItemId) {
    return NextResponse.json({ error: 'Missing file or item ID' }, { status: 400 })
  }

  // Validate file
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, and WebP images allowed' },
      { status: 400 }
    )
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Image must be under 5MB' },
      { status: 400 }
    )
  }

  // Generate unique file name
  const ext      = file.name.split('.').pop()
  const fileName = `menu-items/${menuItemId}-${Date.now()}.${ext}`

  // Upload to Supabase Storage (bucket: menu-images)
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await adminSupabase.storage
    .from('menu-images')
    .upload(fileName, buffer, {
      contentType:  file.type,
      upsert:       true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: { publicUrl } } = adminSupabase.storage
    .from('menu-images')
    .getPublicUrl(fileName)

  // Update menu item in DB
  const { error: dbError } = await adminSupabase
    .from('menu_items')
    .update({ image_url: publicUrl })
    .eq('id', menuItemId)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, imageUrl: publicUrl })
}
