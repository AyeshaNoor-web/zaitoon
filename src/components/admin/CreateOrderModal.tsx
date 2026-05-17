'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag } from 'lucide-react'
import { formatPrice } from '@/lib/payment'
import { getMenuItems } from '@/lib/api/menu'
import { createOrder } from '@/lib/api/orders'
import type { MenuItem, CartItem, OrderType } from '@/types'

interface Props {
    isOpen: boolean
    onClose: () => void
}

export default function CreateOrderModal({ isOpen, onClose }: Props) {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    
    const [cart, setCart] = useState<CartItem[]>([])
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [orderType, setOrderType] = useState<OrderType>('dine-in')
    const [notes, setNotes] = useState('')
    
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            getMenuItems()
                .then(setMenuItems)
                .catch(() => setError('Failed to load menu.'))
                .finally(() => setLoading(false))
        } else {
            // reset state on close
            setCart([])
            setCustomerName('')
            setCustomerPhone('')
            setNotes('')
            setOrderType('dine-in')
        }
    }, [isOpen])

    if (!isOpen) return null

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.menuItemId === item.id)
            if (existing) {
                return prev.map(i => i.menuItemId === item.id 
                    ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice } 
                    : i)
            }
            return [...prev, {
                id: crypto.randomUUID(),
                menuItemId: item.id,
                name: item.name,
                size: null,
                unitPrice: item.price ?? 0,
                quantity: 1,
                subtotal: item.price ?? 0,
                imageUrl: item.image_url ?? null,
            }]
        })
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(i => i.id !== id))
    }

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                const q = Math.max(1, i.quantity + delta)
                return { ...i, quantity: q, subtotal: q * i.unitPrice }
            }
            return i
        }))
    }

    const subtotal = cart.reduce((s, i) => s + i.subtotal, 0)
    // No delivery fee for dine-in/takeaway created by admin usually, or just 0
    const total = subtotal

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return
        if (orderType === 'takeaway' && !customerName) {
            setError('Name is required for Takeaway.')
            return
        }

        setSubmitting(true)
        setError('')
        try {
            await createOrder({
                customerName: customerName || 'Dine-in Guest',
                customerPhone: customerPhone || 'N/A',
                branchId: '00000000-0000-0000-0000-000000000000', // Need default branch or selected
                orderType,
                items: cart,
                subtotal,
                deliveryFee: 0,
                loyaltyDiscount: 0,
                total,
                paymentMethod: 'cod', // usually POS cash
                notes
            })
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to place order')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-[#FAFAFA] rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden border border-[#E7E0D8]"
            >
                {/* Left Side: Menu Items */}
                <div className="flex-1 flex flex-col h-full border-r border-[#E7E0D8] bg-white">
                    <div className="p-4 border-b border-[#E7E0D8] bg-[#FEF9EE]">
                        <h2 className="text-xl font-bold text-[#18181B]">Menu</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {loading ? (
                            <p className="text-sm text-gray-500 text-center py-8">Loading...</p>
                        ) : (
                            menuItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E7E0D8] hover:border-[var(--green-base)] transition-colors">
                                    <div>
                                        <p className="font-bold text-sm text-[#18181B]">{item.name}</p>
                                        <p className="text-xs font-semibold text-[var(--green-dark)]">{formatPrice(item.price ?? 0)}</p>
                                    </div>
                                    <button
                                        onClick={() => addToCart(item)}
                                        className="w-8 h-8 rounded-full bg-[var(--green-base)] text-white flex items-center justify-center hover:bg-[var(--green-dark)] transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Side: Cart & Checkout */}
                <div className="w-full md:w-[400px] flex flex-col h-full bg-[#FAFAFA]">
                    <div className="p-4 border-b border-[#E7E0D8] flex justify-between items-center bg-white">
                        <h2 className="text-xl font-bold text-[#18181B]">Current Order</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                        {/* Order Type */}
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                            {(['dine-in', 'takeaway'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setOrderType(t)}
                                    className={`flex-1 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${orderType === t ? 'bg-white shadow text-[#18181B]' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    {t.replace('-', ' ')}
                                </button>
                            ))}
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-3">
                            <input 
                                type="text"
                                placeholder={orderType === 'dine-in' ? "Table / Name (Optional)" : "Customer Name *"}
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-[#E7E0D8] focus:outline-none focus:border-[var(--green-base)] bg-white"
                            />
                            {orderType === 'takeaway' && (
                                <input 
                                    type="text"
                                    placeholder="Phone Number (Optional)"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E7E0D8] focus:outline-none focus:border-[var(--green-base)] bg-white"
                                />
                            )}
                             <input 
                                type="text"
                                placeholder="Order Notes (Optional)"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-[#E7E0D8] focus:outline-none focus:border-[var(--green-base)] bg-white"
                            />
                        </div>

                        <hr className="border-[#E7E0D8]" />

                        {/* Cart Items */}
                        <div className="flex-1 space-y-3">
                            {cart.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-8">Cart is empty</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex gap-3 text-sm">
                                        <div className="flex-1">
                                            <p className="font-bold text-[#18181B]">{item.name}</p>
                                            <p className="text-xs font-medium text-gray-500">{formatPrice(item.unitPrice)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-white border border-[#E7E0D8] rounded-lg p-0.5">
                                                <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-gray-100 rounded-md"><Minus className="w-3 h-3" /></button>
                                                <span className="w-4 text-center font-bold text-xs">{item.quantity}</span>
                                                <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-gray-100 rounded-md"><Plus className="w-3 h-3" /></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded-md"><X className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-white border-t border-[#E7E0D8] space-y-4">
                        {error && <p className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
                        
                        <div className="flex justify-between items-center text-lg font-bold text-[#18181B]">
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={submitting || cart.length === 0}
                            className="w-full py-3 rounded-xl bg-[var(--green-base)] hover:bg-[var(--green-dark)] text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? 'Placing Order...' : (
                                <>
                                    <ShoppingBag className="w-4 h-4" />
                                    Place Order
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
