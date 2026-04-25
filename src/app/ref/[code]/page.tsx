'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function ReferralPage({ params }: { params: { code: string } }) {
    const router = useRouter()
    const [referrerName, setReferrerName] = useState('')
    const [valid, setValid] = useState(false)

    useEffect(() => {
        const code = params.code.toUpperCase()

        // 1. Validate the referral code exists
        supabase
            .from('customers')
            .select('id, name')
            .eq('referral_code', code)
            .single()
            .then(({ data: referrer }) => {
                if (referrer) {
                    // 2. Save to localStorage for use at checkout
                    localStorage.setItem('zaitoon-referral-code', code)
                    localStorage.setItem('zaitoon-referrer-name', referrer.name ?? '')
                    setReferrerName(referrer.name ?? 'a friend')
                    setValid(true)
                } else {
                    // Invalid code — redirect silently
                    router.replace('/')
                }
            })

        // 3. Redirect to menu after 3 seconds
        const t = setTimeout(() => router.push('/menu'), 3000)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.code])

    if (!valid) return null

    return (
        <main style={{
            minHeight: '100vh',
            backgroundColor: '#1C2416',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 24,
            padding: 24,
        }}>
            <Image
                src="/logo-en.png"
                alt="Zaitoon"
                width={160}
                height={64}
                priority
                style={{ height: 64, width: 'auto', mixBlendMode: 'screen' }}
            />

            <h1 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 36,
                color: '#FCD34D',
                textAlign: 'center',
                margin: 0,
            }}>
                You were referred by {referrerName}! 🌿
            </h1>

            <p style={{
                color: 'rgba(253,248,240,0.7)',
                fontSize: 18,
                textAlign: 'center',
                maxWidth: 420,
                margin: 0,
                lineHeight: 1.6,
            }}>
                Place your first order and both of you earn{' '}
                <strong style={{ color: '#F59E0B' }}>50 loyalty points</strong> each!
            </p>

            {/* Animated dots */}
            <div style={{ display: 'flex', gap: 8 }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                    <span
                        key={i}
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#F59E0B',
                            display: 'inline-block',
                            animation: `bounce 1s ease-in-out ${delay}s infinite alternate`,
                        }}
                    />
                ))}
            </div>

            <p style={{ color: 'rgba(253,248,240,0.8)', fontSize: 14, margin: 0 }}>
                Redirecting to menu…
            </p>

            <style>{`
                @keyframes bounce {
                    from { transform: translateY(0); opacity: 0.4; }
                    to   { transform: translateY(-8px); opacity: 1; }
                }
            `}</style>
        </main>
    )
}
