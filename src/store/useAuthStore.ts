import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sendOTP, verifyOTP } from '@/lib/auth/phoneAuth'

interface AuthStore {
  customer: {
    id: string; phone: string; name: string
    loyaltyPoints: number; tier: string
    referralCode: string
    totalOrders: number
    totalSpent: number
  } | null
  isAuthenticated: boolean
  isLoading: boolean

  sendOTP:   (phone: string) => Promise<void>
  verifyOTP: (code: string, name?: string) => Promise<void>
  signOut:   () => void
  updateProfile: (name: string) => Promise<void>
  refreshCustomer: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      customer:        null,
      isAuthenticated: false,
      isLoading:       false,

      sendOTP: async (phone) => {
        set({ isLoading: true })
        try {
          await sendOTP(phone)
        } finally {
          set({ isLoading: false })
        }
      },

      verifyOTP: async (code, name) => {
        set({ isLoading: true })
        try {
          const idToken = await verifyOTP(code)
          const res = await fetch('/api/auth/verify-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken, name }),
          })
          const { customer } = await res.json()
          set({
            customer: {
              id:            customer.id,
              phone:         customer.phone,
              name:          customer.name,
              loyaltyPoints: customer.loyalty_points,
              tier:          customer.tier,
              referralCode:  customer.referral_code,
              totalOrders:   customer.total_orders || 0,
              totalSpent:    customer.total_spent || 0,
            },
            isAuthenticated: true,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      signOut: () => {
        set({ customer: null, isAuthenticated: false })
      },

      updateProfile: async (name) => {
        const customer = get().customer
        if (!customer) return
        await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: customer.id, name }),
        })
        set(state => ({
          customer: state.customer ? { ...state.customer, name } : null
        }))
      },

      refreshCustomer: async () => {
        const customer = get().customer
        if (!customer) return
        try {
          const res = await fetch(`/api/auth/me?phone=${encodeURIComponent(customer.phone)}`)
          if (res.ok) {
            const data = await res.json()
            if (data.customer) {
              set({
                customer: {
                  id: data.customer.id,
                  phone: data.customer.phone,
                  name: data.customer.name,
                  loyaltyPoints: data.customer.loyalty_points,
                  tier: data.customer.tier,
                  referralCode: data.customer.referral_code,
                  totalOrders: data.customer.total_orders || 0,
                  totalSpent: data.customer.total_spent || 0,
                }
              })
            }
          }
        } catch {}
      },
    }),
    { name: 'zaitoon-auth' }
  )
)
