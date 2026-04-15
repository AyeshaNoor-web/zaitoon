'use client'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const STEPS = [
    { label: 'Your Details', sub: 'Name & phone', icon: '👤' },
    { label: 'Order Type',   sub: 'Delivery / pickup', icon: '🛵' },
    { label: 'Payment',      sub: 'Promo & loyalty', icon: '💳' },
    { label: 'Confirm',      sub: 'Review & place', icon: '✅' },
]

export default function StepProgress({ currentStep }: { currentStep: number }) {
    const progress = STEPS.length > 1 ? currentStep / (STEPS.length - 1) : 0

    return (
        <div className="relative px-2 py-1">
            {/* Track background */}
            <div
                className="absolute top-5 left-6 right-6 h-[3px] rounded-full z-0"
                style={{ background: 'var(--linen)' }}
            />
            {/* Animated fill */}
            <motion.div
                className="absolute top-5 left-6 h-[3px] rounded-full z-0"
                initial={{ width: '0%' }}
                animate={{ width: `calc(${progress * 100}% - 0px)` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    background: 'linear-gradient(90deg, var(--amber-warm), var(--amber-bright))',
                    maxWidth: 'calc(100% - 48px)',
                }}
            />

            <div className="relative z-10 flex justify-between">
                {STEPS.map((step, i) => {
                    const isDone   = i < currentStep
                    const isActive = i === currentStep

                    return (
                        <div key={step.label} className="flex flex-col items-center gap-2.5 flex-1">
                            {/* Circle */}
                            <motion.div
                                animate={isActive ? { scale: [1, 1.12, 1] } : {}}
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                                className="w-10 h-10 rounded-full flex items-center justify-center border-2 relative transition-all duration-300"
                                style={{
                                    background: isDone
                                        ? 'linear-gradient(135deg, var(--olive-darkest), var(--olive-dark))'
                                        : isActive
                                            ? 'white'
                                            : 'var(--cream)',
                                    borderColor: isDone
                                        ? 'var(--olive-darkest)'
                                        : isActive
                                            ? 'var(--amber-warm)'
                                            : 'var(--linen)',
                                    boxShadow: isDone
                                        ? '0 4px 12px rgba(92,110,58,0.35)'
                                        : isActive
                                            ? '0 4px 16px rgba(217,119,6,0.35)'
                                            : 'none',
                                }}
                            >
                                {isDone ? (
                                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                ) : isActive ? (
                                    <>
                                        <span className="text-[13px] font-[800]"
                                            style={{ color: 'var(--amber-warm)' }}>
                                            {i + 1}
                                        </span>
                                        {/* Pulse ring */}
                                        <motion.span
                                            className="absolute inset-0 rounded-full border-2"
                                            style={{ borderColor: 'rgba(217,119,6,0.35)' }}
                                            animate={{ scale: [1, 1.55], opacity: [0.7, 0] }}
                                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                                        />
                                    </>
                                ) : (
                                    <span className="text-[13px] font-[600]"
                                        style={{ color: 'rgba(87,83,78,0.35)' }}>
                                        {i + 1}
                                    </span>
                                )}
                            </motion.div>

                            {/* Labels */}
                            <div className="text-center hidden sm:block min-w-0">
                                <p className="text-[11px] font-[700] transition-colors leading-none"
                                    style={{
                                        color: isActive
                                            ? 'var(--amber-warm)'
                                            : isDone
                                                ? 'var(--olive-dark)'
                                                : 'rgba(87,83,78,0.4)',
                                    }}>
                                    {step.label}
                                </p>
                                <p className="text-[9px] mt-1 leading-none"
                                    style={{ color: 'rgba(87,83,78,0.35)' }}>
                                    {step.sub}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
