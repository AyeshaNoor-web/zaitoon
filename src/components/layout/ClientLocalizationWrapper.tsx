'use client'

import { useEffect } from 'react'
import { useLanguageStore } from '@/store/useLanguageStore'

export function ClientLocalizationWrapper({ children }: { children: React.ReactNode }) {
    const { language, isRTL } = useLanguageStore()

    useEffect(() => {
        document.documentElement.lang = language
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    }, [language, isRTL])

    return (
        <div
            dir={isRTL ? 'rtl' : 'ltr'}
            style={{ fontFamily: isRTL ? 'var(--font-urdu)' : 'var(--font-body)' }}
            className={isRTL ? 'urdu-page' : undefined}
        >
            {children}
        </div>
    )
}
