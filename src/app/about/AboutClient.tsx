'use client'

import React from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Trophy, Users, Utensils, Leaf, Heart, Star, MapPin, Phone, Mail, Clock, ChevronRight, Flame, Sparkles } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

interface AboutClientProps {
  cms: Record<string, string>
}

export default function AboutClient({ cms }: AboutClientProps) {
  const shouldReduceMotion = useReducedMotion()

  const name = cms['about_restaurant_name'] || 'Zaitoon'
  const founded = cms['about_founded_year'] || '2015'
  const location = cms['about_location'] || 'Lahore, Pakistan'
  const storyEn = cms['about_story_en'] || 'We started with a simple dream: to bring the rich, authentic flavours of Lebanese cuisine to the streets of Pakistan. Every dish we prepare is a love letter to our heritage, crafted with pure olive oil, aromatic spices, and live charcoal flames.'
  const mission = cms['about_mission'] || 'Bringing authentic Lebanese flavours to every table with uncompromising quality and warmth.'
  const address = cms['about_address'] || 'Lahore, Pakistan'
  const phone = cms['about_phone'] || '+92 300 1234567'
  const email = cms['about_email'] || 'info@zaitoon.com.pk'

  const stats = [
    {
      icon: <Trophy className="w-7 h-7 text-[var(--orange-pale)]" />,
      value: cms['about_stat1_value'] || `${new Date().getFullYear() - parseInt(founded) + 1}+`,
      label: cms['about_stat1_label'] || 'Years of Excellence',
    },
    {
      icon: <Users className="w-7 h-7 text-[var(--green-light)]" />,
      value: cms['about_stat2_value'] || '50,000+',
      label: cms['about_stat2_label'] || 'Happy Enthusiasts',
    },
    {
      icon: <Utensils className="w-7 h-7 text-[var(--orange-pale)]" />,
      value: cms['about_stat3_value'] || '80+',
      label: cms['about_stat3_label'] || 'Master Recipes',
    },
    {
      icon: <Leaf className="w-7 h-7 text-[var(--green-light)]" />,
      value: '100%',
      label: 'Fresh & Halal',
    },
  ]

  const values = [
    {
      icon: <Leaf className="w-8 h-8 text-[var(--green-light)]" />,
      title: 'Fresh Ingredients',
      desc: 'We source only the finest hand-picked produce, authentic Middle Eastern spices, and extra virgin olive oil daily.',
    },
    {
      icon: <Flame className="w-8 h-8 text-[var(--orange-pale)]" />,
      title: 'Live Charcoal Mastery',
      desc: 'Our meats are marinated for up to 12 hours and seared over real glowing coals to lock in unmistakable smoky juiciness.',
    },
    {
      icon: <Heart className="w-8 h-8 text-[#E06D53]" />,
      title: 'Made with Passion',
      desc: 'Every recipe is rooted in centuries-old Lebanese culinary traditions, prepared with warmth and genuine hospitality.',
    },
  ]

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#1A3A28] overflow-hidden">
        {/* ── 1. CINEMATIC EMERALD HERO ─────────────────────────────────── */}
        <section className="relative pt-36 pb-28 px-6 text-center text-white">
          {/* Ambient Background Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[var(--green-light)]/15 to-[var(--orange-pale)]/10 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-black/40 blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 mb-6 text-xs font-bold tracking-widest uppercase text-[var(--orange-pale)] shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5" /> Est. {founded} · {location}
            </motion.div>

            <motion.h1
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-none mb-6 drop-shadow-[0_4px_20px_rgba(212,116,138,0.5)] text-white"
              style={{ fontFamily: 'var(--font-display)', color: '#FFFFFF', textShadow: '0 2px 15px rgba(255,255,255,0.4)' }}
            >
              Our <span style={{ color: '#E293A4' }}>Heritage</span> & Craft
            </motion.h1>

            <motion.p
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg sm:text-xl text-[var(--parchment)]/85 max-w-2xl leading-relaxed font-light mb-10"
            >
              {mission}
            </motion.p>

            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link
                href="/menu"
                className="btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base shadow-xl shadow-orange-950/40 hover:scale-105 transition-all duration-300"
              >
                Explore Our Menu <ChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── 2. FLOATING STATS BAR ────────────────────────────────────── */}
        <section className="relative z-20 max-w-6xl mx-auto px-6 -mt-10 mb-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((s, idx) => (
              <motion.div
                key={idx}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 40 }}
                whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-6 sm:p-8 rounded-3xl backdrop-blur-2xl bg-black/60 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center text-center group transition-all duration-300 hover:border-[var(--orange-pale)]/50"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {s.icon}
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {s.value}
                </p>
                <p className="text-xs font-bold text-[var(--orange-pale)] uppercase tracking-widest">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 3. WARM PARCHMENT STORY SECTION ──────────────────────────── */}
        <section
          className="relative w-full py-24 px-6 overflow-hidden z-20 text-[#1E2A20]"
          style={{
            backgroundColor: '#F4EEE2',
            backgroundImage: `repeating-conic-gradient(rgba(30,42,32,0.018) 0% 25%, transparent 0% 50%)`,
            backgroundSize: '3px 3px',
          }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-20">
              {/* Left Headline */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
                whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-5 flex flex-col items-start"
              >
                <span className="text-xs font-bold tracking-[0.25em] uppercase mb-3 block" style={{ color: '#D4748A' }}>
                  THE ZAITOON JOURNEY
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                  A Love Letter to Lebanese Tradition
                </h2>
                <div className="w-20 h-1 bg-[#D4748A] rounded-full mb-6" />
                <p className="text-base sm:text-lg leading-relaxed font-normal text-[#1E2A20]/80">
                  From our humble beginnings in Lahore to serving tens of thousands of passionate food enthusiasts, our goal has remained unchanged: uncompromising authenticity in every single bite.
                </p>
              </motion.div>

              {/* Right Pull-quote & Narrative */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
                whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-7 relative p-8 sm:p-12 rounded-3xl bg-white/70 border border-[#D4748A]/20 shadow-[0_15px_40px_rgba(30,42,32,0.06)]"
              >
                {/* Ghost Quote Background */}
                <span className="absolute -top-6 left-6 text-8xl font-serif text-[#D4748A]/10 select-none pointer-events-none leading-none">
                  “
                </span>
                <p className="relative z-10 text-xl sm:text-2xl italic font-serif leading-relaxed text-[#1E2A20] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                  “We never cut corners on marinade times or charcoal quality. When a customer tastes our grilled meats, they are tasting true culinary craftsmanship.”
                </p>
                <p className="relative z-10 text-base leading-relaxed text-[#1E2A20]/80 font-normal">
                  {storyEn}
                </p>
              </motion.div>
            </div>

            {/* 4 Pillars Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-10 border-t border-[#D4748A]/20">
              {[
                { title: '100% Natural', desc: 'No artificial tenderizers or preservatives ever used.' },
                { title: '4.9★ Average', desc: 'Consistently rated top tier across delivery platforms.' },
                { title: 'Family Recipes', desc: 'Marinades passed down through generations of chefs.' },
                { title: 'Cooked to Order', desc: 'Piping hot right off the charcoal grill to your plate.' },
              ].map((pillar, idx) => (
                <motion.div
                  key={idx}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                  whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="p-6 rounded-2xl bg-white/50 border border-[#1E2A20]/10 hover:border-[#D4748A]/40 transition-colors duration-300"
                >
                  <h3 className="text-lg font-bold text-[#1E2A20] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-[#1E2A20]/75 leading-relaxed">{pillar.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. CORE VALUES SECTION ───────────────────────────────────── */}
        <section className="relative py-28 px-6 bg-[#1A3A28] text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(204,132,95,0.12)_0,transparent_70%)] pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-xs font-bold tracking-[0.25em] uppercase text-[var(--orange-pale)] mb-3 block">
                WHAT DRIVES US
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white drop-shadow-[0_4px_20px_rgba(212,116,138,0.5)]" style={{ fontFamily: 'var(--font-display)', color: '#FFFFFF', textShadow: '0 2px 15px rgba(255,255,255,0.4)' }}>
                Our <span style={{ color: '#E293A4' }}>Culinary</span> Pillars
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-[var(--green-light)] to-[var(--orange-pale)] mx-auto rounded-full" />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {values.map((v, idx) => (
                <motion.div
                  key={idx}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 50 }}
                  whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="p-8 sm:p-10 rounded-3xl backdrop-blur-2xl bg-black/50 border border-white/15 hover:border-[var(--orange-pale)]/60 shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col justify-between transition-all duration-500 group"
                >
                  <div>
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-[var(--orange-pale)] transition-all duration-500 shadow-inner">
                      {v.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[var(--orange-pale)] transition-colors duration-300" style={{ fontFamily: 'var(--font-display)' }}>
                      {v.title}
                    </h3>
                    <p className="text-base text-[var(--parchment)]/80 leading-relaxed font-light">
                      {v.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. VISIT US & CTA (WARM PARCHMENT) ───────────────────────── */}
        <section
          className="relative py-24 px-6 text-[#1E2A20]"
          style={{
            backgroundColor: '#F4EEE2',
            backgroundImage: `repeating-conic-gradient(rgba(30,42,32,0.018) 0% 25%, transparent 0% 50%)`,
            backgroundSize: '3px 3px',
          }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-bold tracking-[0.25em] uppercase text-[#D4748A] mb-2 block">
                COME DINE WITH US
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Find {name}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {address && (
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-8 rounded-3xl bg-white border border-[#D4748A]/20 shadow-[0_10px_30px_rgba(30,42,32,0.04)] flex gap-5 items-start"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#D4748A]/10 flex items-center justify-center shrink-0 text-[#D4748A]">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1E2A20] text-lg mb-1" style={{ fontFamily: 'var(--font-display)' }}>Location</p>
                    <p className="text-sm text-[#1E2A20]/80 leading-relaxed">{address}</p>
                  </div>
                </motion.div>
              )}

              {phone && (
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-8 rounded-3xl bg-white border border-[#D4748A]/20 shadow-[0_10px_30px_rgba(30,42,32,0.04)] flex gap-5 items-start"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#D4748A]/10 flex items-center justify-center shrink-0 text-[#D4748A]">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1E2A20] text-lg mb-1" style={{ fontFamily: 'var(--font-display)' }}>Direct Phone</p>
                    <a href={`tel:${phone}`} className="text-sm font-semibold text-[#D4748A] hover:underline block">{phone}</a>
                  </div>
                </motion.div>
              )}

              <motion.div
                whileHover={{ y: -4 }}
                className="p-8 rounded-3xl bg-white border border-[#D4748A]/20 shadow-[0_10px_30px_rgba(30,42,32,0.04)] flex gap-5 items-start sm:col-span-2 lg:col-span-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#D4748A]/10 flex items-center justify-center shrink-0 text-[#D4748A]">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-[#1E2A20] text-lg mb-1" style={{ fontFamily: 'var(--font-display)' }}>Opening Hours</p>
                  <p className="text-sm text-[#1E2A20]/80">Daily: 12:00 PM – 1:00 AM</p>
                </div>
              </motion.div>
            </div>

            {/* Banner CTA */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
              whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl bg-gradient-to-br from-[#1A3A28] via-[#122B1D] to-black p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(204,132,95,0.2)_0,transparent_70%)] pointer-events-none" />
              <h3 className="text-3xl sm:text-5xl font-extrabold mb-4 relative z-10 text-white drop-shadow-[0_4px_20px_rgba(212,116,138,0.5)]" style={{ fontFamily: 'var(--font-display)', color: '#FFFFFF', textShadow: '0 2px 15px rgba(255,255,255,0.4)' }}>
                Ready to Experience the <span style={{ color: '#E293A4' }}>Flavour?</span>
              </h3>
              <p className="text-base sm:text-lg text-[var(--parchment)]/85 max-w-xl mx-auto mb-8 font-light relative z-10">
                Browse our full flame-grilled menu and have fresh, piping-hot Lebanese feasts delivered straight to your doorstep.
              </p>
              <Link
                href="/menu"
                className="btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-base shadow-lg shadow-orange-950/50 hover:scale-105 transition-all duration-300 relative z-10"
              >
                Order Online Now <ChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
