import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface Customer {
  id:            string
  phone:         string
  name:          string
  loyaltyPoints: number
  tier:          'bronze' | 'silver' | 'gold' | 'platinum'
  referralCode:  string
  totalOrders:   number
}

interface AuthStore {
  customer:        Customer | null
  isAuthenticated: boolean

  // Called at checkout Step 1 on phone blur
  lookupOrCreateCustomer: (phone: string, name: string) => Promise<Customer>

  // Called after order is placed successfully
  refreshCustomer: (phone: string) => Promise<void>

  // Called from account page or sign out button
  signOut: () => void

  // Update name locally after profile edit
  updateName: (name: string) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      customer:        null,
      isAuthenticated: false,

      lookupOrCreateCustomer: async (phone, name) => {
        // Format phone to +92 format
        const formatted = phone
          .replace(/\s/g, '')
          .replace(/^0/, '+92')
          .replace(/^\+?92/, '+92')

        const res = await fetch('/api/auth/lookup-customer', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ phone: formatted, name }),
        })

        if (!res.ok) throw new Error('Failed to lookup customer')
        const { customer } = await res.json()

        const mapped: Customer = {
          id:            customer.id,
          phone:         customer.phone,
          name:          customer.name,
          loyaltyPoints: customer.loyalty_points,
          tier:          customer.tier,
          referralCode:  customer.referral_code,
          totalOrders:   customer.total_orders,
        }

        set({ customer: mapped, isAuthenticated: true })
        return mapped
      },

      refreshCustomer: async (phone) => {
        const formatted = phone
          .replace(/\s/g, '')
          .replace(/^0/, '+92')
          .replace(/^\+?92/, '+92')

        const res = await fetch('/api/auth/lookup-customer', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ phone: formatted, name: '' }),
        })

        if (!res.ok) return
        const { customer } = await res.json()

        set(state => ({
          customer: state.customer ? {
            ...state.customer,
            loyaltyPoints: customer.loyalty_points,
            tier:          customer.tier,
            totalOrders:   customer.total_orders,
          } : null
        }))
      },

      signOut: () => set({ customer: null, isAuthenticated: false }),

      updateName: (name) => set(state => ({
        customer: state.customer ? { ...state.customer, name } : null
      })),
    }),
    {
      name:    'zaitoon-customer',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customer:        state.customer,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
