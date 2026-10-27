export const SITE = {
    name: 'Zaitoon',
    tagline: 'House of Shawarma & BBQ',
    phoneDisplay: '0329-1330234',
    phoneHref: 'tel:+923291330234',
    whatsappHref: 'https://wa.me/923291330234',
    minOrder: 800,
} as const

/** Strip a Pakistani phone number down to the digits wa.me expects (92XXXXXXXXXX). */
export function waLink(number: string | null | undefined, text?: string) {
    let digits = (number ?? '').replace(/\D/g, '')
    if (digits.startsWith('0')) digits = `92${digits.slice(1)}`
    const base = `https://wa.me/${digits}`
    return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

export function titleCase(s: string) {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
