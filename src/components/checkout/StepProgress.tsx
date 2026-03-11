'use client'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const STEPS = [
    { label: 'Your Details', sub: 'Name & phone' },
    { label: 'Order Type', sub: 'Delivery / pickup' },
    { label: 'Payment', sub: 'Promo & loyalty' },
    { label: 'Confirm', sub: 'Review & place' },
]

export default function StepProgress({ currentStep }: { currentStep: number }) {
    return (
        <div className="relative">
            {/* Connecting track */}
            <div className="absolute top-5 left-0 right-0 h-px bg-[#E7E0D8] z-0" />

            {/* Animated gold fill */}
            <motion.div
                className="absolute top-5 left-0 h-px bg-gradient-to-r from-[#C9920A] to-[#F0B429] z-0 origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: currentStep / (STEPS.length - 1) }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: '100%' }}
            />

            <div className="relative z-10 flex justify-between">
                {STEPS.map((step, i) => {
                    const isDone = i < currentStep
                    const isActive = i === currentStep
                    return (
                        <div key={step.label} className="flex flex-col items-center gap-2">
                            {/* Circle */}
                            <motion.div
                                animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-400 relative ${isDone
                                    ? 'bg-[#1B4332] border-[#1B4332] shadow-lg shadow-[#1B4332]/30'
                                    : isActive
                                        ? 'bg-white border-[#C9920A] shadow-lg shadow-[#C9920A]/30'
                                        : 'bg-white border-[#E7E0D8]'
                                    }`}
                            >
                                {isDone ? (
                                    <Check className="w-4 h-4 text-white stroke-[3]" />
                                ) : isActive ? (
                                    <>
                                        <span className="text-[#C9920A] font-black text-sm">{i + 1}</span>
                                        {/* Pulse ring */}
                                        <motion.span
                                            className="absolute inset-0 rounded-full border-2 border-[#C9920A]/40"
                                            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        />
                                    </>
                                ) : (
                                    <span className="text-[#57534E]/50 font-bold text-sm">{i + 1}</span>
                                )}
                            </motion.div>

                            {/* Label */}
                            <div className="text-center hidden sm:block">
                                <p className={`text-xs font-bold transition-colors ${isActive ? 'text-[#C9920A]' : isDone ? 'text-[#1B4332]' : 'text-[#57534E]/50'
                                    }`}>{step.label}</p>
                                <p className="text-[10px] text-[#57534E]/40 mt-0.5">{step.sub}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
