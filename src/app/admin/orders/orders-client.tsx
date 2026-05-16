'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Plus, Search, Edit, Trash2, Filter, 
  ChevronDown, ChevronUp, X, Printer,
  Eye, Download, Loader2, Info
} from 'lucide-react'
import { toast } from 'sonner'

import { 
  Order, OrderInsert, OrderUpdate, OrderStatus, 
  OrderType, PaymentMethod, PaymentStatus 
} from '@/types/orders'
import { MenuItem } from '@/types'
import { 
  getOrders, createOrder, updateOrder, 
  updateOrderStatus, deleteOrder 
} from '@/lib/orders'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ── Validation Schema ────────────────────────────────────────────────────────

const orderItemSchema = z.object({
  item_id: z.string().min(1, "Required"),
  item_name: z.string().min(1, "Required"),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  subtotal: z.number().min(0),
})

const orderSchema = z.object({
  customer_name: z.string().min(2, "Name required"),
  customer_phone: z.string().optional().nullable(),
  order_type: z.enum(['dine_in', 'takeaway', 'phone', 'delivery']),
  table_number: z.string().optional().nullable(),
  items: z.array(orderItemSchema).min(1, "At least one item required"),
  special_instructions: z.string().optional().nullable(),
  payment_method: z.enum(['cash', 'card', 'jazzcash', 'easypaisa']),
  payment_status: z.enum(['paid', 'pending', 'partial']),
  order_status: z.enum(['received', 'preparing', 'ready', 'served', 'completed']),
  discount_amount: z.number().min(0),
  total_amount: z.number().min(0),
})

type OrderFormData = z.infer<typeof orderSchema>

interface Props {
  initialOrders: Order[]
  totalOrders: number
  menuItems: MenuItem[]
}

export function OrdersClient({ initialOrders, totalOrders: initialTotal, menuItems }: Props) {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Filters state
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, typeFilter, paymentFilter, statusFilter, dateFrom, dateTo],
    queryFn: () => getOrders({ 
      page, 
      limit: 10, 
      search, 
      type: typeFilter, 
      paymentStatus: paymentFilter, 
      orderStatus: statusFilter,
      dateFrom,
      dateTo
    }),
    initialData: { data: initialOrders, total: initialTotal },
  })

  const orders = data.data
  const totalCount = data.total

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order placed successfully')
      setIsFormOpen(false)
      form.reset()
    },
    onError: (err: any) => toast.error(err.message)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderUpdate }) => updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order updated')
      setIsEditDialogOpen(false)
    },
    onError: (err: any) => toast.error(err.message)
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Status updated')
    },
    onError: (err: any) => toast.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order deleted')
      setDeletingId(null)
    },
    onError: (err: any) => toast.error(err.message)
  })

  // ── Form ───────────────────────────────────────────────────────────────────

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      order_type: 'dine_in',
      table_number: '',
      items: [{ item_id: '', item_name: '', quantity: 1, unit_price: 0, subtotal: 0 }],
      special_instructions: '',
      payment_method: 'cash',
      payment_status: 'pending',
      order_status: 'received',
      discount_amount: 0,
      total_amount: 0,
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  })

  // Auto-calculate subtotals and total
  const watchedItems = form.watch('items')
  const watchedDiscount = form.watch('discount_amount')
  
  useEffect(() => {
    const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
    form.setValue('total_amount', Math.max(0, subtotal - watchedDiscount))
    
    // Sync individual subtotals
    watchedItems.forEach((item, index) => {
      const s = item.quantity * item.unit_price
      if (item.subtotal !== s) {
        form.setValue(`items.${index}.subtotal`, s)
      }
    })
  }, [watchedItems, watchedDiscount, form])

  const onSubmit = (data: OrderFormData) => {
    createMutation.mutate(data as OrderInsert)
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'preparing': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'ready': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'served': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'completed': return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeColor = (type: OrderType) => {
    switch (type) {
      case 'dine_in': return 'bg-blue-100 text-blue-700'
      case 'takeaway': return 'bg-orange-100 text-orange-700'
      case 'phone': return 'bg-purple-100 text-purple-700'
      case 'delivery': return 'bg-green-100 text-green-700'
    }
  }

  const exportCSV = () => {
    const headers = ['Order#', 'Customer', 'Type', 'Total', 'Payment', 'Status', 'Date']
    const rows = orders.map(o => [
      o.order_number,
      o.customer_name,
      o.order_type,
      o.total_amount,
      o.payment_status,
      o.order_status,
      new Date(o.created_at).toLocaleString()
    ])
    
    const content = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* ── Add New Order Card ──────────────────────────────────────────────── */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader 
          className="bg-white dark:bg-zinc-900 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-[var(--green-base)]" />
            Place New Order
          </CardTitle>
          {isFormOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </CardHeader>
        
        {isFormOpen && (
          <CardContent className="bg-white dark:bg-zinc-900 p-6 border-t dark:border-zinc-800">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Customer Name</label>
                  <Input {...form.register('customer_name')} placeholder="Guest Name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Phone Number</label>
                  <Input {...form.register('customer_phone')} placeholder="03xx-xxxxxxx" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Order Type</label>
                  <select 
                    {...form.register('order_type')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="dine_in">Dine-In</option>
                    <option value="takeaway">Takeaway</option>
                    <option value="phone">Phone Order</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
              </div>

              {form.watch('order_type') === 'dine_in' && (
                <div className="w-full md:w-1/3 space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Table Number</label>
                  <Input {...form.register('table_number')} placeholder="T-01" />
                </div>
              )}

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Order Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ item_id: '', item_name: '', quantity: 1, unit_price: 0, subtotal: 0 })}>
                    <Plus className="w-4 h-4 mr-1" /> Add Row
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg border dark:border-zinc-800">
                      <div className="md:col-span-5 space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-60">Item Name</label>
                        <select
                          className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-700 py-1 text-sm outline-none focus:border-[var(--green-base)] transition-colors"
                          onChange={(e) => {
                            const item = menuItems.find(m => m.id === e.target.value)
                            if (item) {
                              form.setValue(`items.${index}.item_id`, item.id)
                              form.setValue(`items.${index}.item_name`, item.name)
                              form.setValue(`items.${index}.unit_price`, item.price || 0)
                            }
                          }}
                        >
                          <option value="">Select an item...</option>
                          {menuItems.map(m => <option key={m.id} value={m.id}>{m.name} - PKR {m.price}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-60">Qty</label>
                        <Input type="number" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} className="h-8" />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-60">Price</label>
                        <Input type="number" {...form.register(`items.${index}.unit_price`, { valueAsNumber: true })} className="h-8" />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase opacity-60">Subtotal</label>
                        <Input type="number" readOnly {...form.register(`items.${index}.subtotal`)} className="h-8 bg-gray-100 dark:bg-zinc-800 border-none font-bold" />
                      </div>
                      <div className="md:col-span-1 pb-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-red-500">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Special Instructions</label>
                    <Textarea {...form.register('special_instructions')} rows={3} placeholder="No onions, extra sauce..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Payment Method</label>
                      <select {...form.register('payment_method')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="jazzcash">JazzCash</option>
                        <option value="easypaisa">EasyPaisa</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Payment Status</label>
                      <select {...form.register('payment_status')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                        <option value="pending">Pending</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-950 p-6 rounded-2xl flex flex-col justify-between border dark:border-zinc-800">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-bold">PKR {watchedItems.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Discount (PKR)</span>
                      <Input type="number" {...form.register('discount_amount', { valueAsNumber: true })} className="w-24 h-8 text-right font-bold" />
                    </div>
                    <div className="h-[1px] bg-gray-200 dark:bg-zinc-800 my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold">Total Amount</span>
                      <span className="text-2xl font-black text-[var(--green-base)]">PKR {form.watch('total_amount').toLocaleString()}</span>
                    </div>
                  </div>
                  <Button type="submit" className="w-full mt-6 bg-[var(--green-base)] hover:bg-[var(--green-dark)] text-white h-11 text-base font-bold shadow-lg" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Place Order'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* ── Filters Bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by customer or order number..." 
            className="pl-9 bg-transparent border-none focus-visible:ring-0 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 px-3 rounded-md border text-sm bg-transparent outline-none">
            <option value="all">All Types</option>
            <option value="dine_in">Dine-In</option>
            <option value="takeaway">Takeaway</option>
            <option value="phone">Phone</option>
            <option value="delivery">Delivery</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-md border text-sm bg-transparent outline-none">
            <option value="all">All Status</option>
            <option value="received">Received</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="served">Served</option>
            <option value="completed">Completed</option>
          </select>
          <div className="flex items-center gap-1">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-32" />
            <span className="text-muted-foreground">to</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-32" />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      {/* ── Orders Table ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-zinc-950">
            <TableRow>
              <TableHead>Order#</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50">
                  <TableCell className="font-mono font-bold text-xs">{order.order_number}</TableCell>
                  <TableCell>
                    <p className="font-semibold text-sm">{order.customer_name}</p>
                    <p className="text-[10px] text-muted-foreground">{order.customer_phone || 'No phone'}</p>
                  </TableCell>
                  <TableCell>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getTypeColor(order.order_type))}>
                      {order.order_type.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 group cursor-help relative">
                      <span className="text-sm font-medium">{order.items.length} items</span>
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 w-48 bg-gray-900 text-white text-[10px] p-2 rounded-lg shadow-xl">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="flex justify-between border-b border-white/10 py-1 last:border-0">
                            <span>{i.item_name} × {i.quantity}</span>
                            <span>{i.subtotal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">PKR {Number(order.total_amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 
                      order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'
                    )}>
                      {order.payment_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <select 
                      value={order.order_status}
                      onChange={(e) => statusMutation.mutate({ id: order.id, status: e.target.value as OrderStatus })}
                      className={cn("h-7 px-2 rounded-md text-[10px] font-bold uppercase border-none outline-none focus:ring-1 focus:ring-[var(--green-base)]", getStatusColor(order.order_status))}
                      disabled={statusMutation.isPending}
                    >
                      <option value="received">Received</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="served">Served</option>
                      <option value="completed">Completed</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }} className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeletingId(order.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No orders found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        <div className="p-4 bg-gray-50 dark:bg-zinc-950 border-t dark:border-zinc-800 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Showing {orders.length} of {totalCount} orders</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page * 10 >= totalCount} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      </div>

      {/* ── Order Detail Sheet ──────────────────────────────────────────────── */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl bg-white dark:bg-zinc-900 border-none shadow-2xl p-0 flex flex-col">
          <div className="p-6 overflow-y-auto flex-1">
            <SheetHeader className="mb-6">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-black">Order Summary</SheetTitle>
                <span className="font-mono font-bold bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded text-sm">
                  {selectedOrder?.order_number}
                </span>
              </div>
              <SheetDescription>
                Placed on {selectedOrder && new Date(selectedOrder.created_at).toLocaleString()}
              </SheetDescription>
            </SheetHeader>

            {selectedOrder && (
              <div className="space-y-8" id="print-area">
                {/* Print Only Header */}
                <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
                  <h1 className="text-3xl font-black uppercase">Zaitoon Restaurant</h1>
                  <p className="text-sm">Lahore, Pakistan</p>
                  <p className="text-xs font-bold mt-2">{selectedOrder.order_number}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Customer</p>
                    <p className="font-bold text-base">{selectedOrder.customer_name}</p>
                    <p className="text-sm">{selectedOrder.customer_phone}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Order Type</p>
                    <p className="font-bold text-base capitalize">{selectedOrder.order_type.replace('_', ' ')}</p>
                    {selectedOrder.table_number && <p className="text-sm">Table: {selectedOrder.table_number}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground border-b pb-2">Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="h-auto py-1 pl-0">Item</TableHead>
                        <TableHead className="h-auto py-1 text-center">Qty</TableHead>
                        <TableHead className="h-auto py-1 text-right pr-0">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, idx) => (
                        <TableRow key={idx} className="border-none hover:bg-transparent">
                          <TableCell className="py-2 pl-0 font-medium">{item.item_name}</TableCell>
                          <TableCell className="py-2 text-center">× {item.quantity}</TableCell>
                          <TableCell className="py-2 text-right pr-0">PKR {Number(item.subtotal).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold">PKR {selectedOrder.items.reduce((acc, i) => acc + Number(i.subtotal), 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-red-500 font-bold">- PKR {Number(selectedOrder.discount_amount).toLocaleString()}</span>
                  </div>
                  <div className="border-t dark:border-zinc-800 pt-3 flex justify-between">
                    <span className="text-base font-bold">Total Payable</span>
                    <span className="text-xl font-black text-[var(--green-base)]">PKR {Number(selectedOrder.total_amount).toLocaleString()}</span>
                  </div>
                </div>

                {selectedOrder.special_instructions && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Instructions</p>
                    <p className="text-sm italic">&ldquo;{selectedOrder.special_instructions}&rdquo;</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Payment</p>
                    <p className="text-sm font-bold uppercase">{selectedOrder.payment_method} - {selectedOrder.payment_status}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Order Status</p>
                    <p className="text-sm font-bold uppercase">{selectedOrder.order_status}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 dark:bg-zinc-950 border-t dark:border-zinc-800 flex gap-3">
            <Button className="flex-1 gap-2 bg-zinc-900 text-white hover:bg-zinc-800" onClick={handlePrint}>
              <Printer className="w-4 h-4" /> Print Receipt
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirmation ────────────────────────────────────────────── */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the order from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate(deletingId)} className="bg-red-500 text-white">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}
