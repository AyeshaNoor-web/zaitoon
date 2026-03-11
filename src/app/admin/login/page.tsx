'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminLoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [shake, setShake] = useState(false)

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
                setShake(true)
                setTimeout(() => setShake(false), 500)
                return
            }

            document.cookie = `admin_role=${data.role}; path=/; max-age=${60 * 60 * 8}`
            document.cookie = `admin_name=${encodeURIComponent(data.name)}; path=/; max-age=${60 * 60 * 8}`

            if (data.role === 'owner') {
                router.push('/admin')
            } else {
                router.push('/admin/orders')
            }
        } catch {
            setError('Connection error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main
            role="main"
            className="min-h-screen flex items-center justify-center px-4"
            style={{ backgroundColor: '#1C2416' }}
        >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5"
                    style={{ background: 'radial-gradient(circle, #C9920A, transparent)' }} />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5"
                    style={{ background: 'radial-gradient(circle, #556B2F, transparent)' }} />
            </div>

            <motion.div
                role="dialog"
                aria-label="Admin Login"
                aria-modal="true"
                animate={shake ? { x: [-12, 12, -10, 10, -6, 6, -3, 3, 0] } : {}}
                transition={{ duration: 0.55 }}
                className="relative w-full max-w-[420px] rounded-2xl border p-8 shadow-2xl"
                style={{
                    backgroundColor: '#253219',
                    borderColor: 'rgba(201,146,10,0.25)',
                }}
            >
                {/* Logo */}
                <div className="flex justify-center mb-7">
                    <Image
                        src="/logo-en.png"
                        alt="Zaitoon logo"
                        width={200}
                        height={60}
                        priority
                        className="h-16 w-auto object-contain"
                        style={{ mixBlendMode: 'screen' }}
                    />
                </div>

                {/* Heading */}
                <h1
                    className="text-center font-display text-2xl font-bold mb-1"
                    style={{ color: '#F5EDDB' }}
                >
                    Admin Portal
                </h1>
                <p className="text-center text-sm mb-8" style={{ color: 'rgba(245,237,219,0.45)' }}>
                    Enter credentials to access dashboard
                </p>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div>
                        <label htmlFor="admin-username" className="block text-sm mb-1.5" style={{ color: '#F5EDDB' }}>
                            👤 Username
                        </label>
                        <input
                            id="admin-username"
                            type="text"
                            value={username}
                            onChange={e => { setUsername(e.target.value); setError('') }}
                            placeholder="e.g. owner"
                            autoComplete="username"
                            className="w-full rounded-xl px-4 py-3.5 text-center text-[17px] tracking-widest font-mono outline-none transition-all border-2"
                            style={{
                                backgroundColor: '#1C2416',
                                borderColor: error
                                    ? '#ef4444'
                                    : 'rgba(201,146,10,0.3)',
                                color: '#F5EDDB',
                            }}
                            onFocus={e => {
                                if (!error) e.currentTarget.style.borderColor = '#C9920A'
                            }}
                            onBlur={e => {
                                if (!error) e.currentTarget.style.borderColor = 'rgba(201,146,10,0.3)'
                            }}
                        />
                    </div>
                    <div>
                        <label htmlFor="admin-password" className="block text-sm mb-1.5" style={{ color: '#F5EDDB' }}>
                            🔒 Password
                        </label>
                        <input
                            id="admin-password"
                            type="password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError('') }}
                            placeholder="••••••••••••"
                            autoComplete="current-password"
                            className="w-full rounded-xl px-4 py-3.5 text-center text-[17px] tracking-[0.25em] font-mono outline-none transition-all border-2"
                            style={{
                                backgroundColor: '#1C2416',
                                borderColor: error
                                    ? '#ef4444'
                                    : 'rgba(201,146,10,0.3)',
                                color: '#F5EDDB',
                            }}
                            onFocus={e => {
                                if (!error) e.currentTarget.style.borderColor = '#C9920A'
                            }}
                            onBlur={e => {
                                if (!error) e.currentTarget.style.borderColor = 'rgba(201,146,10,0.3)'
                            }}
                        />

                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    role="alert"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-2 text-center text-[12px] font-semibold text-red-400"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !username.trim() || !password.trim()}
                        className="w-full py-3.5 rounded-xl text-[14px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 cursor-pointer"
                        style={{
                            backgroundColor: '#C9920A',
                            color: '#1C2416',
                        }}
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-[#1C2416]/30 border-t-[#1C2416] rounded-full animate-spin" />
                                Verifying…
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Lock icon footer */}
                <p className="mt-6 text-center text-[11px]" style={{ color: 'rgba(245,237,219,0.25)' }}>
                    🔒 Secured • Zaitoon Admin v2
                </p>
            </motion.div>
        </main>
    )
}
