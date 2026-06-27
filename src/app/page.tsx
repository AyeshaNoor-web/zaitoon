'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence, type Variants } from 'framer-motion'
import { Clock, ChevronRight, Star, Rocket, MapPin, ShoppingBag, Truck, Phone, MessageCircle, Trophy, Users, Utensils, Leaf, Flame } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileCartBar from '@/components/layout/MobileCartBar'
import MenuItemCard from '@/components/menu/MenuItemCard'
import LocationModal from '@/components/LocationModal'
import { getBranches } from '@/lib/api/branches'
import { getMenuItems, getSiteContent } from '@/lib/api/menu'
import { getFAQs, type FAQ } from '@/lib/api/faqs'
import { getApprovedReviews, type AdminReview } from '@/lib/api/reviews'
import { createClient } from '@/lib/supabase/client'
import ReviewsWall from '@/components/home/ReviewsWall'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useLocationStore } from '@/store/useLocationStore'
import { translations } from '@/lib/translations'
import type { Branch, MenuItem } from '@/types'

const supabase = createClient()

export default function HomePage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [branchCount, setBranchCount] = useState<number>(0)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [aboutContent, setAboutContent] = useState<Record<string, string>>({})
  const { language, isRTL } = useLanguageStore()
  const { locationSet } = useLocationStore()
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [storeHydrated, setStoreHydrated] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const shouldReduceMotion = useReducedMotion()

  const t = translations[language]

  useEffect(() => { requestAnimationFrame(() => setStoreHydrated(true)) }, [])
  useEffect(() => {
    if (!storeHydrated) return
    if (locationSet) { 
      requestAnimationFrame(() => setShowLocationModal(false))
      return 
    }
    const timer = setTimeout(() => setShowLocationModal(true), 1200)
    return () => clearTimeout(timer)
  }, [storeHydrated, locationSet])

  useEffect(() => {
    Promise.all([getBranches(), getMenuItems(), getSiteContent()])
      .then(([b, m, content]) => {
        setBranches(b)
        setMenuItems(m)
        setAboutContent(content)
      })
      .finally(() => {})
    supabase.from('branches').select('id', { count: 'exact', head: true }).eq('is_active', true).then(({ count }) => setBranchCount(count ?? 2))
    getFAQs(true).then(setFaqs).catch(() => {})
    getApprovedReviews().then(setReviews).catch(() => {})
  }, [language])

  const featuredItems = menuItems.filter(i => (i.tags ?? []).includes('bestseller')).slice(0, 8)

  const gridVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } }
  }
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  }

  const steps = [
    { num: '01', icon: MapPin, title: t.step1Title, desc: t.step1Desc },
    { num: '02', icon: ShoppingBag, title: t.step2Title, desc: t.step2Desc },
    { num: '03', icon: Truck, title: t.step3Title, desc: t.step3Desc },
  ]

  return (
    <>
      {showLocationModal && (
        <LocationModal onClose={() => setShowLocationModal(false)} allowBackdropClose={locationSet} />
      )}
      <Navbar />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        role="main"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* ══════════════════════════════════════════════
            HERO SECTION — Fresh green + orange gradient
        ══════════════════════════════════════════════ */}
        <section
          ref={heroRef}
          aria-label="Welcome to Zaitoon"
          className="relative w-full overflow-hidden min-h-[100dvh] flex flex-col justify-between bg-[#1A3A28]"
          style={{ minHeight: '100vh' }}
        >
          {/* HD Background Video Backdrop */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover pointer-events-none transform scale-105"
            style={{ filter: 'brightness(0.85) contrast(1.08)' }}
          >
            <source src="/4440943-hd_1920_1080_25fps.mp4" type="video/mp4" />
          </video>

          {/* Dark readability gradient overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)' }} />

          {/* Main Hero Content */}
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-10 w-full flex flex-col justify-center items-start min-h-full pt-[12vh] sm:pt-[15vh] pb-[8vh] sm:pb-[10vh] pl-[5%] sm:pl-[60px] pr-5 sm:pr-6 flex-grow"
          >
            {/* HERO CONTENT */}
            <div className="w-full max-w-5xl flex flex-col items-start text-left">
              {/* EYEBROW LINE */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-[8px] sm:gap-[10px] mb-[12px] sm:mb-[16px]"
              >
                <span className="w-[18px] sm:w-[24px] h-[2px] bg-[#D4748A] inline-block shrink-0" />
                <span
                  className="text-[9.5px] sm:text-[11px] tracking-[0.14em] sm:tracking-[0.2em] uppercase text-[#D4748A] leading-tight"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
                >
                  FRESH FLAME-GRILLED TASTE FROM THE HEART OF LAHORE
                </span>
              </motion.div>

              <h1 className="flex flex-col gap-0 text-left">
                <motion.span
                  className="text-white"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: '12px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    opacity: 0.5,
                    display: 'block',
                    marginBottom: '4px'
                  }}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 0.5 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                >
                  {language === 'ur' ? t.lahores : "Lahore's"}
                </motion.span>
                <motion.span
                  className="italic leading-[1.02] text-[#D4748A]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 'clamp(44px, 8.5vw, 92px)', textShadow: '0 0 40px rgba(212,116,138,0.3)' }}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  {language === 'ur' ? t.finest : "Finest"}
                </motion.span>
                <motion.span
                  className="leading-[1.02] text-white"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 800,
                    fontSize: 'clamp(34px, 6.5vw, 80px)',
                    letterSpacing: '-0.01em'
                  }}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  {language === 'ur' ? t.bbqGrill : "BBQ & Grill"}
                </motion.span>
              </h1>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-[40px] sm:w-[48px] h-[2px] bg-[#D4748A] mt-[16px] sm:mt-[20px] mb-[18px] sm:mb-[24px] origin-left"
              />

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-[14px] sm:text-[16px] leading-[1.6] sm:leading-[1.7] text-white/[0.7] text-left"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, maxWidth: '480px' }}
              >
                {language === 'ur' ? t.heroDesc : "Slow charcoal. Real smoke. The kind of shawarma Lahore talks about."}
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-row gap-3.5 mt-[18px] sm:mt-[22px] w-full sm:w-auto max-w-[360px] sm:max-w-none"
              >
                <Link
                  href="/menu"
                  className="group relative flex-1 sm:flex-initial min-h-[46px] sm:min-h-[50px] overflow-hidden bg-gradient-to-r from-[#D4748A] to-[#B5364F] border border-[#D4748A]/40 text-white text-[11px] sm:text-[12px] tracking-[0.12em] sm:tracking-[0.14em] uppercase px-6 sm:px-8 py-3 rounded-[8px] flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_8px_25px_rgba(212,116,138,0.45)] hover:-translate-y-[1px] active:translate-y-0 whitespace-nowrap"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    {t.orderNow}
                    <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                </Link>
                <Link
                  href="/menu"
                  className="group flex-1 sm:flex-initial min-h-[46px] sm:min-h-[50px] bg-white/[0.06] backdrop-blur-md border border-white/30 hover:border-white/60 text-white text-[11px] sm:text-[12px] tracking-[0.12em] sm:tracking-[0.14em] uppercase px-6 sm:px-8 py-3 rounded-[8px] flex items-center justify-center gap-2 transition-all duration-300 hover:bg-white/[0.12] hover:shadow-[0_8px_25px_rgba(255,255,255,0.12)] hover:-translate-y-[1px] active:translate-y-0 whitespace-nowrap"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}
                >
                  <span>{t.viewMenu}</span>
                  <Utensils className="w-3.5 h-3.5 opacity-70 transition-all duration-300 group-hover:opacity-100 group-hover:rotate-12" />
                </Link>
              </motion.div>
            </div>
          </motion.div>

        </section>

        {/* ══════════════════════════════════════════════
            ZAITOON KITCHEN TICKET SECTION
        ══════════════════════════════════════════════ */}
        <section
          aria-label="Zaitoon Kitchen Ticket"
          className="relative w-full py-14 sm:py-16 px-6 overflow-hidden z-20"
          style={{
            backgroundColor: '#F4EEE2',
            backgroundImage: `repeating-conic-gradient(rgba(30,42,32,0.018) 0% 25%, transparent 0% 50%)`,
            backgroundSize: '3px 3px',
          }}
        >
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-12 sm:mb-16">
              <span
                className="text-xs font-bold tracking-[0.25em] uppercase mb-2 block"
                style={{ color: '#D4748A' }}
              >
                ZAITOON KITCHEN TICKET
              </span>
              <h2
                className="text-3xl sm:text-5xl font-bold tracking-tight"
                style={{ color: '#1E2A20', fontFamily: 'var(--font-display)' }}
              >
                Four Things We Never Skip
              </h2>
            </div>

            {/* Ticket Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4">
              {[
                {
                  num: '01',
                  label: '01 — THE GRILL',
                  desc: 'Real charcoal, not gas. Marinated up to 12 hours, then charred till the edges catch flame.',
                },
                {
                  num: '02',
                  label: '02 — THE KITCHEN',
                  desc: 'Every sauce made fresh that morning. No shortcuts, no pre-mixed bases.',
                },
                {
                  num: '03',
                  label: '03 — THE ROUTE',
                  desc: 'Sealed in heat-locked packaging the second it leaves the grill. At your door inside 30 minutes.',
                },
                {
                  num: '04',
                  label: '04 — THE VERDICT',
                  desc: "50,000+ orders in Lahore. 4.9 stars because the chicken's never dry.",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04, rotate: 2.5 }}
                  whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.12,
                    ease: 'easeOut',
                  }}
                  className={`relative py-8 lg:py-6 px-4 sm:px-8 flex flex-col justify-between ${
                    index < 3
                      ? 'border-b border-dashed lg:border-b-0 lg:border-r border-[#D4748A]/40'
                      : ''
                  }`}
                >
                  {/* Ghost Numeral Background */}
                  <span
                    className="absolute top-0 left-4 sm:left-6 select-none pointer-events-none font-bold leading-none tracking-tighter"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(90px, 9vw, 120px)',
                      color: 'rgba(181, 54, 79, 0.06)',
                    }}
                  >
                    {item.num}
                  </span>

                  {/* Content Block */}
                  <div className="relative z-10 pt-6 sm:pt-8">
                    <h3
                      className="text-sm font-bold tracking-widest uppercase mb-3"
                      style={{ color: '#1E2A20', fontFamily: 'var(--font-display)' }}
                    >
                      {item.label}
                    </h3>
                    <p
                      className="text-base sm:text-lg leading-relaxed font-normal"
                      style={{ color: '#1E2A20', fontFamily: 'var(--font-body)' }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            FAN FAVOURITES — Enhanced cards
        ══════════════════════════════════════════════ */}
        <section aria-label="Fan Favourite dishes" className="py-[88px] px-6" style={{ background: 'linear-gradient(180deg, var(--cream) 0%, var(--parchment) 100%)' }}>
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-baseline justify-between mb-10"
            >
              <div className={isRTL ? 'text-right' : ''}>
                <span className="section-label">{t.ourSignatures}</span>
                <h2 className="text-[var(--charcoal)]">{t.fanFavourites}</h2>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    transformOrigin: isRTL ? 'right' : 'left',
                    height: 3,
                    background: 'linear-gradient(90deg, var(--orange-warm), var(--green-base))',
                    width: 64, marginTop: '20px', borderRadius: 99,
                    marginLeft: isRTL ? 'auto' : 0
                  }}
                />
              </div>
              <Link
                href="/menu"
                className="text-[13px] font-[700] mt-5 sm:mt-0 flex items-center gap-1 group transition-colors"
                style={{ color: 'var(--green-dark)' }}
              >
                {t.viewAll}
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <div className="relative">
              {/* Fade edges on mobile scroll */}
              <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, var(--parchment), transparent)' }} />
              <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(-90deg, var(--parchment), transparent)' }} />

              <motion.ul
                role="list"
                variants={gridVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="flex gap-5 overflow-x-auto scrollbar-hide pb-6 pt-4 px-2 -mx-2 snap-x"
              >
                {featuredItems.map((item) => (
                  <motion.li key={item.id} variants={cardVariants} className="snap-start shrink-0 w-[264px]">
                    <MenuItemCard item={item} />
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════
            HOW IT WORKS — Glassmorphism cards
        ══════════════════════════════════════════════ */}
        <section
          aria-label="How to order from Zaitoon"
          className="relative py-[100px] px-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1F221B 0%, #34392B 60%, #262A21 100%)' }}
        >
          {/* Background orbs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-12"
              style={{ background: 'radial-gradient(circle, rgba(156,175,136,0.22) 0%, transparent 70%)' }} />
          </div>

          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(250,243,224,0.6) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}
          />

          <div className="relative z-10 max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mb-[56px] text-center flex flex-col items-center"
            >
              <span className="section-label" style={{ justifyContent: 'center' }}>{t.simpleProcess}</span>
              <h2 className="text-white">{t.howItWorks}</h2>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  transformOrigin: 'center', height: 3,
                  background: 'linear-gradient(90deg, var(--orange-warm), var(--green-base))',
                  width: 64, marginTop: '20px', borderRadius: 99
                }}
              />
            </motion.div>

            <ol role="list" className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-[52px] left-[calc(16.66%+26px)] right-[calc(16.66%+26px)] h-[1px] z-0"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(156,175,136,0.35), transparent)' }} />

              {steps.map((step, i) => (
                <motion.li
                  key={step.num}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative p-8 pt-12 z-10 text-center flex flex-col items-center rounded-[18px] ${isRTL ? 'text-right' : ''}`}
                  style={{
                    background: 'rgba(156,175,136,0.10)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(156,175,136,0.25)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(156,175,136,0.14)'
                  }}
                  whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(156,175,136,0.30)' }}
                >
                  {/* Watermark number */}
                  <span className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} font-display text-[72px] font-[800] leading-none pointer-events-none select-none`}
                    style={{ color: 'rgba(156,175,136,0.10)' }}>
                    {step.num}
                  </span>

                  {/* Icon */}
                  <div className="w-[56px] h-[56px] rounded-[14px] flex items-center justify-center text-[26px] mb-6"
                    style={{
                      background: 'rgba(156,175,136,0.22)',
                      border: '1.5px solid rgba(204,132,95,0.52)',
                      boxShadow: '0 4px 16px rgba(204,132,95,0.16)'
                    }}>
                    <step.icon className="w-6 h-6 text-[var(--orange-pale)]" />
                  </div>

                  <div className="label mb-3" style={{ color: 'var(--orange-warm)' }}>{step.num}</div>
                  <h3 className="text-white mb-4 text-[22px]">{step.title}</h3>
                  <p className="text-[14px] font-[300] leading-[1.75] max-w-[240px]" style={{ color: 'rgba(250,243,224,0.82)' }}>
                    {step.desc}
                  </p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            BRANCHES — Clean cards with glow hover
        ══════════════════════════════════════════════ */}
        <section id="branches" aria-label="Our branches" className="py-[88px] px-6 bg-[var(--cream)]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`mb-12 ${isRTL ? 'text-right' : ''}`}
            >
              <span className="section-label">{t.branchCount}</span>
              <h2 className="text-[var(--charcoal)]">Find Us Near You</h2>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  transformOrigin: isRTL ? 'right' : 'left',
                  height: 3,
                  background: 'linear-gradient(90deg, var(--orange-warm), var(--green-base))',
                  width: 64, marginTop: '20px', borderRadius: 99,
                  marginLeft: isRTL ? 'auto' : 0
                }}
              />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {branches.map((branch, i) => (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4 }}
                  className="group bg-white rounded-[18px] p-7 transition-all duration-300 cursor-default"
                  style={{
                    border: '1.5px solid var(--linen)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--green-base)'
                    el.style.boxShadow = '0 12px 40px rgba(156,175,136,0.24), 0 4px 12px rgba(0,0,0,0.06)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--linen)'
                    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="font-display text-[21px] font-[700] text-[var(--charcoal)] mb-1">{branch.name}</h3>
                      <p className="text-[13px] leading-relaxed text-[var(--stone)]">{branch.address}</p>
                    </div>
                    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                      style={{
                        background: 'linear-gradient(135deg, var(--green-dark), var(--green-base))',
                        boxShadow: '0 4px 12px rgba(156,175,136,0.40)'
                      }}>
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    {branch.hours && (
                      <div className="flex items-center gap-2.5 text-[13px] text-[var(--stone)]">
                        <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--green-dark)' }} />
                        <span>{branch.hours}</span>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-2.5 text-[13px] text-[var(--stone)]">
                        <Phone className="w-3.5 h-3.5" style={{ color: 'var(--green-dark)' }} />
                        <a href={`tel:${branch.phone}`} className="hover:text-[var(--green-dark)] transition-colors font-[500]">
                          {branch.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-5 border-t border-[var(--linen)]">
                    {branch.whatsapp && (
                      <a
                        href={`https://wa.me/${branch.whatsapp.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-[700] text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, var(--green-dark), var(--green-base))', boxShadow: '0 3px 10px rgba(156,175,136,0.35)' }}
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                    )}
                    {branch.phone && (
                      <a
                        href={`tel:${branch.phone}`}
                        className="flex items-center gap-2 border-[1.5px] border-[var(--linen)] text-[var(--charcoal)] px-4 py-2.5 rounded-[10px] text-[13px] font-[700] hover:border-[var(--green-base)] hover:text-[var(--green-dark)] transition-all hover:-translate-y-0.5"
                      >
                        <Phone className="w-4 h-4" /> Call
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            ABOUT SECTION — Quick brand intro
        ══════════════════════════════════════════════ */}
        <section
          aria-label="About Zaitoon"
          className="relative py-[88px] px-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1F221B 0%, #34392B 60%, #262A21 100%)' }}
        >
          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(250,243,224,0.6) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}
          />
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-14 items-center">
              {/* Text side */}
              <motion.div
                initial={{ opacity: 0, x: -32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={isRTL ? 'text-right' : ''}
              >
                <span className="section-label" style={{ color: 'var(--green-light)' }}>Our Story</span>
                <h2 className="text-white mt-2 mb-6">
                  {aboutContent['about_restaurant_name'] || 'Zaitoon'}
                  <span className="block italic text-[var(--orange-pale)] text-[0.7em]">
                    {aboutContent['about_founded_year'] ? `Est. ${aboutContent['about_founded_year']}` : 'Est. 2018'}
                  </span>
                </h2>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    transformOrigin: isRTL ? 'right' : 'left',
                    height: 3,
                    background: 'linear-gradient(90deg, var(--orange-warm), var(--green-base))',
                    width: 64, marginBottom: '24px', borderRadius: 99,
                    marginLeft: isRTL ? 'auto' : 0
                  }}
                />
                <p className="text-[15px] font-[300] leading-[1.8]" style={{ color: 'rgba(250,243,224,0.78)' }}>
                  {aboutContent['about_story_en'] || 'We started with a simple dream: to bring the rich, authentic flavours of Lebanese cuisine to the streets of Pakistan. Every dish we prepare is a love letter to our heritage.'}
                </p>
                <p className="text-[14px] font-[300] leading-[1.7] mt-4" style={{ color: 'rgba(250,243,224,0.6)' }}>
                  {aboutContent['about_mission'] || 'Bringing authentic Lebanese flavours to every table.'}
                </p>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-2xl font-[700] text-[13px] tracking-[0.06em] transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, var(--orange-warm), #A6524F)',
                    color: '#fff',
                    boxShadow: '0 6px 20px rgba(204,132,95,0.35)',
                  }}
                >
                  Our Full Story <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>

              {/* Stats / visual side */}
              <motion.div
                initial={{ opacity: 0, x: 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { icon: <Trophy className="w-8 h-8" />, value: aboutContent['about_stat1_value'] || '7+', label: aboutContent['about_stat1_label'] || 'Years of Excellence', color: '#F59E0B' },
                  { icon: <Users className="w-8 h-8" />, value: aboutContent['about_stat2_value'] || '50,000+', label: aboutContent['about_stat2_label'] || 'Happy Customers', color: '#10B981' },
                  { icon: <Utensils className="w-8 h-8" />, value: aboutContent['about_stat3_value'] || '80+', label: aboutContent['about_stat3_label'] || 'Menu Items', color: '#F43F5E' },
                  { icon: <Leaf className="w-8 h-8" />, value: '100%', label: 'Fresh Ingredients', color: '#84CC16' },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                    className="rounded-2xl p-6 text-center flex flex-col items-center justify-center"
                    style={{
                      background: 'rgba(156,175,136,0.10)',
                      border: '1px solid rgba(156,175,136,0.22)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <div className="mb-3" style={{ color: s.color }}>{s.icon}</div>
                    <p className="text-2xl font-[800] text-white mb-1">{s.value}</p>
                    <p className="text-[11px] font-[600] uppercase tracking-wider" style={{ color: 'rgba(250,243,224,0.55)' }}>{s.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>


        {faqs.length > 0 && (
          <section className="w-full max-w-3xl mx-auto px-4 lg:px-8 py-16">
            <p className="section-label mb-3 text-center">Got Questions?</p>
            <h2 className="text-center text-[var(--charcoal)] mb-10" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => {
                const isOpen = openFaq === faq.id
                const question = (language === 'ur' && faq.question_ur) ? faq.question_ur : faq.question
                const answer   = (language === 'ur' && faq.answer_ur)   ? faq.answer_ur   : faq.answer
                return (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                    className="rounded-[16px] overflow-hidden"
                    style={{
                      background: isOpen ? 'white' : 'rgba(255,255,255,0.75)',
                      border: isOpen ? '1.5px solid rgba(184,98,94,0.30)' : '1px solid var(--linen)',
                      boxShadow: isOpen ? '0 8px 24px rgba(76,92,45,0.10)' : 'none',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      className={`w-full flex items-center justify-between px-5 py-4 text-left gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}
                      aria-expanded={isOpen}
                    >
                      <span className="text-[15px] font-[700] text-[var(--charcoal)] leading-snug flex-1">
                        {question}
                      </span>
                      <span
                        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300"
                        style={{
                          background: isOpen ? 'linear-gradient(135deg, #B8625E, #A6524F)' : 'rgba(184,98,94,0.12)',
                          color: isOpen ? 'white' : 'var(--charcoal)',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      >
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 text-[14px] leading-relaxed text-[var(--stone)]"
                            style={isRTL ? { textAlign: 'right' } : {}}>
                            {answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </section>
        )}

        {/* Customer Reviews Wall */}
        <ReviewsWall reviews={reviews} />

      </motion.main>

      <Footer />
      <MobileCartBar />
    </>
  )
}
