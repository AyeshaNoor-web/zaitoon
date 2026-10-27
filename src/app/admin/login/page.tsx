'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function AdminLoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [shake, setShake] = useState(0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username.trim() || !password.trim() || loading) return

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Login failed')
                setPassword('')
                setShake(s => s + 1)
                return
            }

            document.cookie = `admin_role=${data.role}; path=/; max-age=${60 * 60 * 8}; samesite=strict`
            document.cookie = `admin_name=${encodeURIComponent(data.name)}; path=/; max-age=${60 * 60 * 8}; samesite=strict`

            // Return to the page the middleware bounced us from — internal admin paths only
            const from = new URLSearchParams(window.location.search).get('from')
            const safeFrom = from && from.startsWith('/admin') && !from.startsWith('/admin/login') && !from.includes('//') ? from : null
            router.push(safeFrom ?? (data.role === 'owner' ? '/admin' : '/admin/orders'))
        } catch {
            setError('Connection failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main id="main" className="surface-dark grain flex min-h-[100svh] items-center justify-center px-5 py-12">
            <motion.div
                key={shake}
                animate={shake ? { x: [-10, 10, -7, 7, -3, 3, 0] } : {}}
                transition={{ duration: 0.45 }}
                className="w-full max-w-[400px]"
            >
                <div className="mb-8 flex justify-center">
                    <Image src="/logo-light.png" alt="Zaitoon" width={583} height={220} priority className="h-12 w-auto" />
                </div>

                <div className="rounded-[28px] bg-paper p-8 text-ink shadow-[var(--shadow-float)]">
                    <h1 className="text-[2rem]">Staff sign in</h1>
                    <p className="mt-1.5 text-sm text-ink-2">Orders, menu and settings for Zaitoon branches.</p>

                    <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
                        <div>
                            <label htmlFor="admin-username" className="field-label">Username</label>
                            <input
                                id="admin-username"
                                type="text"
                                value={username}
                                onChange={e => { setUsername(e.target.value); setError('') }}
                                autoComplete="username"
                                autoCapitalize="none"
                                spellCheck={false}
                                aria-invalid={!!error}
                                className="field"
                            />
                        </div>
                        <div>
                            <label htmlFor="admin-password" className="field-label">Password</label>
                            <input
                                id="admin-password"
                                type="password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError('') }}
                                autoComplete="current-password"
                                aria-invalid={!!error}
                                aria-describedby={error ? 'admin-login-error' : undefined}
                                className="field"
                            />
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    id="admin-login-error"
                                    role="alert"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-sm font-medium text-danger"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading || !username.trim() || !password.trim()}
                            className="btn-primary !mt-6 w-full"
                        >
                            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign in'}
                        </button>
                    </form>
                </div>

                <Link href="/" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-paper/60 hover:text-paper">
                    <ArrowLeft className="h-4 w-4" /> Back to the website
                </Link>
            </motion.div>
        </main>
    )
}
