'use client'
import { useLayoutEffect, useSyncExternalStore } from 'react'
import { useCartStore } from './useCartStore'
import { useAuthStore } from './useAuthStore'
import { useLanguageStore } from './useLanguageStore'
import { useLocationStore } from './useLocationStore'

// Persisted stores are created with `skipHydration` so the first client render
// matches the server HTML. They are rehydrated from localStorage right after
// mount; components that depend on persisted values gate on `useHydrated()`.

let hydrated = false
const listeners = new Set<() => void>()

function hydrateStores() {
    if (hydrated) return
    useCartStore.persist.rehydrate()
    useAuthStore.persist.rehydrate()
    useLanguageStore.persist.rehydrate()
    useLocationStore.persist.rehydrate()
    hydrated = true
    listeners.forEach(l => l())
}

function subscribe(cb: () => void) {
    listeners.add(cb)
    return () => { listeners.delete(cb) }
}

export function useHydrated() {
    return useSyncExternalStore(subscribe, () => hydrated, () => false)
}

export function StoreHydrator() {
    useLayoutEffect(() => { hydrateStores() }, [])
    return null
}
