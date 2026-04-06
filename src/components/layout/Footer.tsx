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
        <footer className="bg-[#111111]" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Green top accent */}
            <div className="h-1.5 bg-[#28A854]" />

            <div id="branches" className="max-w-7xl mx-auto px-6 pt-16 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

                    {/* Brand */}
                    <div>
                        <Image src="/logo-en.png" alt="Zaitoon" width={180} height={60}
                            className="h-12 w-auto object-contain mb-5" style={{ mixBlendMode: 'screen', opacity: 0.9 }} />
                        <p className="text-white/60 text-sm leading-relaxed font-semibold mb-5">
                            {t.footerDesc}
                        </p>
                        <div className="flex gap-2.5">
                            {[Instagram, Facebook].map((Icon, i) => (
                                <a key={i} href="#"
                                    className="w-10 h-10 rounded-2xl bg-white/6 border border-white/10
                    hover:border-[#28A854] hover:bg-[#28A854]/15 hover:text-[#28A854]
                    flex items-center justify-center text-white/35 transition-all duration-200">
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-white font-black text-sm uppercase tracking-widest mb-6">{t.quickLinks}</h4>
                        <ul className="space-y-3.5">
                            {[`${t.fullMenu}:/menu`, `${t.trackOrder}:/order`, `${t.loyalty}:/loyalty`, `${t.aboutUs}:#`, `${t.contact}:#`].map(item => {
                                const [label, href] = item.split(':')
                                return (
                                    <li key={label}>
                                        <Link href={href}
                                            className="flex items-center gap-2 text-white/60 hover:text-[#28A854]
                        text-sm font-semibold transition-colors">
                                            <span className="w-1 h-1 rounded-full bg-[#28A854]/50" />{label}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    {/* Branches */}
                    {BRANCHES.map(branch => (
                        <div key={branch.id}>
                            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-6">{branch.name}</h4>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-sm text-white/60 font-semibold leading-snug">
                                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#28A854]" />{branch.address}
                                </li>
                                <li className="flex gap-3">
                                    <Phone className="w-4 h-4 shrink-0 mt-0.5 text-[#28A854]" />
                                    <a href={`https://wa.me/${branch.whatsapp}`}
                                        className="text-sm text-white/60 hover:text-[#28A854] transition-colors font-semibold">{branch.phone}</a>
                                </li>
                                <li className="flex gap-3 text-sm text-white/30 font-semibold">
                                    <Clock className="w-4 h-4 shrink-0 mt-0.5 text-[#28A854]" />{branch.hours}
                                </li>
                            </ul>
                        </div>
                    ))}
                </div>

                <div className={`border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 ${isRTL ? 'sm:flex-row-reverse text-right' : ''}`}>
                    <p className="text-white/20 text-xs font-semibold">© 2025 Zaitoon Restaurant. {t.allRights}</p>
                    <p className="text-white/15 text-xs font-semibold">{t.madeWith}</p>
                </div>
            </div>
        </footer>
    )
}
