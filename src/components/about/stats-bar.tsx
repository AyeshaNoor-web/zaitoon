'use client'

import { useEffect, useState, useRef } from 'react'
import { AboutPageContent } from '@/types/about'

interface Props {
  content: AboutPageContent
}

export function StatsBar({ content }: Props) {
  const stats = [
    { num: parseInt(content.stat_1_number), suffix: content.stat_1_suffix, label: content.stat_1_label },
    { num: parseInt(content.stat_2_number), suffix: content.stat_2_suffix, label: content.stat_2_label },
    { num: parseInt(content.stat_3_number), suffix: content.stat_3_suffix, label: content.stat_3_label },
    { num: parseInt(content.stat_4_number), suffix: content.stat_4_suffix, label: content.stat_4_label },
  ]

  return (
    <section className="bg-zinc-900 dark:bg-black py-16 px-6 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-8">
          {stats.map((stat, i) => (
            <StatItem key={i} target={stat.num} suffix={stat.suffix} label={stat.label} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatItem({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const domRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setIsVisible(true)
        observer.unobserve(domRef.current!)
      }
    }, { threshold: 0.1 })
    
    if (domRef.current) observer.observe(domRef.current)
    
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let start = 0
    const duration = 2000
    const increment = target / (duration / 16) // ~60fps
    
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [isVisible, target])

  return (
    <div ref={domRef} className="text-center group">
      <div className="text-4xl md:text-5xl font-black mb-2 flex items-center justify-center gap-0.5">
        <span className="text-[var(--green-base)]">
          {count.toLocaleString()}
        </span>
        <span className="text-white opacity-80">{suffix}</span>
      </div>
      <p className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
        {label}
      </p>
    </div>
  )
}
