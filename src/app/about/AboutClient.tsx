'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, ArrowRight } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileCartBar from '@/components/layout/MobileCartBar'
import { useLanguageStore } from '@/store/useLanguageStore'
import { SITE } from '@/lib/site'

const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

export default function AboutClient({ cms }: { cms: Record<string, string> }) {
  const { language } = useLanguageStore()

  const name = cms['about_restaurant_name'] || 'Zaitoon'
  const founded = cms['about_founded_year'] || '2018'
  const location = cms['about_location'] || 'Lahore, Pakistan'
  const story = (language === 'ur' && cms['about_story_ur']) || cms['about_story_en'] ||
    'We started with a simple idea: bring the flavours of a Beirut shawarma counter to the streets of Lahore. Every dish starts with pure olive oil, warm spices and live charcoal.'
  const mission = cms['about_mission'] || 'Lebanese flavour, cooked over real charcoal, served with Lahori warmth.'
  const address = cms['about_address'] || 'Wapda Town and Cantonment, Lahore'
  const phone = cms['about_phone'] || SITE.phoneDisplay
  const email = cms['about_email']
  const years = Math.max(1, new Date().getFullYear() - (parseInt(founded) || 2018))

  const stats = [
    { value: cms['about_stat1_value'] || `${years}+`, label: cms['about_stat1_label'] || 'Years on the grill' },
    { value: cms['about_stat2_value'] || '50,000+', label: cms['about_stat2_label'] || 'Orders served' },
    { value: cms['about_stat3_value'] || '80+', label: cms['about_stat3_label'] || 'Dishes on the menu' },
    { value: '100%', label: 'Halal, made fresh daily' },
  ]

  const values = [
    { title: 'Fresh, every morning', desc: 'Produce bought daily, Middle Eastern spices, and extra virgin olive oil. Sauces are made the same day they are served.' },
    { title: 'Live charcoal, always', desc: 'Meat is marinated for up to 12 hours, then seared over glowing coals. Never gas, never a shortcut on a busy night.' },
    { title: 'Hospitality first', desc: 'Recipes rooted in Lebanese tradition, served the way Lahore likes to eat: generously, and with company.' },
  ]

  return (
    <>
      <Navbar />

      <main id="main" className="pt-nav">
        {/* Hero */}
        <section className="container-page grid items-center gap-12 py-12 lg:grid-cols-12 lg:py-20">
          <motion.div initial="hidden" animate="show" variants={reveal} className="lg:col-span-6">
            <span className="section-label">Est. {founded} · {location}</span>
            <h1>Our heritage, <em className="font-normal italic text-olive-600">our craft.</em></h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-2">{mission}</p>
            <Link href="/menu" className="btn-primary mt-8">
              Explore the menu <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-[4/3] overflow-hidden rounded-[32px] lg:col-span-6"
          >
            <Image
              src="/about-restaurant.png"
              alt={`Inside ${name}: a table of mezze and grilled chicken under lantern light`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>
        </section>

        {/* Stats */}
        <section aria-label="Zaitoon in numbers" className="border-y border-line">
          <dl className="container-page grid grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} className={`py-8 ${i % 2 === 1 ? 'border-s border-line ps-6' : ''} ${i >= 2 ? 'border-t border-line lg:border-t-0' : ''} ${i === 2 ? 'lg:border-s lg:ps-6' : ''} lg:py-10`}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-[clamp(2.25rem,4vw,3.25rem)] font-medium leading-none tabular">{s.value}</dd>
                <dd className="mt-2 text-sm text-ink-2">{s.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Story */}
        <section className="container-page grid gap-12 py-20 lg:grid-cols-12 lg:py-28">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={reveal} className="lg:col-span-5">
            <span className="section-label">The Zaitoon journey</span>
            <h2>A love letter to Lebanese cooking.</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={reveal} className="lg:col-span-7">
            <blockquote className="border-s-2 border-ember-500 ps-6 font-display text-[clamp(1.375rem,2.4vw,1.875rem)] italic leading-snug text-ink">
              &ldquo;We never cut corners on marinade times or charcoal. When you taste our grill, you&apos;re tasting patience.&rdquo;
            </blockquote>
            <p className="mt-8 text-[1.0625rem] leading-relaxed text-ink-2">{story}</p>
          </motion.div>
        </section>

        {/* Values */}
        <section aria-labelledby="values-title" className="surface-dark grain py-20 lg:py-28">
          <div className="container-page">
            <span className="section-label !text-olive-300">What drives us</span>
            <h2 id="values-title" className="max-w-xl text-paper">Three things on every plate.</h2>
            <ol className="mt-12 divide-y divide-white/10 border-y border-white/10">
              {values.map((v, i) => (
                <motion.li
                  key={v.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="grid gap-3 py-8 md:grid-cols-12 md:gap-8"
                >
                  <span className="font-display text-4xl font-light text-ember-100 md:col-span-2">0{i + 1}</span>
                  <h3 className="text-2xl text-paper md:col-span-4">{v.title}</h3>
                  <p className="leading-relaxed text-paper/70 md:col-span-6">{v.desc}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* Visit */}
        <section className="container-page grid gap-10 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="section-label">Come dine with us</span>
            <h2>Find us.</h2>
            <p className="mt-4 max-w-md text-ink-2">Two branches across Lahore, open every day for dine-in, takeaway and delivery.</p>
            <Link href="/#branches" className="btn-outline-dark mt-7">See both branches</Link>
          </div>
          <ul className="panel divide-y divide-line !p-0">
            {[
              { icon: MapPin, label: 'Where', value: address },
              { icon: Clock, label: 'Hours', value: 'Daily, 12:00 pm – 1:00 am' },
              { icon: Phone, label: 'Call', value: phone, href: `tel:${phone.replace(/[^\d+]/g, '')}` },
              ...(email ? [{ icon: Mail, label: 'Email', value: email, href: `mailto:${email}` }] : []),
            ].map(row => (
              <li key={row.label} className="flex items-start gap-4 px-6 py-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-olive-100 text-olive-700">
                  <row.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm text-ink-3">{row.label}</p>
                  {row.href
                    ? <a href={row.href} className="font-medium text-ink hover:text-olive-700">{row.value}</a>
                    : <p className="font-medium text-ink">{row.value}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
      <MobileCartBar />
    </>
  )
}
