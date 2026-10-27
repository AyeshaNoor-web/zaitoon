'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Clock, MessageCircle, ArrowUpRight } from 'lucide-react'
import { getBranches } from '@/lib/api/branches'
import { getSiteContent } from '@/lib/api/menu'
import { BRANCHES } from '@/lib/mock/data'
import { useLanguageStore } from '@/store/useLanguageStore'
import { translations } from '@/lib/translations'
import { SITE, waLink } from '@/lib/site'
import type { Branch } from '@/types'

export default function Footer() {
    const { language } = useLanguageStore()
    const t = translations[language]

    const [branches, setBranches] = useState<Branch[]>(BRANCHES as Branch[])
    const [tagline, setTagline] = useState<string | null>(null)
    const [copyright, setCopyright] = useState<string | null>(null)

    useEffect(() => {
        getBranches()
            .then(data => { if (data?.length) setBranches(data as Branch[]) })
            .catch(() => { /* keep fallback */ })
        getSiteContent()
            .then(content => {
                if (content['footer_tagline']) setTagline(content['footer_tagline'])
                if (content['restaurant_copyright']) setCopyright(content['restaurant_copyright'])
            })
            .catch(() => { /* keep defaults */ })
    }, [])

    const year = new Date().getFullYear()
    const links = [
        { label: t.fullMenu, href: '/menu' },
        { label: t.trackOrder, href: '/order' },
        { label: t.loyalty, href: '/loyalty' },
        { label: t.aboutUs, href: '/about' },
        { label: t.branches, href: '/#branches' },
    ]

    return (
        <footer className="surface-dark grain">
            {/* CTA band */}
            <div className="container-page border-b border-white/10 py-14 lg:py-20">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <h2 className="max-w-2xl text-paper">
                        Hungry? Your order is <em className="font-normal italic text-ember-100">a minute</em> away.
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/menu" className="btn-primary">{t.orderNow}</Link>
                        <a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                            <MessageCircle className="h-4 w-4" /> {t.whatsappUs}
                        </a>
                    </div>
                </div>
            </div>

            <div className="container-page grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-12">
                <div className="lg:col-span-4">
                    <Image src="/logo-light.png" alt="Zaitoon" width={583} height={220} className="h-11 w-auto" />
                    <p className="mt-5 max-w-xs text-[0.9375rem] leading-relaxed text-paper/70">
                        {tagline ?? t.footerDesc}
                    </p>
                    <a href={SITE.phoneHref} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-paper/90 hover:text-white">
                        <Phone className="h-4 w-4 text-olive-300" /> {SITE.phoneDisplay}
                    </a>
                </div>

                <nav aria-label="Footer" className="lg:col-span-2">
                    <h3 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-paper/50">{t.quickLinks}</h3>
                    <ul className="space-y-2.5">
                        {links.map(l => (
                            <li key={l.href}>
                                <Link href={l.href} className="text-[0.9375rem] text-paper/80 transition-colors hover:text-white">
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="grid gap-8 sm:grid-cols-2 md:col-span-2 lg:col-span-6">
                    {branches.map(branch => (
                        <address key={branch.id} className="not-italic">
                            <h3 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-paper/50">{branch.name}</h3>
                            <ul className="space-y-3 text-[0.9375rem] text-paper/80">
                                <li className="flex gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-olive-300" />
                                    <span>{branch.address}</span>
                                </li>
                                {branch.phone && (
                                    <li className="flex gap-3">
                                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-olive-300" />
                                        <a href={`tel:${branch.phone.replace(/[^\d+]/g, '')}`} className="hover:text-white">{branch.phone}</a>
                                    </li>
                                )}
                                {branch.hours && (
                                    <li className="flex gap-3">
                                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-olive-300" />
                                        <span>{branch.hours}</span>
                                    </li>
                                )}
                                {branch.whatsapp && (
                                    <li>
                                        <a href={waLink(branch.whatsapp)} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm font-medium text-ember-100 hover:text-white">
                                            Message this branch <ArrowUpRight className="h-3.5 w-3.5" />
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </address>
                    ))}
                </div>
            </div>

            <div className="container-page flex flex-col gap-2 border-t border-white/10 py-6 text-[0.8125rem] text-paper/55 sm:flex-row sm:items-center sm:justify-between">
                <p>{copyright?.replace(/\b20\d{2}\b/, String(year)) ?? `© ${year} Zaitoon Restaurant. ${t.allRights}`}</p>
                <p>{t.madeWith}</p>
            </div>
        </footer>
    )
}
