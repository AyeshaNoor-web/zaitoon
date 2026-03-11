'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'

interface Props {
  menuItemId: string
  currentImageUrl: string | null
  itemName: string
  onImageUpdated: (newUrl: string | null) => void
}

export default function MenuImageUpload({
  menuItemId, currentImageUrl, itemName, onImageUpdated
}: Props) {
  const [uploading, setUploading]   = useState(false)
  const [deleting,  setDeleting]    = useState(false)
  const [preview,   setPreview]     = useState<string | null>(currentImageUrl)
  const [error,     setError]       = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('menuItemId', menuItemId)

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body:   formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setPreview(data.imageUrl)
      onImageUpdated(data.imageUrl)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
      setPreview(currentImageUrl)  // revert preview
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Remove image from "${itemName}"?`)) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/delete-image', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ menuItemId, imageUrl: preview }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(null)
      onImageUpdated(null)
    } catch (err: any) {
      setError(err.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Image Preview */}
      <div style={{
        width: '100%', aspectRatio: '4/3',
        backgroundColor: '#F5EDD8',
        border: '2px dashed #EDE0C4',
        borderRadius: 8, overflow: 'hidden',
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {preview ? (
          <Image
            src={preview}
            alt={itemName}
            fill
            style={{ objectFit: 'cover' }}
            unoptimized={preview.startsWith('blob:')}
          />
        ) : (
          <div style={{
            textAlign: 'center', color: '#1C1917', fontSize: 13,
          }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>🖼️</div>
            No image
          </div>
        )}

        {/* Upload overlay on hover */}
        {!uploading && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(28,36,22,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s',
              cursor: 'pointer', color: 'white',
              fontSize: 13, fontWeight: 600,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
          >
            📷 Click to change
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(28,36,22,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#F59E0B', fontSize: 13, fontWeight: 600,
          }}>
            Uploading...
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || deleting}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#D97706',
            color: '#1C2416',
            border: 'none',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 700,
            cursor: uploading ? 'wait' : 'pointer',
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? 'Uploading...' : '📤 Upload Image'}
        </button>

        {/* Delete button — only show if image exists */}
        {preview && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading || deleting}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              color: '#B91C1C',
              border: '2px solid #B91C1C',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              cursor: deleting ? 'wait' : 'pointer',
              opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting ? '...' : '🗑️ Remove'}
          </button>
        )}
      </div>

      {/* File size hint */}
      <p style={{ fontSize: 11, color: '#78716C', margin: 0 }}>
        JPEG, PNG or WebP · Max 5MB
      </p>

      {/* Error */}
      {error && (
        <p role="alert" style={{ fontSize: 12, color: '#B91C1C', margin: 0 }}>
          ⚠️ {error}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleUpload}
        aria-label={`Upload image for ${itemName}`}
      />
    </div>
  )
}
