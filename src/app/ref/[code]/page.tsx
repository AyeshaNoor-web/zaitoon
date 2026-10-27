'use client'
import { useState, useEffect, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Gift, Loader2 } from 'lucide-react'

export default function ReferralPage({ params }: { params: Promise<{ code: string }> }) {
    const { code: rawCode } = use(params)
    const router = useRouter()
    const [state, setState] = useState<{ status: 'checking' | 'valid' | 'invalid'; name?: string }>({ status: 'checking' })

    useEffect(() => {
        const code = rawCode.toUpperCase()
        let timer: ReturnType<typeof setTimeout> | undefined

        fetch(`/api/referral/${encodeURIComponent(code)}`)
            .then(res => res.json())
            .then(({ valid, name }: { valid: boolean; name: string | null }) => {
                if (!valid) { setState({ status: 'invalid' }); return }
                localStorage.setItem('zaitoon-referral-code', code)
                localStorage.setItem('zaitoon-referrer-name', name ?? '')
                setState({ status: 'valid', name: name || 'A friend' })
                timer = setTimeout(() => router.push('/menu'), 3500)
            })
            .catch(() => setState({ status: 'invalid' }))

        return () => { if (timer) clearTimeout(timer) }
    }, [rawCode, router])

    return (
        <main id="main" className="surface-dark grain flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
            <Image src="/logo-light.png" alt="Zaitoon" width={583} height={220} priority className="h-12 w-auto" />

            {state.status === 'checking' && (
                <Loader2 className="mt-14 h-6 w-6 animate-spin text-paper/60" aria-label="Checking your invite" />
            )}

            {state.status === 'valid' && (
                <div className="mt-12 max-w-lg">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-500 text-white">
                        <Gift className="h-6 w-6" />
                    </span>
                    <h1 className="mt-6 text-paper">{state.name} invited you to Zaitoon.</h1>
                    <p className="mx-auto mt-5 max-w-md text-lg text-paper/75">
                        Place your first order and you&apos;ll both get <strong className="text-paper">50 loyalty points</strong>.
                    </p>
                    <Link href="/menu" className="btn-primary mt-9 h-14 px-8 text-base">See the menu</Link>
                    <p className="mt-4 text-sm text-paper/50">Taking you there in a moment…</p>
                </div>
            )}

            {state.status === 'invalid' && (
                <div className="mt-12 max-w-md">
                    <h1 className="text-paper">This invite link isn&apos;t valid.</h1>
                    <p className="mt-4 text-paper/70">It may have been mistyped. You can still order and start earning points.</p>
                    <Link href="/menu" className="btn-primary mt-8">Go to the menu</Link>
                </div>
            )}
        </main>
    )
}
