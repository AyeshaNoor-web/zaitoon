'use client'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { getMenuItems, updateMenuItemAvailability, updateMenuItem, createMenuItem, deleteMenuItem, getCategories, getAllMenuItemsAdmin } from '@/lib/api/menu'
import { formatPrice } from '@/lib/payment'
import type { MenuItem } from '@/types'
import MenuImageUpload from '@/components/admin/MenuImageUpload'
import Image from 'next/image'

const itemSchema = z.object({
    name: z.string().min(2),
    category: z.string().min(1),
    price: z.number().min(0),
    priceL: z.number().min(0).nullable().optional(),
    description: z.string().optional(),
    hasSizes: z.boolean().optional(),
})
type ItemForm = z.infer<typeof itemSchema>

export default function AdminMenuPage() {
    const [items, setItems] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])

    useEffect(() => {
        Promise.all([getAllMenuItemsAdmin(), getCategories()]).then(([itm, cat]) => {
            setItems(itm)
            setCategories(cat)
        })
    }, [])

    const [search, setSearch] = useState('')
    const [catFilter, setCatFilter] = useState('all')
    const [editing, setEditing] = useState<any>(null)
    const [isNew, setIsNew] = useState(false)
    const [delTarget, setDelTarget] = useState<any>(null)

    const visible = useMemo(() => {
        let list = items
        if (catFilter !== 'all') list = list.filter(i => i.category_id === catFilter)
        if (search) list = list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
        return list
    }, [items, search, catFilter])

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ItemForm>({
        resolver: zodResolver(itemSchema),
        defaultValues: { name: '', category: '', price: 0, priceL: null, description: '', hasSizes: false }
    })

    const openEdit = (item: any) => {
        setEditing({...item}); setIsNew(false)
        reset({ name: item.name, category: item.category_id, price: item.price, priceL: item.price_large, description: item.description, hasSizes: item.has_sizes })
    }
    const openAdd = () => {
        setEditing({ id: `item_${Date.now()}`, name: '', category_id: categories[0]?.id || '', price: 0, rating: 4.5, is_available: true, image_url: null })
        setIsNew(true)
        reset({ name: '', category: categories[0]?.id || '', price: 0 })
    }

    const onSave = async (data: ItemForm) => {
        if (isNew) {
            const payload = {
                name: data.name, category_id: data.category, price: data.price, price_large: data.priceL, description: data.description, has_sizes: data.hasSizes, is_available: true, rating: 4.5, image_url: editing?.image_url || null
            }
            const created = await createMenuItem(payload)
            setItems(prev => [...prev, created])
            toast.success('Item added ✓')
        } else if (editing) {
            const payload = {
                name: data.name, category_id: data.category, price: data.price, price_large: data.priceL, description: data.description, has_sizes: data.hasSizes, image_url: editing?.image_url || null
            }
            setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...payload } : i))
            await updateMenuItem(editing.id, payload)
            toast.success('Item saved ✓')
        }
        setEditing(null)
    }

    const confirmDelete = async () => {
        if (!delTarget) return
        setItems(prev => prev.filter(i => i.id !== delTarget.id))
        await deleteMenuItem(delTarget.id)
        toast.success(`Deleted "${delTarget.name}"`)
        setDelTarget(null)
    }

    const toggleAvailability = async (id: string, current: boolean) => {
        const next = !current
        setItems(prev => prev.map(i => i.id === id ? { ...i, is_available: next } : i))
        await updateMenuItemAvailability(id, next).catch(console.error)
    }

    return (
        <AdminLayout>
            <div className="p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <h1 className="font-display text-2xl font-bold mr-auto text-[#18181B]">Menu Manager</h1>
                    {/* Search */}
                    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-[#E7E0D8]">
                        <Search className="w-4 h-4 text-[#57534E]" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
                            className="outline-none text-sm w-40 text-[#18181B]" />
                    </div>
                    {/* Category filter */}
                    <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-[#E7E0D8] bg-white text-sm outline-none text-[#18181B]">
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <button onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#0A1F13] text-sm font-bold gold-shimmer transition-transform hover:scale-[1.02]">
                        <Plus className="w-4 h-4" /> Add Item
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-3xl border border-[#E7E0D8] overflow-hidden card-md">
                    <table className="w-full text-sm">
                        <thead className="bg-[#FAF6EF] border-b border-[#E7E0D8]">
                            <tr>
                                <th className="px-5 py-4 text-left text-xs font-bold text-[#57534E] uppercase tracking-wider">Image</th>
                                {['Name', 'Category', 'Price', 'Available', 'Actions'].map(h => (
                                    <th key={h} className="px-5 py-4 text-left text-xs font-bold text-[#57534E] uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {visible.map((item, i) => (
                                    <motion.tr key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="border-b last:border-0 border-[#E7E0D8] hover:bg-[#FAF6EF]/50 transition-colors" transition={{ delay: i * 0.02 }}>
                                        <td className="px-5 py-4" style={{ width: 64 }}>
                                            {item.image_url ? (
                                                <Image
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    width={56} height={42}
                                                    style={{ borderRadius: 4, objectFit: 'cover', width: 56, height: 42 }}
                                                    unoptimized
                                                />
                                            ) : (
                                                <div style={{
                                                    width: 56, height: 42,
                                                    backgroundColor: '#F5EDD8',
                                                    borderRadius: 4,
                                                    display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 18,
                                                }}>
                                                    🖼️
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 font-bold text-[#18181B]">{item.name}</td>
                                        <td className="px-5 py-4 text-[#57534E] capitalize">{categories.find(c => c.id === item.category_id)?.label}</td>
                                        <td className="px-5 py-4 font-medium text-[#18181B]">
                                            {item.priceOnRequest ? <span className="italic text-[#57534E]">On request</span>
                                                : item.price !== null ? formatPrice(item.price) : '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <Switch className="data-[state=checked]:bg-[#1B4332]" checked={item.is_available} onCheckedChange={() => toggleAvailability(item.id, item.is_available)} />
                                        </td>
                                        <td className="px-5 py-4 flex gap-2">
                                            <button onClick={() => openEdit(item)}
                                                className="p-2 rounded-xl hover:bg-[#E7E0D8] text-[#57534E] hover:text-[#1B4332] transition-colors">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setDelTarget(item)}
                                                className="p-2 rounded-xl hover:bg-red-50 text-[#57534E] hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Edit / Add dialog */}
                <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
                    <DialogContent className="max-w-md rounded-3xl border border-[#E7E0D8] p-6">
                        <DialogHeader>
                            <DialogTitle className="font-display text-2xl font-bold text-[#18181B]">{isNew ? 'Add New Item' : 'Edit Item'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSave)} className="space-y-4 mt-2">
                            <div>
                                <label style={{
                                    fontSize: 13, fontWeight: 600,
                                    color: '#1C1917', display: 'block', marginBottom: 8,
                                }}>
                                    Item Image
                                </label>
                                {editing && (
                                    <MenuImageUpload
                                        menuItemId={editing.id}
                                        currentImageUrl={editing.image_url || null}
                                        itemName={editing.name || 'New Item'}
                                        onImageUpdated={(newUrl) => {
                                            if (!isNew) {
                                                setItems(prev => prev.map(item =>
                                                    item.id === editing.id
                                                        ? { ...item, image_url: newUrl }
                                                        : item
                                                ))
                                            }
                                            setEditing((prev: any) => prev ? { ...prev, image_url: newUrl } : null)
                                        }}
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-[#18181B]">Item Name</label>
                                <input {...register('name')} className="w-full px-4 py-3 rounded-2xl border border-[#E7E0D8] text-sm outline-none focus:border-[#1B4332] bg-[#FFFDF7]" />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-[#18181B]">Category</label>
                                <select {...register('category')} className="w-full px-4 py-3 rounded-2xl border border-[#E7E0D8] text-sm outline-none bg-[#FFFDF7]">
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-bold mb-1.5 text-[#18181B]">Price (Rs.)</label>
                                    <input {...register('price', { setValueAs: v => (v === '' || isNaN(Number(v))) ? 0 : Number(v) })} type="number"
                                        className="w-full px-4 py-3 rounded-2xl border border-[#E7E0D8] text-sm outline-none focus:border-[#1B4332] bg-[#FFFDF7]" />
                                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1.5 text-[#18181B]">Large Price</label>
                                    <input {...register('priceL', { setValueAs: v => (v === '' || isNaN(Number(v))) ? null : Number(v) })} type="number"
                                        className="w-full px-4 py-3 rounded-2xl border border-[#E7E0D8] text-sm outline-none focus:border-[#1B4332] bg-[#FFFDF7]" />
                                    {errors.priceL && <p className="text-red-500 text-xs mt-1">{errors.priceL.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-[#18181B]">Description</label>
                                <textarea {...register('description')} rows={2}
                                    className="w-full px-4 py-3 rounded-2xl border border-[#E7E0D8] text-sm outline-none focus:border-[#1B4332] bg-[#FFFDF7] resize-none" />
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button type="button" onClick={() => setEditing(null)}
                                    className="flex-1 py-3 rounded-2xl border border-[#E7E0D8] text-sm font-bold text-[#57534E] hover:bg-[#FAF6EF] transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-2xl text-white text-sm font-bold bg-[#1B4332] hover:bg-[#0A1F13] transition-colors">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete confirmation */}
                <Dialog open={!!delTarget} onOpenChange={open => !open && setDelTarget(null)}>
                    <DialogContent className="max-w-sm text-center rounded-3xl border border-[#E7E0D8] p-6">
                        <DialogHeader>
                            <DialogTitle className="font-display text-2xl font-bold text-[#18181B]">Delete Item?</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm mt-2 text-[#57534E]">
                            Are you sure you want to delete &quot;<strong className="text-[#18181B]">{delTarget?.name}</strong>&quot;? This cannot be undone.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDelTarget(null)}
                                className="flex-1 py-3 rounded-2xl border border-[#E7E0D8] text-sm font-bold text-[#57534E] hover:bg-[#FAF6EF] transition-colors">Cancel</button>
                            <button onClick={confirmDelete}
                                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors">Delete</button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    )
}
