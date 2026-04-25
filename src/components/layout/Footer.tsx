'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Clock, Instagram, Facebook } from 'lucide-react'
import { getBranches } from '@/lib/api/branches'
import { getSiteContent } from '@/lib/api/menu'
import { BRANCHES } from '@/lib/mock/data'
import { useLanguageStore } from '@/store/useLanguageStore'
import { translations } from '@/lib/translations'
import type { Branch } from '@/types'

export default function Footer() {
    const { language, isRTL } = useLanguageStore()
    const t = translations[language]

    const [branches, setBranches] = useState<Branch[]>(BRANCHES as Branch[])
    const [footerTagline, setFooterTagline] = useState(t.footerDesc)
    const [copyright, setCopyright] = useState('© 2025 Zaitoon Restaurant.')

    useEffect(() => {
        getBranches()
            .then(data => { if (data?.length) setBranches(data as Branch[]) })
            .catch(() => { /* keep mock fallback */ })

        getSiteContent()
            .then(content => {
                if (content['footer_tagline']) setFooterTagline(content['footer_tagline'])
                if (content['restaurant_copyright']) setCopyright(content['restaurant_copyright'])
            })
            .catch(() => { /* keep defaults */ })
    }, [])

    return (
        <footer dir={isRTL ? 'rtl' : 'ltr'}
            style={{ background: 'linear-gradient(180deg, #6A7E3F 0%, #4C5C2D 100%)' }}
        >
            {/* Gradient top accent */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, var(--orange-warm), var(--green-base), var(--orange-bright))' }} />

            <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

                    {/* Brand */}
                    <div>
                        <Image
                            src="/logo-en.png"
                            alt="Zaitoon"
                            width={180} height={60}
                            className="h-12 w-auto object-contain mb-5"
                            style={{ mixBlendMode: 'screen', opacity: 0.92 }}
                        />
                        <p className="text-sm leading-relaxed font-[400] mb-6 max-w-[280px]"
                            style={{ color: 'rgba(251,246,246,0.86)' }}>
                            {footerTagline}
                        </p>
                        <div className="flex gap-2.5">
                            {[Instagram, Facebook].map((Icon, i) => (
                                <a
                                    key={i} href="#"
                                    className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-all duration-300"
                                    style={{
                                        background: 'rgba(156,175,136,0.10)',
                                        border: '1px solid rgba(156,175,136,0.24)',
                                        color: 'rgba(251,246,246,0.78)'
                                    }}
                                    onMouseEnter={e => {
                                        const el = e.currentTarget as HTMLElement
                                        el.style.borderColor = 'var(--green-base)'
                                        el.style.background = 'rgba(156,175,136,0.22)'
                                        el.style.color = 'white'
                                        el.style.transform = 'translateY(-2px)'
                                    }}
                                    onMouseLeave={e => {
                                        const el = e.currentTarget as HTMLElement
                                        el.style.borderColor = 'rgba(156,175,136,0.24)'
                                        el.style.background = 'rgba(156,175,136,0.10)'
                                        el.style.color = 'rgba(251,246,246,0.78)'
                                        el.style.transform = 'translateY(0)'
                                    }}
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-[var(--cream)] font-[700] text-[12px] uppercase tracking-[0.16em] mb-6">{t.quickLinks}</h4>
                        <ul className="space-y-3.5">
                            {[
                                `${t.fullMenu}:/menu`,
                                `${t.trackOrder}:/order`,
                                `${t.loyalty}:/loyalty`,
                                `${t.aboutUs}:#`,
                                `${t.contact}:#`
                            ].map(item => {
                                const [label, href] = item.split(':')
                                return (
                                    <li key={label}>
                                        <Link href={href} className="footer-link flex items-center gap-2.5 text-sm font-[500] group">
                                            <span className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                                                style={{ background: 'var(--green-base)', opacity: 0.6 }} />
                                            {label}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    {/* Branches — from Supabase, fallback to mock */}
                    {branches.map(branch => (
                        <div key={branch.id}>
                            <h4 className="text-[var(--cream)] font-[700] text-[12px] uppercase tracking-[0.16em] mb-6">{branch.name}</h4>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-sm leading-snug" style={{ color: 'rgba(251,246,246,0.85)' }}>
                                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--green-base)' }} />
                                    <span>{branch.address}</span>
                                </li>
                                <li className="flex gap-3">
                                    <Phone className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--green-base)' }} />
                                    <a href={`https://wa.me/${branch.whatsapp}`} className="footer-link text-sm font-[500]">
                                        {branch.phone}
                                    </a>
                                </li>
                                <li className="flex gap-3 text-sm" style={{ color: 'rgba(251,246,246,0.74)' }}>
                                    <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--green-base)', opacity: 0.7 }} />
                                    <span>{branch.hours}</span>
                                </li>
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div
                    className={`pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 ${isRTL ? 'sm:flex-row-reverse text-right' : ''}`}
                    style={{ borderTop: '1px solid rgba(251,246,246,0.25)' }}
                >
                    <p className="text-xs font-[400]" style={{ color: 'rgba(251,246,246,0.78)' }}>
                        {copyright}
                    </p>
                    <p className="text-xs font-[400]" style={{ color: 'rgba(251,246,246,0.70)' }}>
                        {t.madeWith}
                    </p>
                </div>
            </div>
        </footer>
    )
}
