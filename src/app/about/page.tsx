import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Phone, Mail, Clock, ChevronRight, Leaf, Heart, Star, Trophy, Users, Utensils } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getSiteContent } from '@/lib/api/menu'

export const metadata: Metadata = {
    title: 'About Us | Zaitoon – Authentic Lebanese Cuisine',
    description: 'Learn about the story behind Zaitoon – our heritage, mission, and dedication to bringing authentic Lebanese flavours to Pakistan.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Server component – fetches CMS data at request time
export default async function AboutPage() {
    let cms: Record<string, string> = {}
    try { cms = await getSiteContent() } catch { /* fallback to defaults */ }

    const name = cms['about_restaurant_name'] || 'Zaitoon'
    const founded = cms['about_founded_year'] || '2015'
    const location = cms['about_location'] || 'Lahore, Pakistan'
    const storyEn = cms['about_story_en'] || 'We started with a simple dream: to bring the rich, authentic flavours of Lebanese cuisine to the streets of Pakistan. Every dish we prepare is a love letter to our heritage.'
    const mission = cms['about_mission'] || 'Bringing authentic Lebanese flavours to every table.'
    const address = cms['about_address'] || 'Lahore, Pakistan'
    const phone = cms['about_phone'] || ''
    const email = cms['about_email'] || ''

    const stats = [
        {
            icon: <Trophy className="w-8 h-8" />,
            value: cms['about_stat1_value'] || `${new Date().getFullYear() - parseInt(founded) + 1}+`,
            label: cms['about_stat1_label'] || 'Years of Excellence',
            color: '#B45309',
            bg: 'rgba(180,83,9,0.1)'
        },
        {
            icon: <Users className="w-8 h-8" />,
            value: cms['about_stat2_value'] || '50,000+',
            label: cms['about_stat2_label'] || 'Happy Customers',
            color: '#2D6A4F',
            bg: 'rgba(45,106,79,0.1)'
        },
        {
            icon: <Utensils className="w-8 h-8" />,
            value: cms['about_stat3_value'] || '80+',
            label: cms['about_stat3_label'] || 'Menu Items',
            color: '#9B2335',
            bg: 'rgba(155,35,53,0.1)'
        },
        {
            icon: <Leaf className="w-8 h-8" />,
            value: '100%',
            label: 'Fresh Ingredients',
            color: '#1B4332',
            bg: 'rgba(27,67,50,0.1)'
        },
    ]

    const values = [
        { icon: <Leaf className="w-6 h-6" />, title: 'Fresh Ingredients', desc: 'We source only the finest, freshest produce to honour every recipe.' },
        { icon: <Heart className="w-6 h-6" />, title: 'Made with Love', desc: 'Every dish is crafted with care, passion, and family tradition.' },
        { icon: <Star className="w-6 h-6" />, title: 'Authentic Taste', desc: 'Recipes rooted in Lebanese heritage, perfected over generations.' },
    ]

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-[var(--background)]">

                {/* ── Hero ────────────────────────────────────────────────────── */}
                <section className="relative bg-[var(--green-darkest)] text-white overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[var(--green-dark)] opacity-30" />
                    <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[var(--charcoal)] opacity-40" />

                    <div className="relative z-10 max-w-5xl mx-auto px-6 py-28 text-center">
                        <span className="inline-block text-sm font-bold tracking-widest uppercase text-[var(--green-pale)] mb-4">
                            Est. {founded} · {location}
                        </span>
                        <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                            Our Story
                        </h1>
                        <p className="text-lg md:text-xl text-[var(--green-pale)] max-w-2xl mx-auto leading-relaxed">
                            {mission}
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4 justify-center">
                            <Link
                                href="/menu"
                                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-[var(--green-darkest)] font-bold text-sm hover:bg-[var(--cream)] transition"
                            >
                                Explore Our Menu <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Stats ───────────────────────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 -mt-8 z-20 relative">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((s) => (
                            <div
                                key={s.label}
                                className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 flex flex-col items-center text-center border border-[var(--linen)] transition-transform hover:-translate-y-1 duration-300"
                            >
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: s.bg, color: s.color }}>
                                    {s.icon}
                                </div>
                                <p className="font-display text-3xl font-extrabold text-[var(--green-darkest)]">{s.value}</p>
                                <p className="text-xs font-bold text-[var(--stone)] uppercase tracking-wider mt-2">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Story ───────────────────────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-20">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--green-dark)] mb-3 block">Who We Are</span>
                            <h2 className="font-display text-4xl font-bold text-[var(--charcoal)] leading-tight mb-6">
                                A Tradition of Authentic Lebanese Flavour
                            </h2>
                            <p className="text-[var(--stone)] leading-relaxed text-base mb-4">
                                {storyEn}
                            </p>
                            <p className="text-[var(--stone)] leading-relaxed text-base">
                                From our signature flame-grilled chicken to our freshly baked bread and house-made sauces — every bite carries a piece of our identity.
                            </p>
                        </div>

                        {/* Visual accent – icon grid */}
                        <div className="relative grid grid-cols-2 gap-4">
                            {[
                                { icon: <Leaf className="w-8 h-8" />, label: 'Fresh Ingredients', sub: '100% natural', color: 'var(--green-darkest)', glow: 'rgba(76,92,45,0.35)' },
                                { icon: <Star className="w-8 h-8" />, label: 'Top Rated', sub: '4.9 ★ average', color: 'var(--orange-rich)', glow: 'rgba(166,82,79,0.35)' },
                                { icon: <Heart className="w-8 h-8" />, label: 'Made with Love', sub: 'Family recipes', color: 'var(--orange-warm)', glow: 'rgba(184,98,94,0.30)' },
                                { icon: <Clock className="w-8 h-8" />, label: 'Always Fresh', sub: 'Cooked to order', color: 'var(--green-dark)', glow: 'rgba(90,109,53,0.35)' },
                            ].map(({ icon, label, sub, color, glow }) => (
                                <div
                                    key={label}
                                    className="rounded-2xl p-6 flex flex-col items-center text-center gap-3 transition-transform hover:-translate-y-1 duration-300"
                                    style={{
                                        background: 'var(--background)',
                                        border: '1.5px solid var(--linen)',
                                        boxShadow: `0 8px 24px ${glow}`,
                                    }}
                                >
                                    <div
                                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                                        style={{ background: color, boxShadow: `0 4px 14px ${glow}` }}
                                    >
                                        {icon}
                                    </div>
                                    <div>
                                        <p className="font-[700] text-[14px] text-[var(--charcoal)]">{label}</p>
                                        <p className="text-[11px] text-[var(--stone)] mt-0.5">{sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Values ──────────────────────────────────────────────────── */}
                <section className="bg-[var(--green-darkest)] py-20">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="text-center mb-12">
                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--green-pale)] mb-3 block">What Drives Us</span>
                            <h2 className="font-display text-4xl font-bold text-white">Our Values</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {values.map((v) => (
                                <div key={v.title} className="bg-[var(--green-dark)] rounded-3xl p-8 text-center">
                                    <div className="inline-flex w-14 h-14 rounded-2xl bg-[var(--green-darkest)] text-[var(--green-pale)] items-center justify-center mb-5 mx-auto">
                                        {v.icon}
                                    </div>
                                    <h3 className="font-display text-lg font-bold text-white mb-2">{v.title}</h3>
                                    <p className="text-[var(--green-pale)] text-sm leading-relaxed">{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Contact / Find Us ────────────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-20">
                    <div className="text-center mb-12">
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--green-dark)] mb-3 block">Come Visit Us</span>
                        <h2 className="font-display text-4xl font-bold text-[var(--charcoal)]">Find {name}</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {address && (
                            <div className="bg-white rounded-3xl p-8 border border-[var(--linen)] shadow-sm flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--cream)] flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5 text-[var(--green-darkest)]" />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--charcoal)] mb-1">Address</p>
                                    <p className="text-sm text-[var(--stone)] leading-relaxed">{address}</p>
                                </div>
                            </div>
                        )}
                        {phone && (
                            <div className="bg-white rounded-3xl p-8 border border-[var(--linen)] shadow-sm flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--cream)] flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5 text-[var(--green-darkest)]" />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--charcoal)] mb-1">Phone</p>
                                    <a href={`tel:${phone}`} className="text-sm text-[var(--green-dark)] font-semibold hover:underline">{phone}</a>
                                </div>
                            </div>
                        )}
                        {email && (
                            <div className="bg-white rounded-3xl p-8 border border-[var(--linen)] shadow-sm flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--cream)] flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-[var(--green-darkest)]" />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--charcoal)] mb-1">Email</p>
                                    <a href={`mailto:${email}`} className="text-sm text-[var(--green-dark)] font-semibold hover:underline break-all">{email}</a>
                                </div>
                            </div>
                        )}
                        <div className="bg-white rounded-3xl p-8 border border-[var(--linen)] shadow-sm flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--cream)] flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-[var(--green-darkest)]" />
                            </div>
                            <div>
                                <p className="font-bold text-[var(--charcoal)] mb-1">Opening Hours</p>
                                <p className="text-sm text-[var(--stone)]">Daily: 12:00 PM – 1:00 AM</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-14 rounded-3xl bg-gradient-to-br from-[var(--green-darkest)] to-[var(--green-dark)] p-10 text-center text-white">
                        <h3 className="font-display text-3xl font-bold mb-3">Ready to order?</h3>
                        <p className="text-[var(--green-pale)] mb-8">Browse our full menu and get fresh Lebanese food delivered to your door.</p>
                        <Link
                            href="/menu"
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-[var(--green-darkest)] font-bold text-sm hover:bg-[var(--cream)] transition"
                        >
                            Order Now <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    )
}
