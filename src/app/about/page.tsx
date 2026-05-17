import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail, Clock, ChevronRight, Leaf, Heart, Star } from 'lucide-react'
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
            emoji: cms['about_stat1_emoji'] || '🏆',
            value: cms['about_stat1_value'] || `${new Date().getFullYear() - parseInt(founded) + 1}+`,
            label: cms['about_stat1_label'] || 'Years of Excellence',
        },
        {
            emoji: cms['about_stat2_emoji'] || '😊',
            value: cms['about_stat2_value'] || '50,000+',
            label: cms['about_stat2_label'] || 'Happy Customers',
        },
        {
            emoji: cms['about_stat3_emoji'] || '🍽️',
            value: cms['about_stat3_value'] || '80+',
            label: cms['about_stat3_label'] || 'Menu Items',
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

            <main className="min-h-screen bg-[#FAF6EF]">

                {/* ── Hero ────────────────────────────────────────────────────── */}
                <section className="relative bg-[#1B4332] text-white overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[#2D6A4F] opacity-30" />
                    <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[#0D2B1F] opacity-40" />

                    <div className="relative z-10 max-w-5xl mx-auto px-6 py-28 text-center">
                        <span className="inline-block text-sm font-bold tracking-widest uppercase text-[#95D5B2] mb-4">
                            Est. {founded} · {location}
                        </span>
                        <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                            Our Story
                        </h1>
                        <p className="text-lg md:text-xl text-[#B7E4C7] max-w-2xl mx-auto leading-relaxed">
                            {mission}
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4 justify-center">
                            <Link
                                href="/menu"
                                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-[#1B4332] font-bold text-sm hover:bg-[#F0FDF4] transition"
                            >
                                Explore Our Menu <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Stats ───────────────────────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 -mt-8 z-20 relative">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {stats.map((s) => (
                            <div
                                key={s.label}
                                className="bg-white rounded-3xl shadow-md p-8 text-center border border-[#E7E0D8]"
                            >
                                <div className="text-4xl mb-3">{s.emoji}</div>
                                <p className="font-display text-3xl font-extrabold text-[#1B4332]">{s.value}</p>
                                <p className="text-sm font-semibold text-[#47423D] mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Story ───────────────────────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-20">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-[#2D6A4F] mb-3 block">Who We Are</span>
                            <h2 className="font-display text-4xl font-bold text-[#18181B] leading-tight mb-6">
                                A Tradition of Authentic Lebanese Flavour
                            </h2>
                            <p className="text-[#47423D] leading-relaxed text-base mb-4">
                                {storyEn}
                            </p>
                            <p className="text-[#47423D] leading-relaxed text-base">
                                From our signature flame-grilled chicken to our freshly baked bread and house-made sauces — every bite carries a piece of our identity.
                            </p>
                        </div>

                        {/* Visual accent */}
                        <div className="relative">
                            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-[#2D6A4F]/20">
                                <Image
                                    src="/about-restaurant.png"
                                    alt="Zaitoon restaurant – authentic Lebanese cuisine"
                                    fill
                                    className="object-cover hover:scale-105 transition-transform duration-700"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                            <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-2xl bg-[#B45309] flex items-center justify-center shadow-lg text-4xl">
                                🍗
                            </div>
                            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-[#FAF6EF] border-4 border-[#E7E0D8] flex items-center justify-center text-3xl shadow">
                                🌿
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Values ──────────────────────────────────────────────────── */}
                <section className="bg-[#1B4332] py-20">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="text-center mb-12">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#95D5B2] mb-3 block">What Drives Us</span>
                            <h2 className="font-display text-4xl font-bold text-white">Our Values</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {values.map((v) => (
                                <div key={v.title} className="bg-[#2D6A4F] rounded-3xl p-8 text-center">
                                    <div className="inline-flex w-14 h-14 rounded-2xl bg-[#1B4332] text-[#95D5B2] items-center justify-center mb-5 mx-auto">
                                        {v.icon}
                                    </div>
                                    <h3 className="font-display text-lg font-bold text-white mb-2">{v.title}</h3>
                                    <p className="text-[#B7E4C7] text-sm leading-relaxed">{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Contact / Find Us ────────────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 py-20">
                    <div className="text-center mb-12">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#2D6A4F] mb-3 block">Come Visit Us</span>
                        <h2 className="font-display text-4xl font-bold text-[#18181B]">Find {name}</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {address && (
                            <div className="bg-white rounded-3xl p-8 border border-[#E7E0D8] shadow-sm flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5 text-[#1B4332]" />
                                </div>
                                <div>
                                    <p className="font-bold text-[#18181B] mb-1">Address</p>
                                    <p className="text-sm text-[#47423D] leading-relaxed">{address}</p>
                                </div>
                            </div>
                        )}
                        {phone && (
                            <div className="bg-white rounded-3xl p-8 border border-[#E7E0D8] shadow-sm flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5 text-[#1B4332]" />
                                </div>
                                <div>
                                    <p className="font-bold text-[#18181B] mb-1">Phone</p>
                                    <a href={`tel:${phone}`} className="text-sm text-[#2D6A4F] font-semibold hover:underline">{phone}</a>
                                </div>
                            </div>
                        )}
                        {email && (
                            <div className="bg-white rounded-3xl p-8 border border-[#E7E0D8] shadow-sm flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-[#1B4332]" />
                                </div>
                                <div>
                                    <p className="font-bold text-[#18181B] mb-1">Email</p>
                                    <a href={`mailto:${email}`} className="text-sm text-[#2D6A4F] font-semibold hover:underline break-all">{email}</a>
                                </div>
                            </div>
                        )}
                        <div className="bg-white rounded-3xl p-8 border border-[#E7E0D8] shadow-sm flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-[#1B4332]" />
                            </div>
                            <div>
                                <p className="font-bold text-[#18181B] mb-1">Opening Hours</p>
                                <p className="text-sm text-[#47423D]">Daily: 12:00 PM – 1:00 AM</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-14 rounded-3xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] p-10 text-center text-white">
                        <h3 className="font-display text-3xl font-bold mb-3">Ready to order?</h3>
                        <p className="text-[#B7E4C7] mb-8">Browse our full menu and get fresh Lebanese food delivered to your door.</p>
                        <Link
                            href="/menu"
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-[#1B4332] font-bold text-sm hover:bg-[#F0FDF4] transition"
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
