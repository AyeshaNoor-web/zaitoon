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

interface ApiCustomer {
  id: string
  phone: string
  name: string
  loyalty_points: number
  tier: Customer['tier']
  referral_code: string
  total_orders: number
}

export type LookupResult =
  | { verified: true; isNew: boolean; customer: Customer }
  | { verified: false; exists: boolean }

interface AuthStore {
  // Display copy of the customer. The source of truth is the httpOnly device
  // session cookie — the server decides who is signed in, not localStorage.
  customer:        Customer | null
  isAuthenticated: boolean

  /** Checkout phone step. Signs in only if this device is verified (or the number is new). */
  lookupOrCreateCustomer: (phone: string, name: string) => Promise<LookupResult>
  /** Re-sync points/tier with the server session. */
  refreshCustomer: () => Promise<void>
  signOut: () => void
  updateName: (name: string) => void
}

const mapCustomer = (c: ApiCustomer): Customer => ({
  id:            c.id,
  phone:         c.phone,
  name:          c.name,
  loyaltyPoints: c.loyalty_points ?? 0,
  tier:          c.tier ?? 'bronze',
  referralCode:  c.referral_code,
  totalOrders:   c.total_orders ?? 0,
})

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      customer:        null,
      isAuthenticated: false,

      lookupOrCreateCustomer: async (phone, name) => {
        const res = await fetch('/api/auth/lookup-customer', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ phone, name }),
        })
        if (!res.ok) throw new Error('Failed to look up customer')
        const body = await res.json()

        if (!body.verified) return { verified: false, exists: !!body.exists }

        const customer = mapCustomer(body.customer)
        set({ customer, isAuthenticated: true })
        return { verified: true, isNew: !!body.isNew, customer }
      },

      refreshCustomer: async () => {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const { customer } = await res.json()
          set({ customer: mapCustomer(customer), isAuthenticated: true })
          return
        }
        if (res.status !== 401) return // network/server hiccup — keep what we have

        // Signed in before device sessions existed: exchange the stored id+phone
        // for a session cookie once. If that fails, this device isn't verified.
        const legacy = get().customer
        if (legacy?.id && legacy.phone) {
          const claim = await fetch('/api/auth/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: legacy.id, phone: legacy.phone }),
          })
          if (claim.ok) {
            const { customer } = await claim.json()
            set({ customer: mapCustomer(customer), isAuthenticated: true })
            return
          }
        }
        set({ customer: null, isAuthenticated: false })
      },

      signOut: () => {
        set({ customer: null, isAuthenticated: false })
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      },

      updateName: (name) => set(state => ({
        customer: state.customer ? { ...state.customer, name } : null
      })),
    }),
    {
      name:    'zaitoon-customer',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        customer:        state.customer,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
