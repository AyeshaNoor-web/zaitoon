'use client'

import { useLanguageStore } from '@/store/useLanguageStore'
import { useEffect, useState } from 'react'

export function ClientLocalizationWrapper({ children }: { children: React.ReactNode }) {
    const { language, isRTL } = useLanguageStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Set HTML attributes
        document.documentElement.lang = language
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    }, [language, isRTL])

    if (!mounted) {
        return (
            <div style={{ fontFamily: "var(--font-body, system-ui, sans-serif)" }}>
                {children}
            </div>
        )
    }

    return (
        <div 
            dir={isRTL ? 'rtl' : 'ltr'} 
            style={{ 
                fontFamily: isRTL 
                    ? "var(--font-urdu, system-ui, sans-serif)" 
                    : "var(--font-body, system-ui, sans-serif)",
                transition: 'all 0.3s ease'
            }}
            className={isRTL ? 'urdu-page' : 'english-page'}
        >
            {children}
        </div>
    )
}
