'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, CheckCircle2, XCircle, Star, Search } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getAllReviews, approveReview, rejectReview } from '@/lib/api/reviews'

interface Review {
    id: string
    rating: number
    comment: string | null
    is_approved: boolean
    created_at: string
    customers: { name: string; phone: string } | null
    orders: { order_number: string } | null
}

function StarRow({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star
                    key={s}
                    className="w-4 h-4"
                    fill={s <= rating ? '#C9920A' : 'none'}
                    stroke="#C9920A"
                    strokeWidth={1.5}
                />
            ))}
        </div>
    )
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
    const [search, setSearch] = useState('')

    useEffect(() => {
        getAllReviews()
            .then(data => setReviews(data as unknown as Review[]))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const visible = reviews.filter(r => {
        const matchFilter =
            filter === 'all' ? true :
                filter === 'pending' ? !r.is_approved :
                    r.is_approved
        const matchSearch = search
            ? (r.customers?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (r.comment ?? '').toLowerCase().includes(search.toLowerCase())
            : true
        return matchFilter && matchSearch
    })

    const handleApprove = async (id: string) => {
        await approveReview(id)
        setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: true } : r))
    }

    const handleReject = async (id: string) => {
        await rejectReview(id)
        setReviews(prev => prev.filter(r => r.id !== id))
    }

    const pending = reviews.filter(r => !r.is_approved).length

    return (
        <AdminLayout>
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="mr-auto">
                        <h1 className="font-display text-2xl font-bold text-[#18181B]">
                            Customer Reviews
                        </h1>
                        {pending > 0 && (
                            <p className="text-sm text-[#57534E] mt-0.5">
                                <span className="font-bold text-amber-600">{pending}</span> pending approval
                            </p>
                        )}
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-[#E7E0D8]">
                        <Search className="w-4 h-4 text-[#57534E]" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search reviews..."
                            className="outline-none text-sm w-36 text-[#18181B]"
                        />
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-1 bg-[#FAF6EF] rounded-xl p-1 border border-[#E7E0D8]">
                        {(['pending', 'approved', 'all'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold capitalize transition-colors ${filter === tab
                                    ? 'bg-white shadow-sm text-[#18181B]'
                                    : 'text-[#57534E] hover:text-[#18181B]'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-8 h-8 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : visible.length === 0 ? (
                    <div className="text-center py-24 text-[#57534E]">
                        <div className="text-5xl mb-4">⭐</div>
                        <p className="font-bold text-lg text-[#18181B]">No reviews here</p>
                        <p className="text-sm mt-1">
                            {filter === 'pending' ? 'All reviews have been moderated.' : 'No reviews match your filter.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-[#E7E0D8] overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-[#FAF6EF] border-b border-[#E7E0D8]">
                                <tr>
                                    {['Customer', 'Order', 'Rating', 'Comment', 'Date', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-4 text-left text-xs font-bold text-[#57534E] uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {visible.map((r, i) => (
                                        <motion.tr
                                            key={r.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className="border-b last:border-0 border-[#E7E0D8] hover:bg-[#FAF6EF]/50 transition-colors"
                                        >
                                            {/* Customer */}
                                            <td className="px-4 py-4">
                                                <p className="font-bold text-[#18181B]">{r.customers?.name ?? '—'}</p>
                                                <p className="text-[11px] text-[#57534E]">{r.customers?.phone ?? ''}</p>
                                            </td>

                                            {/* Order */}
                                            <td className="px-4 py-4 font-mono text-[12px] text-[#57534E]">
                                                #{r.orders?.order_number ?? '—'}
                                            </td>

                                            {/* Rating */}
                                            <td className="px-4 py-4">
                                                <StarRow rating={r.rating} />
                                                <span className="text-[11px] text-[#57534E] mt-0.5 block">{r.rating}/5</span>
                                            </td>

                                            {/* Comment */}
                                            <td className="px-4 py-4 max-w-[220px]">
                                                {r.comment ? (
                                                    <p className="text-[13px] text-[#18181B] line-clamp-2 leading-snug">
                                                        "{r.comment}"
                                                    </p>
                                                ) : (
                                                    <span className="text-[#57534E] italic text-[12px]">No comment</span>
                                                )}
                                            </td>

                                            {/* Date */}
                                            <td className="px-4 py-4 text-[12px] text-[#57534E] whitespace-nowrap">
                                                {new Date(r.created_at).toLocaleDateString('en-PK', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </td>

                                            {/* Status badge */}
                                            <td className="px-4 py-4">
                                                {r.is_approved ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                                        <Check className="w-3 h-3" strokeWidth={3} /> Approved
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                                                        ⏳ Pending
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-4">
                                                <div className="flex gap-2">
                                                    {!r.is_approved && (
                                                        <button
                                                            onClick={() => handleApprove(r.id)}
                                                            title="Approve"
                                                            className="p-2 rounded-xl hover:bg-green-50 text-[#57534E] hover:text-green-600 transition-colors"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleReject(r.id)}
                                                        title="Delete"
                                                        className="p-2 rounded-xl hover:bg-red-50 text-[#57534E] hover:text-red-500 transition-colors"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
