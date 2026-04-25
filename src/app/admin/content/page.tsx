'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Save, Plus, Trash2, Globe, Star, ToggleLeft, ToggleRight, GripVertical, HelpCircle, ChevronUp, ChevronDown } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
    getSiteContent, updateSiteContentBulk,
    getPopularCombos, createPopularCombo, updatePopularCombo, deletePopularCombo,
    type PopularCombo,
} from '@/lib/api/menu'
import { getFAQs, createFAQ, updateFAQ, deleteFAQ, type FAQ } from '@/lib/api/faqs'

// ── Shared field styles ────────────────────────────────────────────────────────
const fieldCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100 placeholder-gray-400 transition'
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1.5'

/** Section card wrapper */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            {children}
        </div>
    )
}

// ── EMPTY combo template ───────────────────────────────────────────────────────
const emptyCombo = (): Omit<PopularCombo, 'id' | 'created_at' | 'updated_at'> => ({
    name: '',
    description: '',
    price: null,
    image_url: '',
    is_active: true,
    display_order: 0,
})

export default function AdminContentPage() {
    // ── Site content state ──────────────────────────────────────────────────
    const [content, setContent] = useState<Record<string, string>>({})
    const [savingContent, setSavingContent] = useState(false)

    // ── Popular combos state ────────────────────────────────────────────────
    const [combos, setCombos] = useState<PopularCombo[]>([])
    const [savingCombo, setSavingCombo] = useState<string | null>(null)
    const [newCombo, setNewCombo] = useState(emptyCombo())
    const [addingCombo, setAddingCombo] = useState(false)

    // ── FAQ state ───────────────────────────────────────────────────────────
    const [faqs, setFaqs] = useState<FAQ[]>([])
    const [savingFaq, setSavingFaq] = useState<string | null>(null)
    const [newFaq, setNewFaq] = useState({ question: '', answer: '', question_ur: '', answer_ur: '' })
    const [addingFaq, setAddingFaq] = useState(false)

    // ── Load all data on mount ───────────────────────────────────────────────
    useEffect(() => {
        getSiteContent()
            .then(setContent)
            .catch(err => toast.error('Failed to load content: ' + err.message))
        getPopularCombos(false)
            .then(setCombos)
            .catch(err => toast.error('Failed to load combos: ' + err.message))
        getFAQs(false)
            .then(setFaqs)
            .catch(err => toast.error('Failed to load FAQs: ' + err.message))
    }, [])

    // ── Site content helpers ─────────────────────────────────────────────────
    const updateField = (key: string, value: string) =>
        setContent(prev => ({ ...prev, [key]: value }))

    const handleSaveContent = async () => {
        setSavingContent(true)
        try {
            await updateSiteContentBulk(content)
            toast.success('Content saved ✓')
        } catch (err: any) {
            toast.error('Save failed: ' + err.message)
        } finally {
            setSavingContent(false)
        }
    }

    // ── Combo helpers ────────────────────────────────────────────────────────
    const handleToggleCombo = async (combo: PopularCombo) => {
        setSavingCombo(combo.id)
        try {
            const updated = await updatePopularCombo(combo.id, { is_active: !combo.is_active })
            setCombos(prev => prev.map(c => c.id === combo.id ? updated : c))
            toast.success(`Combo ${updated.is_active ? 'activated' : 'deactivated'} ✓`)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSavingCombo(null)
        }
    }

    const handleDeleteCombo = async (id: string) => {
        if (!confirm('Delete this combo?')) return
        try {
            await deletePopularCombo(id)
            setCombos(prev => prev.filter(c => c.id !== id))
            toast.success('Combo deleted ✓')
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleSaveCombo = async (combo: PopularCombo) => {
        setSavingCombo(combo.id)
        try {
            const updated = await updatePopularCombo(combo.id, {
                name: combo.name,
                description: combo.description,
                price: combo.price,
                image_url: combo.image_url,
                is_active: combo.is_active,
                display_order: combo.display_order,
            })
            setCombos(prev => prev.map(c => c.id === combo.id ? updated : c))
            toast.success('Combo saved ✓')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSavingCombo(null)
        }
    }

    const handleAddCombo = async () => {
        if (!newCombo.name.trim()) { toast.error('Combo name is required'); return }
        setAddingCombo(true)
        try {
            const created = await createPopularCombo({ ...newCombo, display_order: combos.length })
            setCombos(prev => [...prev, created])
            setNewCombo(emptyCombo())
            toast.success('Combo created ✓')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setAddingCombo(false)
        }
    }

    const updateComboField = (id: string, field: keyof PopularCombo, value: any) =>
        setCombos(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))

    // ── FAQ helpers ──────────────────────────────────────────────────────────
    const handleSaveFaq = async (faq: FAQ) => {
        setSavingFaq(faq.id)
        try {
            const updated = await updateFAQ(faq.id, {
                question: faq.question, answer: faq.answer,
                question_ur: faq.question_ur, answer_ur: faq.answer_ur,
                is_active: faq.is_active, display_order: faq.display_order,
            })
            setFaqs(prev => prev.map(f => f.id === faq.id ? updated : f))
            toast.success('FAQ saved ✓')
        } catch (err: any) { toast.error(err.message) }
        finally { setSavingFaq(null) }
    }
    const handleToggleFaq = async (faq: FAQ) => {
        setSavingFaq(faq.id)
        try {
            const updated = await updateFAQ(faq.id, { is_active: !faq.is_active })
            setFaqs(prev => prev.map(f => f.id === faq.id ? updated : f))
        } catch (err: any) { toast.error(err.message) }
        finally { setSavingFaq(null) }
    }
    const handleDeleteFaq = async (id: string) => {
        if (!confirm('Delete this FAQ?')) return
        try {
            await deleteFAQ(id)
            setFaqs(prev => prev.filter(f => f.id !== id))
            toast.success('FAQ deleted ✓')
        } catch (err: any) { toast.error(err.message) }
    }
    const handleAddFaq = async () => {
        if (!newFaq.question.trim() || !newFaq.answer.trim()) {
            toast.error('Question and Answer are required'); return
        }
        setAddingFaq(true)
        try {
            const created = await createFAQ({
                ...newFaq,
                is_active: true,
                display_order: faqs.length,
            })
            setFaqs(prev => [...prev, created])
            setNewFaq({ question: '', answer: '', question_ur: '', answer_ur: '' })
            toast.success('FAQ created ✓')
        } catch (err: any) { toast.error(err.message) }
        finally { setAddingFaq(false) }
    }
    const updateFaqField = (id: string, field: keyof FAQ, value: any) =>
        setFaqs(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f))

    return (
        <AdminLayout>
            <div className="p-6 max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-gray-900">Content / CMS</h1>
                        <p className="text-sm text-gray-600 mt-1">Manage all website text, banners, and popular combos</p>
                    </div>
                    <button
                        onClick={handleSaveContent}
                        disabled={savingContent}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition disabled:opacity-60"
                    >
                        <Save className="w-4 h-4" />
                        {savingContent ? 'Saving…' : 'Save Content'}
                    </button>
                </div>

                {/* ── A) Site Text Content ─────────────────────────────────── */}
                <Section title="🌐 Homepage & Global Content">
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Hero Tagline (English)</label>
                            <input className={fieldCls}
                                value={content['hero_tagline_en'] ?? ''}
                                onChange={e => updateField('hero_tagline_en', e.target.value)}
                                placeholder="Fresh Lebanese Taste with Flame-Grilled Chicken" />
                        </div>
                        <div>
                            <label className={labelCls}>Hero Tagline (Urdu)</label>
                            <input className={fieldCls + ' text-right'}
                                value={content['hero_tagline_ur'] ?? ''}
                                onChange={e => updateField('hero_tagline_ur', e.target.value)}
                                placeholder="اصلی لبنانی ذائقہ، فلیم گرل چکن کے ساتھ" />
                        </div>
                        <div>
                            <label className={labelCls}>Footer Tagline</label>
                            <input className={fieldCls}
                                value={content['footer_tagline'] ?? ''}
                                onChange={e => updateField('footer_tagline', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelCls}>Footer Copyright</label>
                            <input className={fieldCls}
                                value={content['restaurant_copyright'] ?? ''}
                                onChange={e => updateField('restaurant_copyright', e.target.value)} />
                        </div>
                    </div>
                </Section>

                <Section title="📋 Menu Page Content">
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>BBQ Accompaniments Text
                                <span className="ml-1 text-xs font-normal text-gray-500">— shown above BBQ items on menu</span>
                            </label>
                            <input className={fieldCls}
                                value={content['bbq_accompaniments'] ?? ''}
                                onChange={e => updateField('bbq_accompaniments', e.target.value)}
                                placeholder="1 Puri | 2 Chapati | 1 Spicy Chutni | 2 Garlic Sauce" />
                            <p className="text-xs text-gray-500 mt-1">This is the global default. Per-product accompaniments override this (set in Menu Manager).</p>
                        </div>
                        <div>
                            <label className={labelCls}>Dips / Sauces Note</label>
                            <input className={fieldCls}
                                value={content['dips_note'] ?? ''}
                                onChange={e => updateField('dips_note', e.target.value)} />
                        </div>
                    </div>
                </Section>

                <Section title="📢 Announcement Banner">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-semibold text-gray-700">Show Banner</label>
                            <button
                                type="button"
                                onClick={() => updateField('announcement_active',
                                    content['announcement_active'] === 'true' ? 'false' : 'true')}
                                className="flex items-center gap-1.5 text-sm font-semibold"
                                style={{ color: content['announcement_active'] === 'true' ? '#16a34a' : '#6b7280' }}
                            >
                                {content['announcement_active'] === 'true'
                                    ? <><ToggleRight className="w-5 h-5" /> Active</>
                                    : <><ToggleLeft className="w-5 h-5" /> Inactive</>}
                            </button>
                        </div>
                        <div>
                            <label className={labelCls}>Banner Text</label>
                            <input className={fieldCls}
                                value={content['announcement_text'] ?? ''}
                                onChange={e => updateField('announcement_text', e.target.value)}
                                placeholder="e.g. 🎉 Free delivery on orders above Rs. 1500 this weekend!" />
                        </div>
                    </div>
                </Section>

                <button
                    onClick={handleSaveContent}
                    disabled={savingContent}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition disabled:opacity-60"
                >
                    <Save className="w-4 h-4" />
                    {savingContent ? 'Saving…' : 'Save All Content'}
                </button>

                {/* ── B) Popular Combos Manager ─────────────────────────────── */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Star className="w-5 h-5 text-orange-500" /> Popular Combos
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Manage the "Popular Combo Picks" section shown on the menu page</p>
                        </div>
                    </div>

                    {/* Existing combos */}
                    <div className="space-y-4 mb-6">
                        {combos.length === 0 && (
                            <p className="text-sm text-gray-500 italic">No combos yet. Add one below.</p>
                        )}
                        {combos.map(combo => (
                            <div key={combo.id}
                                className={`rounded-2xl border p-4 space-y-3 transition-all ${combo.is_active ? 'border-green-200 bg-green-50/40' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="flex items-center gap-2 justify-between">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
                                        <input
                                            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-900 bg-white outline-none focus:border-green-500 min-w-0"
                                            value={combo.name}
                                            onChange={e => updateComboField(combo.id, 'name', e.target.value)}
                                            placeholder="Combo name" />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Active toggle */}
                                        <button onClick={() => handleToggleCombo(combo)} disabled={savingCombo === combo.id}
                                            className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${combo.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                            {combo.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                        {/* Save combo */}
                                        <button onClick={() => handleSaveCombo(combo)} disabled={savingCombo === combo.id}
                                            className="p-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50">
                                            <Save className="w-3.5 h-3.5" />
                                        </button>
                                        {/* Delete */}
                                        <button onClick={() => handleDeleteCombo(combo.id)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                                        <input className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-green-500"
                                            value={combo.description ?? ''}
                                            onChange={e => updateComboField(combo.id, 'description', e.target.value)}
                                            placeholder="Short description" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Price (Rs.)</label>
                                        <input type="number" className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-green-500"
                                            value={combo.price ?? ''}
                                            onChange={e => updateComboField(combo.id, 'price', e.target.value ? Number(e.target.value) : null)}
                                            placeholder="Optional" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Image URL</label>
                                    <input className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-green-500"
                                        value={combo.image_url ?? ''}
                                        onChange={e => updateComboField(combo.id, 'image_url', e.target.value)}
                                        placeholder="https://..." />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-gray-600">Display Order</label>
                                    <input type="number" className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-green-500"
                                        value={combo.display_order}
                                        onChange={e => updateComboField(combo.id, 'display_order', Number(e.target.value))} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add new combo */}
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 p-4 space-y-3">
                        <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add New Combo
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Name *</label>
                                <input className={fieldCls}
                                    value={newCombo.name}
                                    onChange={e => setNewCombo(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Family BBQ Deal" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Price (Rs.)</label>
                                <input type="number" className={fieldCls}
                                    value={newCombo.price ?? ''}
                                    onChange={e => setNewCombo(p => ({ ...p, price: e.target.value ? Number(e.target.value) : null }))}
                                    placeholder="Optional" />
                            </div>
                        </div>
                        <input className={fieldCls}
                            value={newCombo.description ?? ''}
                            onChange={e => setNewCombo(p => ({ ...p, description: e.target.value }))}
                            placeholder="Short description" />
                        <input className={fieldCls}
                            value={newCombo.image_url ?? ''}
                            onChange={e => setNewCombo(p => ({ ...p, image_url: e.target.value }))}
                            placeholder="Image URL (optional)" />
                        <button onClick={handleAddCombo} disabled={addingCombo}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition disabled:opacity-60">
                            <Plus className="w-4 h-4" />
                            {addingCombo ? 'Creating…' : 'Create Combo'}
                        </button>
                    </div>
                </div>

                {/* ── C) FAQ Manager ───────────────────────────────────────── */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-blue-500" /> FAQs
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Manage frequently asked questions shown on the homepage</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        {faqs.length === 0 && <p className="text-sm text-gray-500 italic">No FAQs yet.</p>}
                        {faqs.map(faq => (
                            <div key={faq.id}
                                className={`rounded-2xl border p-4 space-y-3 ${faq.is_active ? 'border-blue-100 bg-blue-50/30' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="flex items-center gap-2 justify-between">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
                                        <input
                                            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-900 bg-white outline-none focus:border-blue-400 min-w-0"
                                            value={faq.question}
                                            onChange={e => updateFaqField(faq.id, 'question', e.target.value)}
                                            placeholder="Question (English)" />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => handleToggleFaq(faq)} disabled={savingFaq === faq.id}
                                            className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${faq.is_active ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                            {faq.is_active ? 'Active' : 'Hidden'}
                                        </button>
                                        <button onClick={() => handleSaveFaq(faq)} disabled={savingFaq === faq.id}
                                            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50">
                                            <Save className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleDeleteFaq(faq.id)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <textarea rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:border-blue-400 resize-none"
                                    value={faq.answer}
                                    onChange={e => updateFaqField(faq.id, 'answer', e.target.value)}
                                    placeholder="Answer (English)" />
                                <div className="grid grid-cols-2 gap-2">
                                    <input className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 text-right"
                                        value={faq.question_ur ?? ''}
                                        onChange={e => updateFaqField(faq.id, 'question_ur', e.target.value)}
                                        placeholder="سوال (اردو)" />
                                    <input className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white outline-none focus:border-blue-400 text-right"
                                        value={faq.answer_ur ?? ''}
                                        onChange={e => updateFaqField(faq.id, 'answer_ur', e.target.value)}
                                        placeholder="جواب (اردو)" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-gray-600">Order</label>
                                    <input type="number" className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white outline-none"
                                        value={faq.display_order}
                                        onChange={e => updateFaqField(faq.id, 'display_order', Number(e.target.value))} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add new FAQ */}
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 p-4 space-y-3">
                        <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add New FAQ
                        </p>
                        <input className={fieldCls}
                            value={newFaq.question}
                            onChange={e => setNewFaq(p => ({ ...p, question: e.target.value }))}
                            placeholder="Question (English) *" />
                        <textarea rows={2} className={fieldCls + ' resize-none'}
                            value={newFaq.answer}
                            onChange={e => setNewFaq(p => ({ ...p, answer: e.target.value }))}
                            placeholder="Answer (English) *" />
                        <div className="grid grid-cols-2 gap-2">
                            <input className={fieldCls + ' text-right'}
                                value={newFaq.question_ur}
                                onChange={e => setNewFaq(p => ({ ...p, question_ur: e.target.value }))}
                                placeholder="سوال (اردو)" />
                            <input className={fieldCls + ' text-right'}
                                value={newFaq.answer_ur}
                                onChange={e => setNewFaq(p => ({ ...p, answer_ur: e.target.value }))}
                                placeholder="جواب (اردو)" />
                        </div>
                        <button onClick={handleAddFaq} disabled={addingFaq}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition disabled:opacity-60">
                            <Plus className="w-4 h-4" />
                            {addingFaq ? 'Creating…' : 'Create FAQ'}
                        </button>
                    </div>
                </div>

            </div>
        </AdminLayout>
    )
}
