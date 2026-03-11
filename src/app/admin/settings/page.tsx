'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { Save, Store, Truck, Globe, Award, Phone, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAdminRole } from '@/hooks/useAdminRole'

const supabase = createClient()

// ── Tier table config ─────────────────────────────────────────
const TIERS = [
    { name: 'Bronze', min: 0, max: 499, discount: '0%', delivery: 'Standard', badge: '🥉' },
    { name: 'Silver', min: 500, max: 1499, discount: '2%', delivery: 'Standard', badge: '🥈' },
    { name: 'Gold', min: 1500, max: 4999, discount: '5%', delivery: 'Free 🚀', badge: '🥇' },
    { name: 'Platinum', min: 5000, max: null, discount: '10%', delivery: 'Free 🚀', badge: '💎' },
]

// ── Input component ───────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', prefix, suffix, hint }: {
    label: string; value: string; onChange: (v: string) => void
    type?: string; prefix?: string; suffix?: string; hint?: string
}) {
    return (
        <div>
            <label className="block text-sm font-bold text-[#18181B] mb-1.5">{label}</label>
            <div className="relative">
                {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#57534E] font-medium text-sm">{prefix}</span>}
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-[#FAF6EF] border border-[#E7E0D8] rounded-xl py-3 text-sm focus:outline-none focus:border-[#C9920A] focus:ring-1 focus:ring-[#C9920A] transition-all"
                    style={{ paddingLeft: prefix ? 48 : 16, paddingRight: suffix ? 48 : 16 }}
                />
                {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#57534E] font-medium text-sm">{suffix}</span>}
            </div>
            {hint && <p className="text-xs text-[#57534E] mt-1">{hint}</p>}
        </div>
    )
}

// ── Section card ─────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E7E0D8] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#FAF6EF] flex items-center justify-center">{icon}</div>
                <h2 className="font-display text-xl font-bold text-[#18181B]">{title}</h2>
            </div>
            {children}
        </div>
    )
}

export default function AdminSettingsPage() {
    const { role, loading: roleLoading } = useAdminRole()
    const router = useRouter()

    useEffect(() => {
        if (!roleLoading && role !== 'owner') {
            router.replace('/admin/orders')
        }
    }, [role, roleLoading, router])
    const [saved, setSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    // ── Branch state ──────────────────────────────────────────
    const [branches, setBranches] = useState<any[]>([])
    const [branchEdits, setBranchEdits] = useState<Record<string, { phone: string; whatsapp: string; hours: string }>>({})

    // ── Delivery settings ─────────────────────────────────────
    const [feePerKm, setFeePerKm] = useState('30')
    const [minFee, setMinFee] = useState('60')
    const [maxKm, setMaxKm] = useState('15')
    const [freeAbove, setFreeAbove] = useState('2000')

    // ── Site settings ─────────────────────────────────────────
    const [siteUrl, setSiteUrl] = useState('http://localhost:3000')

    // ── Load all data ─────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                // Branches
                const { data: bData } = await supabase.from('branches').select('*').order('name')
                if (bData) {
                    setBranches(bData)
                    const edits: typeof branchEdits = {}
                    bData.forEach((b: any) => {
                        edits[b.id] = {
                            phone: b.phone ?? '',
                            whatsapp: b.whatsapp ?? '',
                            hours: b.hours ?? '',
                        }
                    })
                    setBranchEdits(edits)
                }

                // Settings table
                const { data: sData } = await supabase.from('settings').select('key,value')
                if (sData) {
                    const map: Record<string, string> = {}
                    sData.forEach((row: any) => { map[row.key] = row.value })
                    if (map.delivery_fee_per_km) setFeePerKm(map.delivery_fee_per_km)
                    if (map.min_delivery_fee) setMinFee(map.min_delivery_fee)
                    if (map.max_delivery_km) setMaxKm(map.max_delivery_km)
                    if (map.free_delivery_above) setFreeAbove(map.free_delivery_above)
                    if (map.site_url) setSiteUrl(map.site_url)
                }
            } catch (err) {
                console.error(err)
                setLoadError('Failed to load settings from database.')
            }
        }
        load()
    }, [])

    // ── Save all ──────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true)
        try {
            // Save each branch
            for (const b of branches) {
                const edit = branchEdits[b.id]
                if (!edit) continue
                await supabase.from('branches').update({
                    phone: edit.phone,
                    whatsapp: edit.whatsapp,
                    hours: edit.hours || null,
                }).eq('id', b.id)
            }

            // Upsert all settings
            const settingsRows = [
                { key: 'delivery_fee_per_km', value: feePerKm },
                { key: 'min_delivery_fee', value: minFee },
                { key: 'max_delivery_km', value: maxKm },
                { key: 'free_delivery_above', value: freeAbove },
                { key: 'site_url', value: siteUrl },
            ]
            await supabase.from('settings').upsert(settingsRows, { onConflict: 'key' })

            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err: any) {
            console.error(err)
            alert('Save failed: ' + (err?.message ?? 'Unknown error'))
        } finally {
            setSaving(false)
        }
    }

    const updateBranch = (id: string, field: string, val: string) => {
        setBranchEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }))
    }

    if (roleLoading || role !== 'owner') {
        return null // show nothing while redirecting
    }

    return (
        <AdminLayout>
            <div className="p-6 max-w-4xl mx-auto space-y-8">

                {/* ── Header ──────────────────────────────────────────── */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-[#18181B]">Settings</h1>
                        <p className="text-sm mt-1 text-[#57534E]">Manage restaurant details, delivery config, and site settings</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md disabled:opacity-60"
                        style={{ backgroundColor: saved ? '#15803D' : '#1B4332', color: '#fff' }}
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save All'}
                    </button>
                </div>

                {loadError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                        ⚠ {loadError}
                    </div>
                )}

                {/* ── A) Branch Info ───────────────────────────────────── */}
                <Section icon={<Store className="w-5 h-5 text-[#C9920A]" />} title="Branch Info">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {branches.map((b: any) => {
                            const edit = branchEdits[b.id] ?? { phone: '', whatsapp: '', hours: '' }
                            return (
                                <div key={b.id} className="p-5 rounded-2xl bg-[#FAF6EF] border border-[#E7E0D8] space-y-4">
                                    <h3 className="font-bold text-[#18181B] text-base flex items-center gap-2">
                                        🏪 {b.name}
                                    </h3>
                                    <p className="text-xs text-[#57534E]">{b.address}</p>

                                    <div>
                                        <label className="block text-xs font-bold text-[#18181B] mb-1 flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5" /> Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={edit.phone}
                                            onChange={e => updateBranch(b.id, 'phone', e.target.value)}
                                            className="w-full bg-white border border-[#E7E0D8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9920A] transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#18181B] mb-1 flex items-center gap-1.5">
                                            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /> WhatsApp Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={edit.whatsapp}
                                            onChange={e => updateBranch(b.id, 'whatsapp', e.target.value)}
                                            className="w-full bg-white border border-[#E7E0D8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9920A] transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#18181B] mb-1">⏰ Operating Hours</label>
                                        <input
                                            type="text"
                                            value={edit.hours}
                                            onChange={e => updateBranch(b.id, 'hours', e.target.value)}
                                            placeholder="e.g. 12:00 PM – 2:00 AM"
                                            className="w-full bg-white border border-[#E7E0D8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9920A] transition-all"
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Section>

                {/* ── B) Delivery Settings ─────────────────────────────── */}
                <Section icon={<Truck className="w-5 h-5 text-[#1B4332]" />} title="Delivery Settings">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field label="Delivery fee per km" value={feePerKm} onChange={setFeePerKm} type="number" prefix="Rs." />
                        <Field label="Minimum delivery fee" value={minFee} onChange={setMinFee} type="number" prefix="Rs." />
                        <Field label="Max delivery distance" value={maxKm} onChange={setMaxKm} type="number" suffix="km" />
                        <Field
                            label="Free delivery above (Rs.)"
                            value={freeAbove}
                            onChange={setFreeAbove}
                            type="number"
                            prefix="Rs."
                            hint="Set to 0 to disable automatic free delivery threshold"
                        />
                    </div>
                </Section>

                {/* ── C) Site Settings ─────────────────────────────────── */}
                <Section icon={<Globe className="w-5 h-5 text-[#2563EB]" />} title="Site Settings">
                    <div className="space-y-4">
                        <Field
                            label="Site URL"
                            value={siteUrl}
                            onChange={setSiteUrl}
                            type="url"
                            hint="Used to generate referral links (e.g. https://zaitoon.pk). Update this when you go live!"
                        />
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                            <span className="text-xl shrink-0">⚠️</span>
                            <div>
                                <p className="font-bold mb-1">Going live?</p>
                                <p>Change <code className="bg-amber-100 px-1 rounded">http://localhost:3000</code> to <code className="bg-amber-100 px-1 rounded">https://zaitoon.pk</code> before deploying to production. Referral links won't work correctly until you do.</p>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* ── D) Loyalty Tiers (read-only) ─────────────────────── */}
                <Section icon={<Award className="w-5 h-5 text-[#9333EA]" />} title="Loyalty Tiers">
                    <p className="text-sm text-[#57534E] mb-4">Tier thresholds and perks — automatically applied at checkout.</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs font-bold text-[#57534E] uppercase tracking-wider border-b border-[#E7E0D8]">
                                    <th className="pb-3 pr-4">Tier</th>
                                    <th className="pb-3 pr-4">Points Range</th>
                                    <th className="pb-3 pr-4">Subtotal Discount</th>
                                    <th className="pb-3">Delivery</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E7E0D8]">
                                {TIERS.map(t => (
                                    <tr key={t.name} className="text-[#18181B]">
                                        <td className="py-3 pr-4 font-bold">
                                            {t.badge} {t.name}
                                        </td>
                                        <td className="py-3 pr-4 text-[#57534E]">
                                            {t.max ? `${t.min} – ${t.max}` : `${t.min}+`}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.discount === '0%' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                                                {t.discount}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span className={`text-xs font-semibold ${t.delivery.includes('Free') ? 'text-green-600' : 'text-[#57534E]'}`}>
                                                {t.delivery}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-[#57534E] mt-4 border-t border-[#E7E0D8] pt-3">
                        📌 1 point earned per Rs. 100 spent. Points redeemable at Rs. 1 per point (max 20% of order).
                    </p>
                </Section>

                {/* ── Bottom save button ───────────────────────────────── */}
                <div className="flex justify-end pb-6">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-colors shadow-md disabled:opacity-60"
                        style={{ backgroundColor: saved ? '#15803D' : '#1B4332', color: '#fff' }}
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : saved ? '✓ All changes saved!' : 'Save All Changes'}
                    </button>
                </div>

            </div>
        </AdminLayout>
    )
}
