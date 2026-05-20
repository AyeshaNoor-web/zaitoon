'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminSession {
  role: 'owner' | 'employee' | null
  name: string
  branchId?: string | null
  loading: boolean
  isOwner: boolean
  isEmployee: boolean
}

export function useAdminRole(): AdminSession {
  const [role, setRole]     = useState<'owner' | 'employee' | null>(null)
  const [name, setName]     = useState('')
  const [branchId, setBranchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/me')
      .then(async res => {
        if (res.status === 401) {
          router.push('/admin/login')
          return
        }
        const data = await res.json()
        setRole(data.role)
        setName(data.name)
        setBranchId(data.branchId)
      })
      .catch(() => {
        router.push('/admin/login')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [router])

  return {
    role,
    name,
    branchId,
    loading,
    isOwner:    role === 'owner',
    isEmployee: role === 'employee',
  }
}
