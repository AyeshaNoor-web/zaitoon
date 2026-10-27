import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/adminSession'

export async function POST(req: NextRequest) {
  // Verify admin session first
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file       = formData.get('file') as File
  const menuItemId = formData.get('menuItemId') as string

  if (!file || !menuItemId) {
    return NextResponse.json({ error: 'Missing file or item ID' }, { status: 400 })
  }

  // Validate file
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'model/gltf-binary', 'model/gltf+json']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, WebP images, and GLB/GLTF models allowed' },
      { status: 400 }
    )
  }
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File must be under 50MB' },
      { status: 400 }
    )
  }

  // Generate unique file name
  const EXT: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
    'model/gltf-binary': 'glb', 'model/gltf+json': 'gltf',
  }
  const ext      = EXT[file.type]
  const safeId   = menuItemId.replace(/[^a-zA-Z0-9_-]/g, '')
  const fileName = `menu-items/${safeId}-${Date.now()}.${ext}`

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
