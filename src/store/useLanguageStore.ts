import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Language = 'en' | 'ur'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
  isRTL: boolean
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      isRTL: false,
      setLanguage: (lang) => set({ 
        language: lang, 
        isRTL: lang === 'ur' 
      }),
    }),
    {
      name: 'language-storage',
    }
  )
)
