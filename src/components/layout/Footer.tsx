'use client'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Clock, Instagram, Facebook } from 'lucide-react'
import { BRANCHES } from '@/lib/mock/data'
import { useLanguageStore } from '@/store/useLanguageStore'
import { translations } from '@/lib/translations'

export default function Footer() {
    const { language, isRTL } = useLanguageStore()
    const t = translations[language]

    return (
        <footer dir={isRTL ? 'rtl' : 'ltr'}
            style={{ background: 'linear-gradient(180deg, #111111 0%, #0C0C0C 100%)' }}
        >
            {/* Gradient top accent */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, var(--olive-base), var(--amber-warm), var(--olive-dark))' }} />

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
                        <p className="text-sm leading-relaxed font-[400] mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {t.footerDesc}
                        </p>
                        <div className="flex gap-2.5">
                            {[Instagram, Facebook].map((Icon, i) => (
                                <a
                                    key={i} href="#"
                                    className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-all duration-300 group"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(255,255,255,0.3)'
                                    }}
                                    onMouseEnter={e => {
                                        const el = e.currentTarget as HTMLElement
                                        el.style.borderColor = 'var(--olive-base)'
                                        el.style.background = 'rgba(138,154,91,0.12)'
                                        el.style.color = 'var(--olive-light)'
                                        el.style.transform = 'translateY(-2px)'
                                    }}
                                    onMouseLeave={e => {
                                        const el = e.currentTarget as HTMLElement
                                        el.style.borderColor = 'rgba(255,255,255,0.08)'
                                        el.style.background = 'rgba(255,255,255,0.04)'
                                        el.style.color = 'rgba(255,255,255,0.3)'
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
                        <h4 className="text-white font-[700] text-[12px] uppercase tracking-[0.16em] mb-6">{t.quickLinks}</h4>
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
                                        <Link
                                            href={href}
                                            className="flex items-center gap-2.5 text-sm font-[500] transition-all duration-200 group"
                                            style={{ color: 'rgba(255,255,255,0.45)' }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--olive-light)' }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                                                style={{ background: 'var(--olive-base)', opacity: 0.6 }} />
                                            {label}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    {/* Branches */}
                    {BRANCHES.map(branch => (
                        <div key={branch.id}>
                            <h4 className="text-white font-[700] text-[12px] uppercase tracking-[0.16em] mb-6">{branch.name}</h4>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--olive-base)' }} />
                                    <span>{branch.address}</span>
                                </li>
                                <li className="flex gap-3">
                                    <Phone className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--olive-base)' }} />
                                    <a
                                        href={`https://wa.me/${branch.whatsapp}`}
                                        className="text-sm font-[500] transition-colors"
                                        style={{ color: 'rgba(255,255,255,0.45)' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--olive-light)' }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' }}
                                    >
                                        {branch.phone}
                                    </a>
                                </li>
                                <li className="flex gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                    <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--olive-base)', opacity: 0.7 }} />
                                    <span>{branch.hours}</span>
                                </li>
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div
                    className={`pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 ${isRTL ? 'sm:flex-row-reverse text-right' : ''}`}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <p className="text-xs font-[400]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        © 2025 Zaitoon Restaurant. {t.allRights}
                    </p>
                    <p className="text-xs font-[400]" style={{ color: 'rgba(255,255,255,0.14)' }}>
                        {t.madeWith}
                    </p>
                </div>
            </div>
        </footer>
    )
}
