'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useLanguageStore } from '@/store/useLanguageStore'
import { translations } from '@/lib/translations'

interface PhoneAuthModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function PhoneAuthModal({ isOpen, onClose }: PhoneAuthModalProps) {
    const { language, isRTL } = useLanguageStore()
    const t = translations[language]
    const { sendOTP, verifyOTP, updateProfile, isLoading } = useAuthStore()
    const [step, setStep] = useState(1)
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [countdown, setCountdown] = useState(30)

    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1)
            setPhone('')
            setOtp(['', '', '', '', '', ''])
            setName('')
            setError('')
            setSuccess(false)
            setCountdown(30)
        }
    }, [isOpen])

    // Countdown timer for OTP resend
    useEffect(() => {
        let t: NodeJS.Timeout
        if (step === 2 && countdown > 0) {
            t = setInterval(() => setCountdown(c => c - 1), 1000)
        }
        return () => clearInterval(t)
    }, [step, countdown])

    const formatPhone = (val: string) => {
        const cleaned = val.replace(/\D/g, '')
        if (cleaned.startsWith('0')) {
            return '+92' + cleaned.slice(1)
        } else if (cleaned.startsWith('92')) {
            return '+' + cleaned
        } else if (cleaned.length > 0) {
            return '+92' + cleaned
        }
        return val
    }

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        const formatted = formatPhone(phone)
        if (formatted.length < 13) {
            setError('Please enter a valid Pakistani phone number')
            return
        }

        try {
            await sendOTP(formatted)
            setPhone(formatted)
            setStep(2)
            setCountdown(30)
        } catch (err: any) {
            let msg = err.message || 'Failed to send OTP'
            if (msg.includes('invalid-phone-number')) msg = 'Please enter a valid Pakistani number'
            if (msg.includes('too-many-requests')) msg = 'Too many attempts. Please wait 10 minutes.'
            setError(msg)
        }
    }

    const handleOtpChange = (idx: number, val: string) => {
        if (val.length > 1) val = val.slice(-1)
        if (!/^\d*$/.test(val)) return

        const newOtp = [...otp]
        newOtp[idx] = val
        setOtp(newOtp)
        setError('')

        // Auto-advance
        if (val && idx < 5) {
            inputRefs.current[idx + 1]?.focus()
        }

        // Auto-submit
        if (val && idx === 5 && newOtp.every(v => v !== '')) {
            verifyOtpSubmit(newOtp.join(''))
        }
    }

    const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus()
        }
    }

    const verifyOtpSubmit = async (token: string) => {
        setError('')
        try {
            await verifyOTP(token)
            const { customer } = useAuthStore.getState()
            if (customer && customer.name === 'Customer') {
                setStep(3)
            } else {
                handleSuccess()
            }
        } catch (err: any) {
            setError(err.message || 'Incorrect code. Please try again.')
        }
    }

    const handleNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim().length < 2) {
            setError('Please enter your full name')
            return
        }
        await updateProfile(name.trim())
        handleSuccess()
    }

    const handleSuccess = () => {
        setSuccess(true)
        setTimeout(() => {
            onClose()
        }, 1500)
    }

    if (!isOpen) return null

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`relative w-full max-w-sm bg-[#FFFDF9] rounded-3xl p-8 shadow-2xl z-10 overflow-hidden ${isRTL ? 'text-right' : ''}`}
                        dir={isRTL ? 'rtl' : 'ltr'}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-2 text-[var(--stone)] hover:bg-[var(--linen)] rounded-full transition-colors`}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Top Logo */}
                        <div className="flex justify-center mb-6">
                            <Image src="/logo-en.png" alt="Zaitoon" width={160} height={48} priority className="h-[48px] w-auto mix-blend-multiply" />
                        </div>

                        {success ? (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center text-center py-6"
                            >
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                                    <Check className="w-8 h-8" strokeWidth={3} />
                                </div>
                                <h3 className="font-display text-[24px] text-[var(--charcoal)] font-bold">{t.successLabel}</h3>
                                <p className="text-[var(--stone)] mt-2">{t.welcomeToZaitoon}</p>
                            </motion.div>
                        ) : step === 1 ? (
                            <motion.div key="step1" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                                <div className="text-center mb-6">
                                    <h2 className="font-display text-[28px] font-bold text-[var(--charcoal)]">{t.signIn}</h2>
                                    <p className="text-[var(--stone)] text-sm mt-1">{t.enterPhone}</p>
                                </div>

                                <form onSubmit={handleSendOTP} className="space-y-4">
                                    <div>
                                        <input
                                            type="tel"
                                            placeholder="+92 300 1234567"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border-[2px] border-[var(--linen)] rounded-[12px] text-center text-[18px] font-bold tracking-widest text-[var(--charcoal)] focus:outline-none focus:border-[var(--olive-base)] transition-colors"
                                            autoFocus
                                        />
                                    </div>

                                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                                    <button
                                        type="submit"
                                        disabled={isLoading || phone.length < 10}
                                        className="w-full py-4 rounded-[12px] bg-[var(--amber-warm)] text-[var(--olive-darkest)] font-bold hover:bg-[var(--amber-bright)] transition-colors flex items-center justify-center disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.sendOTPLabel}
                                    </button>

                                    <div className="text-center pt-2">
                                        <button type="button" onClick={onClose} className="text-[13px] text-[var(--stone)] hover:text-[var(--charcoal)] underline">
                                            {t.continueAsGuest}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        ) : step === 2 ? (
                            <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                                <div className="text-center mb-6">
                                    <h2 className="font-display text-[28px] font-bold text-[var(--charcoal)]">{t.enterOTPLabel}</h2>
                                    <p className="text-[var(--stone)] text-sm mt-1">{t.sentTo} {phone}</p>
                                </div>

                                <div className="flex justify-between gap-2 mb-4">
                                    {otp.map((d, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { inputRefs.current[i] = el }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={d}
                                            onChange={e => handleOtpChange(i, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(i, e)}
                                            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-[2px] bg-white outline-none transition-all ${error ? 'border-red-500 text-red-600' : 'border-[var(--linen)] text-[var(--charcoal)] focus:border-[var(--olive-base)]'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <motion.p initial={{ x: -5 }} animate={{ x: [0, -5, 5, -5, 5, 0] }} transition={{ duration: 0.4 }} className="text-red-500 text-xs text-center mb-4">
                                        {error}
                                    </motion.p>
                                )}

                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => verifyOtpSubmit(otp.join(''))}
                                        disabled={isLoading || otp.some(v => v === '')}
                                        className="w-full py-4 rounded-[12px] bg-[var(--amber-warm)] text-[var(--olive-darkest)] font-bold hover:bg-[var(--amber-bright)] transition-colors flex items-center justify-center disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.verifyContinue}
                                    </button>

                                    <div className={`flex justify-between items-center text-[13px] ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <button onClick={() => setStep(1)} className="text-[var(--stone)] hover:text-[var(--charcoal)] font-semibold">
                                            {isRTL ? 'نمبر تبدیل کریں ←' : '← Change number'}
                                        </button>
                                        <button
                                            onClick={handleSendOTP}
                                            disabled={countdown > 0 || isLoading}
                                            className={`${countdown > 0 ? 'text-[var(--stone)]' : 'text-[var(--olive-base)] font-bold hover:underline'}`}
                                        >
                                            {countdown > 0 ? `${t.resendIn} ${countdown}s` : t.resendOTP}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                                <div className="text-center mb-6">
                                    <h2 className="font-display text-[28px] font-bold text-[var(--charcoal)]">{t.welcome}</h2>
                                    <p className="text-[var(--stone)] text-sm mt-1">{t.whatsYourName}</p>
                                </div>

                                <form onSubmit={handleNameSubmit} className="space-y-4">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Your full name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border-[2px] border-[var(--linen)] rounded-[12px] text-center text-[16px] font-bold text-[var(--charcoal)] focus:outline-none focus:border-[var(--olive-base)] transition-colors"
                                            autoFocus
                                        />
                                    </div>

                                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                                    <button
                                        type="submit"
                                        disabled={isLoading || name.trim().length < 2}
                                        className="w-full py-4 rounded-[12px] bg-[var(--olive-base)] text-white font-bold hover:bg-[var(--olive-dark)] transition-colors flex items-center justify-center disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.saveAndContinue}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            )}
            </AnimatePresence>
            {/* Invisible reCAPTCHA container required by Firebase */}
            <div id="recaptcha-container" />
        </>
    )
}

