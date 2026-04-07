'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { motion, type Variants } from 'framer-motion'
import { Star, Truck, Zap, Award } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileCartBar from '@/components/layout/MobileCartBar'
import MenuItemCard from '@/components/menu/MenuItemCard'
import LocationModal from '@/components/LocationModal'
import { getBranches } from '@/lib/api/branches'
import { getMenuItems } from '@/lib/api/menu'
import { createClient } from '@/lib/supabase/client'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useLocationStore } from '@/store/useLocationStore'
import { translations } from '@/lib/translations'

const supabase = createClient()

export default function HomePage() {
  const [loaded, setLoaded] = useState(false)
  const [branches, setBranches] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [customerCount, setCustomerCount] = useState<number | null>(null)
  const [branchCount, setBranchCount] = useState<number | null>(null)
  const { language, isRTL } = useLanguageStore()
  
  const { locationSet } = useLocationStore()
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [storeHydrated, setStoreHydrated] = useState(false)

  const t = translations[language]

  // Wait for Zustand to hydrate from localStorage before checking
  useEffect(() => {
    setStoreHydrated(true)
  }, [])

  useEffect(() => {
    // Only run after store has hydrated from localStorage
    if (!storeHydrated) return

    if (locationSet) {
      // User already set location before — DO NOT show modal
      setShowLocationModal(false)
      return
    }

    // First time visitor — show modal after 1.2s delay
    const timer = setTimeout(() => {
      setShowLocationModal(true)
    }, 1200)

    return () => clearTimeout(timer)
  }, [storeHydrated, locationSet])

  const handleLocationSet = () => {
    setShowLocationModal(false)
  }

  useEffect(() => {
    Promise.all([getBranches(), getMenuItems()])
      .then(([b, m]) => {
        setBranches(b)
        setMenuItems(m)
      })
      .finally(() => {
        setLoaded(true)
      })

    // Live stats
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setCustomerCount(count ?? 0))

    supabase
      .from('branches')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .then(({ count }) => setBranchCount(count ?? 2))
  }, [])

  const featuredItems = menuItems.filter(i => (i.tags ?? []).includes('bestseller')).slice(0, 8)

  const gridVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } }
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
  }

  return (
    <>
      {showLocationModal && (
        <LocationModal 
          onClose={handleLocationSet}
          allowBackdropClose={locationSet}
        />
      )}
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        role="main"
        dir={isRTL ? 'rtl' : 'ltr'}
        className={isRTL ? 'font-[urdu-font-placeholder]' : ''}
      >
        {/* 🔥 HERO SECTION */}
        <section aria-label="Welcome to Zaitoon" className="relative w-full overflow-hidden bg-[var(--olive-darkest)] min-h-[100dvh]">
          {/* Decorative right panel (desktop only) */}
          <div
            className="hidden lg:block absolute top-0 right-0 bottom-0 bg-[var(--olive-dark)]"
            style={{
              width: '42%',
              clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0% 100%)'
            }}
          />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center justify-between min-h-[100dvh] pt-[120px] pb-[80px]">

            {/* HERO LEFT CONTENT */}
            <div className="lg:w-[50%] flex flex-col items-start pt-8 lg:pt-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <p className={`section-label mb-6 text-[var(--amber-warm)] ${isRTL ? 'text-right' : ''}`}>
                  {t.est}
                </p>
              </motion.div>

                <h1 className={`text-white ${isRTL ? 'text-right' : ''}`}>
                  <motion.span
                    className="block"
                    initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.65, delay: 0, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {t.lahores}
                  </motion.span>
                  <motion.span
                    className="block text-[var(--amber-pale)] italic"
                    initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {t.finest}
                  </motion.span>
                  <motion.span
                    className="block"
                    initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {t.bbqGrill}
                  </motion.span>
                </h1>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className={`h-[3px] w-[64px] bg-[var(--amber-warm)] mt-6 mb-6 ${isRTL ? 'origin-right float-right' : 'origin-left'}`}
              />

              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className={isRTL ? 'text-right' : ''}
              >
                <p className="text-[17px] font-[300] text-[rgba(253,248,240,0.6)] leading-[1.6] max-w-md">
                  {t.heroDesc}
                </p>

                <div className={`flex flex-col sm:flex-row gap-4 mt-8 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <Link href="/menu" className="btn-primary w-full sm:w-auto">
                    {t.orderNow} →
                  </Link>
                  <Link href="/menu" className="btn-secondary w-full sm:w-auto">
                    {t.viewMenu}
                  </Link>
                </div>

                <div className={`flex flex-wrap items-center gap-6 mt-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {[
                    { icon: '⭐', label: t.rating },
                    { icon: '🚀', label: t.heroDelivery },
                    { icon: '📍', label: branchCount !== null ? `${branchCount} ${t.branchCount}` : '…' },
                  ].map((badge, i) => (
                    <div key={i} className={`flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[24px]">{badge.icon}</span>
                        <span className="font-[300] text-[13px] text-white/50">{badge.label}</span>
                      </div>
                      {i < 2 && <div className="h-[24px] w-[1px] bg-[rgba(253,248,240,0.15)] hidden sm:block" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* HERO RIGHT PANEL (Desktop Only) */}
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="hidden lg:flex w-[48%] relative justify-center"
            >
              <figure className="relative w-full max-w-[500px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=85"
                  alt="Zaitoon Special Shawarma — premium meat roasted on charcoal"
                  loading="lazy"
                  width={500}
                  height={600}
                  className="w-full h-[600px] object-cover rounded-[8px]"
                />

                <figcaption className="text-center mt-3 text-[12px] text-[var(--amber-pale)]">
                  Zaitoon Special Shawarma — Rs. 790
                </figcaption>

                <div className={`absolute top-4 ${isRTL ? 'left-[-24px]' : 'right-[-24px]'} bg-[var(--amber-warm)] text-[var(--olive-darkest)] rounded-[4px] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.15)]`}>
                  <div className="font-display text-[32px] font-[800] leading-none mb-1">
                    {customerCount !== null ? `${customerCount.toLocaleString()}+` : '…'}
                  </div>
                  <div className="text-[12px] font-[600] uppercase tracking-[0.1em]">{t.happyCustomers}</div>
                </div>
              </figure>
            </motion.div>

          </div>
        </section>

        {/* 🍽️ FAN FAVOURITES SECTION */}
        <section aria-label="Fan Favourite dishes" className="bg-[var(--cream)] py-[80px] px-6">
          <div className="max-w-7xl mx-auto">

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row items-baseline justify-between mb-8"
            >
              <div className={isRTL ? 'text-right' : ''}>
                <span className="section-label">{t.ourSignatures}</span>
                <h2 className="text-[var(--charcoal)]">{t.fanFavourites}</h2>

                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: isRTL ? 'right' : 'left', height: 3, backgroundColor: 'var(--amber-warm)', width: 56, marginTop: '20px', marginLeft: isRTL ? 'auto' : '0' }}
                />
              </div>

              <Link href="/menu" className="text-[13px] text-[var(--olive-base)] hover:underline font-[600] mt-4 sm:mt-0">
                {t.viewAll}
              </Link>
            </motion.div>

            <div className="relative">
              <motion.ul
                role="list"
                variants={gridVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="flex gap-6 overflow-x-auto scrollbar-hide pb-6 pt-4 px-2 -mx-2 snap-x"
              >
                {featuredItems.map((item, i) => (
                  <motion.li key={item.id} variants={cardVariants} className="snap-start shrink-0 w-[260px]">
                    <MenuItemCard item={item} />
                  </motion.li>
                ))}
              </motion.ul>
            </div>

          </div>
        </section>

        {/* 🔢 HOW IT WORKS SECTION */}
        <section aria-label="How to order from Zaitoon" className="bg-[var(--olive-dark)] py-[96px] px-6">
          <div className="max-w-7xl mx-auto">

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mb-[40px] text-center flex flex-col items-center"
            >
              <span className="section-label" style={{ justifyContent: 'center' }}>{t.simpleProcess}</span>
              <h2 className="text-white">{t.howItWorks}</h2>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'center', height: 3, backgroundColor: 'var(--amber-warm)', width: 56, marginTop: '20px' }}
              />
            </motion.div>

            <ol role="list" className="grid grid-cols-1 md:grid-cols-3 gap-8 relative mt-16">

              {/* Decorative connecting lines (desktop only) */}
              <div className="hidden md:block absolute top-[48px] left-[16%] right-[16%] h-[2px] bg-[var(--amber-rich)] opacity-30 z-0" />

              {[
                { num: '01', title: t.step1Title, desc: t.step1Desc },
                { num: '02', title: t.step2Title, desc: t.step2Desc },
                { num: '03', title: t.step3Title, desc: t.step3Desc },
              ].map((step, i) => (
                <motion.li
                  key={step.num}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100, delay: i * 0.15 }}
                  className={`card-dark relative p-8 pt-12 z-10 text-center flex flex-col items-center ${isRTL ? 'text-right' : ''}`}
                >
                  <span className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} font-display text-[72px] font-[800] leading-none text-[rgba(253,248,240,0.06)] pointer-events-none`}>
                    {step.num}
                  </span>

                  <div className="w-[52px] h-[52px] bg-[var(--olive-mid)] border-[2px] border-[var(--amber-warm)] rounded-[8px] flex items-center justify-center text-[24px] mb-6 shadow-[0_4px_16px_rgba(217,119,6,0.15)]">
                    {i === 0 ? '📍' : i === 1 ? '🛒' : '🚀'}
                  </div>

                  <div className="label text-[var(--amber-warm)] mb-3">{step.num}</div>
                  <h3 className="text-white mb-4 text-[22px]">{step.title}</h3>
                  <p className="text-[14px] font-[300] text-[rgba(253,248,240,0.55)] leading-[1.7] max-w-[240px]">
                    {step.desc}
                  </p>
                </motion.li>
              ))}
            </ol>

          </div>
        </section>

        {/* 📍 BRANCHES SECTION */}
        <section id="branches" aria-label="Our branches" className="bg-[var(--cream)] py-[80px] px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className={`mb-12 ${isRTL ? 'text-right' : ''}`}
            >
              <span className="section-label">{t.branchCount}</span>
              <h2 className="text-[var(--charcoal)]">Find Us Near You</h2>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: isRTL ? 'right' : 'left', height: 3, backgroundColor: 'var(--amber-warm)', width: 56, marginTop: '20px', marginLeft: isRTL ? 'auto' : '0' }}
              />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {branches.map((branch: any, i: number) => (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white rounded-[8px] border-[2px] border-[var(--linen)] p-6 hover:border-[var(--amber-warm)] transition-all hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-display text-[20px] font-[700] text-[var(--charcoal)] mb-1">{branch.name}</h3>
                      <p className="text-[13px] text-[var(--stone)] leading-relaxed">{branch.address}</p>
                    </div>
                    <div className="w-12 h-12 bg-[var(--olive-darkest)] rounded-[6px] flex items-center justify-center shrink-0">
                      <span className="text-2xl">📍</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    {branch.hours && (
                      <div className="flex items-center gap-2 text-[13px] text-[var(--stone)]">
                        <span>🕐</span>
                        <span>{branch.hours}</span>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-2 text-[13px] text-[var(--stone)]">
                        <span>📞</span>
                        <a href={`tel:${branch.phone}`} className="hover:text-[var(--olive-base)] transition-colors">{branch.phone}</a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[var(--linen)]">
                    {branch.whatsapp && (
                      <a
                        href={`https://wa.me/${branch.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-[6px] text-[13px] font-bold hover:bg-[#20bd5a] transition-colors"
                      >
                        <span>💬</span> WhatsApp
                      </a>
                    )}
                    {branch.phone && (
                      <a
                        href={`tel:${branch.phone}`}
                        className="flex items-center gap-2 border-[2px] border-[var(--linen)] text-[var(--charcoal)] px-4 py-2 rounded-[6px] text-[13px] font-bold hover:border-[var(--olive-base)] hover:text-[var(--olive-base)] transition-colors"
                      >
                        <span>📞</span> Call
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      </motion.main>

      <Footer />
      <MobileCartBar />
    </>
  )
}
