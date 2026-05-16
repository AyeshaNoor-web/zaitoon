'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { motion, useScroll, useTransform, AnimatePresence, type Variants } from 'framer-motion'
import { Clock, ChevronRight, Star, Rocket, MapPin, ShoppingBag, Truck, Phone, MessageCircle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileCartBar from '@/components/layout/MobileCartBar'
import MenuItemCard from '@/components/menu/MenuItemCard'
import LocationModal from '@/components/LocationModal'
import { getBranches } from '@/lib/api/branches'
import { getMenuItems, getSiteContent } from '@/lib/api/menu'
import { getFAQs, type FAQ } from '@/lib/api/faqs'
import { createClient } from '@/lib/supabase/client'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useLocationStore } from '@/store/useLocationStore'
import { translations } from '@/lib/translations'

const supabase = createClient()

interface HomeClientProps {
  children?: React.ReactNode // For inserting the ReviewsSection
}

export default function HomeClient({ children }: HomeClientProps) {
  const [branches, setBranches] = useState<any[]>([]) // Simplified any for now, will match existing types
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [branchCount, setBranchCount] = useState<number>(0)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const { language, isRTL } = useLanguageStore()
  const { locationSet } = useLocationStore()
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [storeHydrated, setStoreHydrated] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  const t = translations[language]
  const [heroIntro, setHeroIntro] = useState(
    language === 'ur'
      ? 'اصلی لبنانی ذائقہ، فلیم گرل چکن کے ساتھ'
      : 'Fresh Lebanese Taste with Flame-Grilled Chicken'
  )

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
        const key = (language === 'ur' ? 'hero_tagline_ur' : 'hero_tagline_en') as keyof typeof content
        if (content[key]) setHeroIntro(content[key])
      })
      .finally(() => {})
    supabase.from('branches').select('id', { count: 'exact', head: true }).eq('is_active', true).then(({ count }) => setBranchCount(count ?? 2))
    getFAQs(true).then(setFaqs).catch(() => {})
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
        {/* HERO SECTION */}
        <section
          ref={heroRef}
          aria-label="Welcome to Zaitoon"
          className="relative w-full overflow-hidden min-h-[100dvh]"
          style={{
            backgroundImage: `
              linear-gradient(140deg, rgba(31,34,27,0.86) 0%, rgba(52,57,43,0.83) 45%, rgba(38,42,33,0.88) 100%),
              url("/hero-grilled-chicken.png")
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center 42%',
          }}
        >
          {/* Animated ambient orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.20, 0.30, 0.20] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-[-15%] left-[-8%] w-[600px] h-[600px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(156,175,136,0.38) 0%, transparent 70%)' }}
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.18, 0.28, 0.18] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute bottom-[-10%] right-[-5%] w-[520px] h-[520px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(204,132,95,0.28) 0%, transparent 70%)' }}
            />
          </div>

          <div
            className="hidden lg:block absolute top-0 right-0 bottom-0"
            style={{
              width: '42%',
              background: 'linear-gradient(180deg, rgba(26,58,40,0.9) 0%, rgba(15,42,28,1) 100%)',
              clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0% 100%)'
            }}
          />

          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(156,175,136,0.08) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}
          />

          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center lg:items-center min-h-[100dvh] pt-[120px] pb-[80px] gap-8"
          >
            <div className="w-full lg:w-[68%] flex flex-col items-start pt-8 lg:pt-0">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <p className={`section-label mb-6 text-[var(--orange-warm)] ${isRTL ? 'text-right' : ''}`}>
                  {heroIntro}
                </p>
              </motion.div>

              <h1 className={`text-white ${isRTL ? 'text-right' : ''}`}>
                <motion.span className="block" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.1 }}>
                  {t.lahores}
                </motion.span>
                <motion.span className="block italic" style={{ color: 'var(--orange-pale)', textShadow: '0 0 60px rgba(204,132,95,0.35)' }} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
                  {t.finest}
                </motion.span>
                <motion.span className="block" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }}>
                  {t.bbqGrill}
                </motion.span>
              </h1>

              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 0.55 }} className={`h-[3px] w-[72px] mt-7 mb-7 rounded-full ${isRTL ? 'origin-right float-right' : 'origin-left'}`} style={{ background: 'linear-gradient(90deg, var(--orange-warm), var(--green-base))' }} />

              <motion.div initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.65 }} className={isRTL ? 'text-right' : ''}>
                <p className="text-[17px] font-[300] leading-[1.7] max-w-md" style={{ color: 'rgba(250,243,224,0.65)' }}>
                  {t.heroDesc}
                </p>
                <div className={`mt-4 flex flex-wrap items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {['Avg delivery 28 min', '4.9 customer rating', 'Live order tracking'].map((line) => (
                    <span key={line} className="text-[11px] font-[700] tracking-[0.06em] uppercase px-3 py-1.5 rounded-full" style={{ background: 'rgba(188,217,162,0.20)', border: '1px solid rgba(188,217,162,0.38)', color: 'rgba(250,243,224,0.86)' }}>
                      {line}
                    </span>
                  ))}
                </div>
                <div className={`flex flex-col sm:flex-row gap-3 mt-8 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <Link href="/menu" className="btn-primary w-full sm:w-auto">{t.orderNow} <ChevronRight className="w-4 h-4" /></Link>
                  <Link href="/menu" className="btn-secondary w-full sm:w-auto">{t.viewMenu}</Link>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }} className="flex flex-col items-center justify-center flex-1 shrink-0 order-first lg:order-none mb-12 lg:mb-0">
              <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="relative flex items-center justify-center w-full">
                <div className="absolute rounded-full pointer-events-none" style={{ inset: '-15%', background: 'radial-gradient(circle, rgba(76,92,45,0.4) 0%, transparent 70%)', filter: 'blur(50px)' }} />
                <div className="relative z-10 w-full max-w-[320px] lg:max-w-[500px] aspect-square overflow-hidden rounded-[40px] shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/10">
                  <Image src="/photo.PNG" alt="Zaitoon logo" fill className="object-cover" priority />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* FAN FAVOURITES */}
        <section aria-label="Signatures" className="py-[88px] px-6" style={{ background: 'linear-gradient(180deg, var(--cream) 0%, var(--parchment) 100%)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-baseline justify-between mb-10">
              <div className={isRTL ? 'text-right' : ''}>
                <span className="section-label">{t.ourSignatures}</span>
                <h2 className="text-[var(--charcoal)]">{t.fanFavourites}</h2>
              </div>
              <Link href="/menu" className="text-[13px] font-[700] mt-5 sm:mt-0 flex items-center gap-1" style={{ color: 'var(--green-dark)' }}>
                {t.viewAll} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <ul className="flex gap-5 overflow-x-auto scrollbar-hide pb-6 pt-4 px-2 -mx-2 snap-x">
              {featuredItems.map((item) => (
                <li key={item.id} className="snap-start shrink-0 w-[264px]">
                  <MenuItemCard item={item} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="relative py-[100px] px-6" style={{ background: 'linear-gradient(135deg, #1F221B 0%, #34392B 60%, #262A21 100%)' }}>
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="mb-[56px] text-center flex flex-col items-center">
              <span className="section-label" style={{ justifyContent: 'center' }}>{t.simpleProcess}</span>
              <h2 className="text-white">{t.howItWorks}</h2>
            </div>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {steps.map((step) => (
                <li key={step.num} className="relative p-8 pt-12 z-10 text-center flex flex-col items-center rounded-[18px]" style={{ background: 'rgba(156,175,136,0.10)', border: '1px solid rgba(156,175,136,0.25)' }}>
                  <div className="w-[56px] h-[56px] rounded-[14px] flex items-center justify-center text-[26px] mb-6" style={{ background: 'rgba(156,175,136,0.22)' }}>
                    <step.icon className="w-6 h-6 text-[var(--orange-pale)]" />
                  </div>
                  <h3 className="text-white mb-4 text-[22px]">{step.title}</h3>
                  <p className="text-[14px] font-[300] leading-[1.75]" style={{ color: 'rgba(250,243,224,0.82)' }}>{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* REVIEWS SECTION INSERTED HERE */}
        {children}

        {/* BRANCHES */}
        <section id="branches" className="py-[88px] px-6 bg-[var(--cream)]">
          <div className="max-w-7xl mx-auto">
            <div className={`mb-12 ${isRTL ? 'text-right' : ''}`}>
              <span className="section-label">{t.branchCount}</span>
              <h2 className="text-[var(--charcoal)]">Find Us Near You</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {branches.map((branch) => (
                <div key={branch.id} className="bg-white rounded-[18px] p-7 border border-[var(--linen)] shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="font-display text-[21px] font-[700] text-[var(--charcoal)] mb-1">{branch.name}</h3>
                      <p className="text-[13px] text-[var(--stone)]">{branch.address}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        {faqs.length > 0 && (
          <section className="w-full max-w-3xl mx-auto px-4 py-16">
            <h2 className="text-center text-[var(--charcoal)] mb-10">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="rounded-[16px] border border-[var(--linen)] p-4">
                   <p className="font-bold">{language === 'ur' ? faq.question_ur : faq.question}</p>
                   <p className="text-sm mt-2">{language === 'ur' ? faq.answer_ur : faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </motion.main>

      <Footer />
      <MobileCartBar />
    </>
  )
}
