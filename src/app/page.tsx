'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion, AnimatePresence, type Variants } from 'framer-motion'
import {
  ArrowRight, ArrowLeft, Clock, MapPin, Phone, MessageCircle, Navigation,
  ShoppingBag, Truck, Plus, Megaphone,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileCartBar from '@/components/layout/MobileCartBar'
import MenuItemCard from '@/components/menu/MenuItemCard'
import { MenuCardSkeleton } from '@/components/menu/LoadingSkeleton'
import LocationModal from '@/components/LocationModal'
import ReviewsWall from '@/components/home/ReviewsWall'
import { getBranches } from '@/lib/api/branches'
import { getMenuItems, getSiteContent } from '@/lib/api/menu'
import { getFAQs, type FAQ } from '@/lib/api/faqs'
import { getApprovedReviews, type AdminReview } from '@/lib/api/reviews'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useLocationStore } from '@/store/useLocationStore'
import { useHydrated } from '@/store/hydration'
import { translations } from '@/lib/translations'
import { SITE, waLink } from '@/lib/site'
import type { Branch, MenuItem } from '@/types'

const EASE = [0.16, 1, 0.3, 1] as const

const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

const TICKET = [
  { num: '01', label: 'The grill', desc: 'Real charcoal, not gas. Marinated up to 12 hours, then charred until the edges catch flame.' },
  { num: '02', label: 'The kitchen', desc: 'Every sauce made fresh that morning. No shortcuts, no pre-mixed bases.' },
  { num: '03', label: 'The route', desc: 'Sealed in heat-locked packaging the second it leaves the grill, and at your door inside 30 minutes.' },
  { num: '04', label: 'The verdict', desc: "50,000+ orders in Lahore. 4.9 stars, because the chicken is never dry." },
]

export default function HomePage() {
  const hydrated = useHydrated()
  const reduceMotion = useReducedMotion()
  const { language, isRTL } = useLanguageStore()
  const { locationSet } = useLocationStore()
  const t = translations[language]

  const [branches, setBranches] = useState<Branch[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [content, setContent] = useState<Record<string, string>>({})
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const railRef = useRef<HTMLUListElement>(null)

  // First visit: prompt for a delivery location shortly after the page settles
  useEffect(() => {
    if (!hydrated || locationSet) return
    const timer = setTimeout(() => setShowLocationModal(true), 1400)
    return () => clearTimeout(timer)
  }, [hydrated, locationSet])

  useEffect(() => {
    getBranches().then(b => setBranches(b ?? [])).catch(() => {})
    getMenuItems().then(setMenuItems).catch(() => {}).finally(() => setMenuLoading(false))
    getSiteContent().then(setContent).catch(() => {})
    getFAQs(true).then(setFaqs).catch(() => {})
    getApprovedReviews().then(setReviews).catch(() => {})
  }, [])

  const bestsellers = menuItems.filter(i => (i.tags ?? []).includes('bestseller'))
  const featured = (bestsellers.length >= 4 ? bestsellers : menuItems).slice(0, 10)

  const tagline = (language === 'ur' ? content['hero_tagline_ur'] : content['hero_tagline_en'])?.trim()
  const announcement = content['announcement_active'] === 'true' ? content['announcement_text']?.trim() : ''

  const scrollRail = (dir: 1 | -1) => {
    const rail = railRef.current
    if (!rail) return
    rail.scrollBy({ left: dir * (isRTL ? -1 : 1) * Math.min(rail.clientWidth * 0.8, 900), behavior: 'smooth' })
  }

  const steps = [
    { icon: MapPin, title: t.step1Title, desc: t.step1Desc },
    { icon: ShoppingBag, title: t.step2Title, desc: t.step2Desc },
    { icon: Truck, title: t.step3Title, desc: t.step3Desc },
  ]

  const stats = [
    { value: content['about_stat1_value'] || '7+', label: content['about_stat1_label'] || 'Years on the grill' },
    { value: content['about_stat2_value'] || '50,000+', label: content['about_stat2_label'] || 'Orders served' },
    { value: content['about_stat3_value'] || '80+', label: content['about_stat3_label'] || 'Dishes on the menu' },
    { value: String(branches.length || 2), label: 'Branches in Lahore' },
  ]

  return (
    <>
      {showLocationModal && (
        <LocationModal onClose={() => setShowLocationModal(false)} allowBackdropClose={locationSet} />
      )}
      <Navbar />

      <main id="main">
        {/* ── HERO ─────────────────────────────────────────── */}
        <section aria-label="Welcome to Zaitoon" className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-olive-950 text-white">
          <video
            autoPlay={!reduceMotion}
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          >
            <source src="/4440943-hd_1920_1080_25fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(23,27,18,0.95)_0%,rgba(23,27,18,0.55)_45%,rgba(23,27,18,0.25)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(23,27,18,0.7)_0%,transparent_65%)] rtl:bg-[linear-gradient(to_left,rgba(23,27,18,0.7)_0%,transparent_65%)]" />

          <div className="container-page pb-10 pt-32 lg:pb-14">
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }}
              className="max-w-3xl"
            >
              {announcement ? (
                <motion.p variants={reveal} className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium backdrop-blur-md">
                  <Megaphone className="h-4 w-4 shrink-0 text-ember-100" />
                  <span className="truncate">{announcement}</span>
                </motion.p>
              ) : (
                <motion.p variants={reveal} className="mb-6 flex items-center gap-2.5 text-sm font-medium uppercase tracking-[0.16em] text-white/75">
                  <span className="h-1.5 w-1.5 rounded-full bg-ember-500 animate-ember-pulse" />
                  {language === 'ur' ? t.est : `Est. ${content['about_founded_year'] || '2018'} · Lahore, Pakistan`}
                </motion.p>
              )}

              <motion.h1 variants={reveal} className="text-[clamp(2.75rem,8vw,6.25rem)] leading-[0.95] text-white">
                {language === 'ur' ? (
                  <>{t.lahores} <span className="text-ember-100">{t.finest}</span> {t.bbqGrill}</>
                ) : (
                  <>Lahore&apos;s <em className="font-normal italic text-ember-100">finest</em><br />shawarma &amp; grill</>
                )}
              </motion.h1>

              <motion.p variants={reveal} className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-white/80 sm:text-lg">
                {tagline || (language === 'ur' ? t.heroDesc : 'Slow charcoal. Real smoke. Shawarma rolled to order and platters straight off the coals, delivered hot across Lahore.')}
              </motion.p>

              <motion.div variants={reveal} className="mt-8 flex flex-wrap gap-3">
                <Link href="/menu" className="btn-primary h-14 px-7 text-base">
                  {t.orderNow} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <a href="#branches" className="btn-secondary h-14 px-7 text-base">
                  <MapPin className="h-4 w-4" /> Find a branch
                </a>
              </motion.div>
            </motion.div>

            <motion.dl
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-14 grid grid-cols-3 border-t border-white/15 pt-6 text-white/90 sm:max-w-2xl"
            >
              {[
                { k: '~30 min', v: language === 'ur' ? t.heroDelivery : 'Average delivery' },
                { k: String(branches.length || 2), v: language === 'ur' ? t.branchCount : 'Branches in Lahore' },
                { k: '4.8 ★', v: language === 'ur' ? t.rating : 'Average rating' },
              ].map((s, i) => (
                <div key={s.v} className={i > 0 ? 'border-s border-white/15 ps-4 sm:ps-6' : 'pe-4'}>
                  <dt className="sr-only">{s.v}</dt>
                  <dd className="font-display text-2xl font-medium sm:text-3xl">{s.k}</dd>
                  <dd className="mt-1 text-xs text-white/60 sm:text-sm">{s.v}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </section>

        {/* ── KITCHEN TICKET ───────────────────────────────── */}
        <section aria-labelledby="ticket-title" className="py-20 lg:py-28">
          <div className="container-page grid gap-12 lg:grid-cols-12">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={reveal}
              className="lg:col-span-4"
            >
              <span className="section-label">The Zaitoon kitchen ticket</span>
              <h2 id="ticket-title">Four things we never skip.</h2>
              <p className="mt-5 max-w-sm text-[1.0625rem] leading-relaxed text-ink-2">
                Every order runs the same route, from the charcoal to your door. No exceptions on a busy Friday night.
              </p>
            </motion.div>

            <ol className="grid gap-px overflow-hidden rounded-[28px] border border-line bg-line sm:grid-cols-2 lg:col-span-8">
              {TICKET.map((item, i) => (
                <motion.li
                  key={item.num}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
                  className="bg-surface p-7 lg:p-9"
                >
                  <span className="font-display text-5xl font-light leading-none text-ember-500">{item.num}</span>
                  <h3 className="mt-6 text-xl">{item.label}</h3>
                  <p className="mt-2 leading-relaxed text-ink-2">{item.desc}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── FAN FAVOURITES ───────────────────────────────── */}
        <section aria-labelledby="favs-title" className="border-y border-line bg-paper-2/60 py-20 lg:py-24">
          <div className="container-page">
            <div className="mb-10 flex items-end justify-between gap-6">
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={reveal}>
                <span className="section-label">{t.ourSignatures}</span>
                <h2 id="favs-title">{t.fanFavourites}</h2>
              </motion.div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => scrollRail(-1)} aria-label="Scroll back" className="hidden h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:border-ink sm:inline-flex">
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </button>
                <button onClick={() => scrollRail(1)} aria-label="Scroll forward" className="hidden h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:border-ink sm:inline-flex">
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </button>
                <Link href="/menu" className="btn-quiet ms-1 font-semibold text-ink">
                  {t.viewAll} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
            </div>

            <ul
              ref={railRef}
              className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-4 scrollbar-hide lg:-mx-8 lg:scroll-px-8 lg:px-8"
            >
              {menuLoading
                ? Array.from({ length: 4 }, (_, i) => (
                  <li key={i} className="w-[78vw] max-w-[290px] shrink-0 snap-start"><MenuCardSkeleton /></li>
                ))
                : featured.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.06, ease: EASE }}
                    className="w-[78vw] max-w-[290px] shrink-0 snap-start"
                  >
                    <MenuItemCard item={item} priority={i < 2} />
                  </motion.li>
                ))}
              {!menuLoading && featured.length > 0 && (
                <li className="w-[60vw] max-w-[220px] shrink-0 snap-start">
                  <Link href="/menu" className="group flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-[22px] border border-dashed border-line-strong text-center transition-colors hover:border-ink hover:bg-surface">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper transition-transform group-hover:scale-105">
                      <Plus className="h-6 w-6" />
                    </span>
                    <span className="font-display text-xl">See the full menu</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────── */}
        <section aria-labelledby="how-title" className="py-20 lg:py-28">
          <div className="container-page">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={reveal} className="max-w-xl">
              <span className="section-label">{t.simpleProcess}</span>
              <h2 id="how-title">{t.howItWorks}</h2>
            </motion.div>

            <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {steps.map((step, i) => (
                <motion.li
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                  className="relative"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-olive-700 text-white">
                      <step.icon className="h-6 w-6" />
                    </span>
                    {i < steps.length - 1 && (
                      <span aria-hidden="true" className="hidden h-px flex-1 border-t border-dashed border-line-strong md:block" />
                    )}
                  </div>
                  <p className="mt-6 text-sm font-semibold tabular text-ember-600">Step {i + 1}</p>
                  <h3 className="mt-1.5 text-2xl">{step.title}</h3>
                  <p className="mt-2 max-w-xs leading-relaxed text-ink-2">{step.desc}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── STORY ────────────────────────────────────────── */}
        <section aria-labelledby="story-title" className="surface-dark grain overflow-hidden py-20 lg:py-28">
          <div className="container-page grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, ease: EASE }}
              className="relative"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] sm:aspect-[5/4] lg:aspect-[4/5]">
                <Image
                  src="/about-restaurant.png"
                  alt="A table at Zaitoon set with hummus, tabbouleh, falafel and grilled chicken"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 end-6 rounded-2xl bg-paper px-5 py-4 text-ink shadow-[var(--shadow-float)] sm:end-10">
                <p className="font-display text-3xl font-medium leading-none">Est. {content['about_founded_year'] || '2018'}</p>
                <p className="mt-1 text-sm text-ink-2">Wapda Town, Lahore</p>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={reveal}>
              <span className="section-label !text-olive-300">Our story</span>
              <h2 id="story-title" className="text-paper">
                Lebanese recipes, Lahori appetite.
              </h2>
              <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-paper/75">
                {(language === 'ur' && content['about_story_ur']) || content['about_story_en'] || 'We started with a simple idea: bring the flavours of a Beirut shawarma counter to the streets of Lahore. Every dish starts with real charcoal, fresh bread and sauces made that morning.'}
              </p>

              <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-7 border-t border-white/10 pt-8">
                {stats.map(s => (
                  <div key={s.label}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-display text-4xl font-medium tabular text-paper">{s.value}</dd>
                    <dd className="mt-1 text-sm text-paper/60">{s.label}</dd>
                  </div>
                ))}
              </dl>

              <Link href="/about" className="btn-secondary mt-10">
                Read our story <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── BRANCHES ─────────────────────────────────────── */}
        <section id="branches" aria-labelledby="branches-title" className="py-20 lg:py-28">
          <div className="container-page">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={reveal} className="mb-12 max-w-xl">
              <span className="section-label">{t.branches}</span>
              <h2 id="branches-title">Come eat with us.</h2>
              <p className="mt-4 text-[1.0625rem] text-ink-2">Dine in, pick up, or let the nearest branch deliver to you.</p>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-2">
              {branches.length === 0
                ? [0, 1].map(i => <div key={i} className="skeleton h-[260px] rounded-[28px]" />)
                : branches.map((branch, i) => (
                  <motion.article
                    key={branch.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                    className="panel flex flex-col p-7 lg:p-8"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-olive-600">Branch {String(i + 1).padStart(2, '0')}</p>
                        <h3 className="mt-2 text-[1.75rem]">{branch.name}</h3>
                      </div>
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-olive-100 text-olive-700">
                        <MapPin className="h-5 w-5" />
                      </span>
                    </div>

                    <ul className="mt-5 space-y-2.5 text-[0.9375rem] text-ink-2">
                      <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />{branch.address}</li>
                      {branch.hours && <li className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />{branch.hours}</li>}
                      {branch.phone && (
                        <li className="flex gap-3">
                          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                          <a href={`tel:${branch.phone.replace(/[^\d+]/g, '')}`} className="hover:text-ink">{branch.phone}</a>
                        </li>
                      )}
                    </ul>

                    <div className="mt-auto flex flex-wrap gap-2 pt-7">
                      {branch.lat && branch.lng ? (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="btn-green !min-h-11 !px-5 text-sm"
                        >
                          <Navigation className="h-4 w-4" /> Directions
                        </a>
                      ) : null}
                      {branch.whatsapp && (
                        <a href={waLink(branch.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn-outline-dark !min-h-11 !px-5 text-sm">
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      )}
                      {branch.phone && (
                        <a href={`tel:${branch.phone.replace(/[^\d+]/g, '')}`} className="btn-outline-dark !min-h-11 !px-5 text-sm">
                          <Phone className="h-4 w-4" /> Call
                        </a>
                      )}
                    </div>
                  </motion.article>
                ))}
            </div>
          </div>
        </section>

        <ReviewsWall reviews={reviews} />

        {/* ── FAQ ──────────────────────────────────────────── */}
        {faqs.length > 0 && (
          <section aria-labelledby="faq-title" className="py-20 lg:py-28">
            <div className="container-page grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <span className="section-label">Good to know</span>
                <h2 id="faq-title">Questions, answered.</h2>
                <p className="mt-4 max-w-sm text-ink-2">
                  Can&apos;t find what you need? Message us on WhatsApp and the branch will reply.
                </p>
                <a href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-outline-dark mt-6">
                  <MessageCircle className="h-4 w-4" /> {t.whatsappUs}
                </a>
              </div>

              <ul className="divide-y divide-line border-y border-line lg:col-span-8">
                {faqs.map(faq => {
                  const isOpen = openFaq === faq.id
                  const question = (language === 'ur' && faq.question_ur) || faq.question
                  const answer = (language === 'ur' && faq.answer_ur) || faq.answer
                  return (
                    <li key={faq.id}>
                      <h3 className="font-sans">
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                          aria-expanded={isOpen}
                          aria-controls={`faq-${faq.id}`}
                          className="flex w-full items-center justify-between gap-6 py-5 text-start text-[1.0625rem] font-semibold text-ink transition-colors hover:text-olive-700"
                        >
                          {question}
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${isOpen ? 'rotate-45 border-ink bg-ink text-paper' : 'border-line-strong text-ink'}`}>
                            <Plus className="h-4 w-4" />
                          </span>
                        </button>
                      </h3>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={`faq-${faq.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: EASE }}
                            className="overflow-hidden"
                          >
                            <p className="max-w-2xl pb-6 leading-relaxed text-ink-2">{answer}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <MobileCartBar />
    </>
  )
}
