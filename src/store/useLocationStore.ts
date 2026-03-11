import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface LocationState {
  coords:            { lat: number; lng: number } | null
  nearestBranchId:   string | null
  nearestBranchName: string | null
  deliveryAddress:   string
  distanceKm:        number
  deliveryFee:       number
  outOfRange:        boolean
  locationSet:       boolean  // ← THIS is the key flag

  setLocation: (data: {
    coords:            { lat: number; lng: number }
    nearestBranchId:   string
    nearestBranchName: string
    deliveryAddress:   string
    distanceKm:        number
    deliveryFee:       number
    outOfRange:        boolean
  }) => void

  clearLocation: () => void
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      // Default values
      coords:            null,
      nearestBranchId:   null,
      nearestBranchName: null,
      deliveryAddress:   '',
      distanceKm:        0,
      deliveryFee:       60,
      outOfRange:        false,
      locationSet:       false,  // false = modal not yet completed

      setLocation: (data) => set({
        ...data,
        locationSet: true,  // ← set to true when user completes modal
      }),

      clearLocation: () => set({
        coords:            null,
        nearestBranchId:   null,
        nearestBranchName: null,
        deliveryAddress:   '',
        distanceKm:        0,
        deliveryFee:       60,
        outOfRange:        false,
        locationSet:       false,
      }),
    }),
    {
      name:    'zaitoon-location',        // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields — not the functions
      partialize: (state) => ({
        coords:            state.coords,
        nearestBranchId:   state.nearestBranchId,
        nearestBranchName: state.nearestBranchName,
        deliveryAddress:   state.deliveryAddress,
        distanceKm:        state.distanceKm,
        deliveryFee:       state.deliveryFee,
        outOfRange:        state.outOfRange,
        locationSet:       state.locationSet,
      }),
    }
  )
)

