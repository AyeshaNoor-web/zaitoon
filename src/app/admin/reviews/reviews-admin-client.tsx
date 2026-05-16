'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Plus, Search, MoreHorizontal, Edit, Trash2, 
  CheckCircle2, XCircle, Star, Filter, 
  ArrowUpDown, Loader2, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

import { Review, ReviewInsert, ReviewUpdate } from '@/types/reviews'
import { 
  getAllReviews, createReview, updateReview, 
  deleteReview, toggleReviewPublished 
} from '@/lib/api/reviews'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { Card, CardContent } from '@/components/ui/card'
import { StarRating } from '@/components/reviews/star-rating'
import { cn } from '@/lib/utils'

const reviewSchema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  customer_location: z.string().min(2, "Location must be at least 2 characters").max(100),
  customer_image_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  rating: z.number().min(1).max(5),
  review_text: z.string().min(10, "Review must be at least 10 characters").max(1000),
  date_posted: z.string(),
  is_published: z.boolean(),
  is_verified: z.boolean(),
  display_order: z.number().min(0)
})

type FormData = z.infer<typeof reviewSchema>

interface Props {
  initialReviews: Review[]
}

export function ReviewsAdminClient({ initialReviews }: Props) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'unpublished'>('all')
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: reviews = initialReviews, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: getAllReviews,
    initialData: initialReviews,
  })

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      toast.success('Review created successfully')
      setIsDialogOpen(false)
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewUpdate }) => updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      toast.success('Review updated successfully')
      setIsDialogOpen(false)
      setEditingReview(null)
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      toast.success('Review deleted successfully')
      setDeletingId(null)
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) => toggleReviewPublished(id, published),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      toast.success('Status updated')
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`)
  })

  // ── Form ───────────────────────────────────────────────────────────────────
  const form = useForm<FormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      customer_name: '',
      customer_location: 'Pakistan',
      customer_image_url: '',
      rating: 5,
      review_text: '',
      date_posted: new Date().toISOString().split('T')[0],
      is_published: true,
      is_verified: true,
      display_order: 0,
    }
  })

  const onSubmit = (data: FormData) => {
    if (editingReview) {
      updateMutation.mutate({ id: editingReview.id, data })
    } else {
      createMutation.mutate(data as ReviewInsert)
    }
  }

  const handleEdit = (review: Review) => {
    setEditingReview(review)
    form.reset({
      customer_name: review.customer_name,
      customer_location: review.customer_location,
      customer_image_url: review.customer_image_url || '',
      rating: review.rating,
      review_text: review.review_text,
      date_posted: review.date_posted,
      is_published: review.is_published,
      is_verified: review.is_verified,
      display_order: review.display_order,
    })
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingReview(null)
    form.reset({
      customer_name: '',
      customer_location: 'Lahore, Pakistan',
      customer_image_url: '',
      rating: 5,
      review_text: '',
      date_posted: new Date().toISOString().split('T')[0],
      is_published: true,
      is_verified: true,
      display_order: reviews.length + 1,
    })
    setIsDialogOpen(true)
  }

  // ── Filtering & Sorting ────────────────────────────────────────────────────
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchSearch = r.customer_name.toLowerCase().includes(search.toLowerCase()) || 
                          r.review_text.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'all' ? true : 
                          filter === 'published' ? r.is_published : !r.is_published
      return matchSearch && matchFilter
    })
  }, [reviews, search, filter])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = reviews.length
    const published = reviews.filter(r => r.is_published).length
    const avgRating = total > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1) : '0.0'
    const pending = reviews.filter(r => !r.is_published).length
    return { total, published, avgRating, pending }
  }, [reviews])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reviews', value: stats.total, icon: Star, color: 'text-blue-600' },
          { label: 'Published', value: stats.published, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Avg Rating', value: `${stats.avgRating} ★`, icon: Star, color: 'text-amber-500' },
          { label: 'Unpublished', value: stats.pending, icon: XCircle, color: 'text-red-500' },
        ].map((stat, i) => (
          <Card key={i} className="bg-white dark:bg-zinc-900 border-none shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <stat.icon className={cn("w-8 h-8 opacity-20", stat.color)} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by customer or review text..." 
            className="pl-9 bg-transparent border-none focus-visible:ring-0 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setFilter(filter === 'all' ? 'published' : filter === 'published' ? 'unpublished' : 'all')}
            className="h-9 gap-2 whitespace-nowrap"
          >
            <Filter className="w-4 h-4" />
            {filter === 'all' ? 'All Reviews' : filter === 'published' ? 'Published' : 'Unpublished'}
          </Button>
          <Button onClick={handleAddNew} className="h-9 gap-2 bg-[var(--green-base)] hover:bg-[var(--green-dark)] text-white">
            <Plus className="w-4 h-4" /> Add Review
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-zinc-950">
            <TableRow>
              <TableHead className="w-[200px]">Customer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="max-w-[300px]">Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <TableRow key={review.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold">
                        {review.customer_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{review.customer_name}</p>
                        <p className="text-[10px] text-muted-foreground">{review.customer_location}</p>
                        {review.order_id && (
                          <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1 rounded font-bold uppercase">Order Linked</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StarRating rating={review.rating} size="sm" />
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="text-xs line-clamp-2 italic">&ldquo;{review.review_text}&rdquo;</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(review.date_posted).toLocaleDateString()}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={review.is_published}
                        onCheckedChange={(val) => toggleMutation.mutate({ id: review.id, published: val })}
                        disabled={toggleMutation.isPending}
                      />
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        review.is_published ? "text-green-600" : "text-gray-400"
                      )}>
                        {review.is_published ? 'Public' : 'Hidden'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(review)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeletingId(review.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No reviews found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle>{editingReview ? 'Edit Review' : 'Add New Review'}</DialogTitle>
            <DialogDescription>
              Fill in the details below to {editingReview ? 'update' : 'create'} a customer review.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Customer Name</label>
                <Input {...form.register('customer_name')} placeholder="e.g. Ahmed Raza" />
                {form.formState.errors.customer_name && (
                  <p className="text-[10px] text-red-500">{form.formState.errors.customer_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Location</label>
                <Input {...form.register('customer_location')} placeholder="e.g. Lahore, Pakistan" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Image URL (Optional)</label>
              <Input {...form.register('customer_image_url')} placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Rating (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => form.setValue('rating', s)}
                      className="transition-transform active:scale-95"
                    >
                      <Star 
                        className={cn("w-6 h-6", form.watch('rating') >= s ? "fill-amber-400 text-amber-400" : "text-gray-300")} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Date Posted</label>
                <Input type="date" {...form.register('date_posted')} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Review Text</label>
              <Textarea {...form.register('review_text')} rows={4} placeholder="Write the customer's feedback here..." />
              <p className="text-right text-[10px] text-muted-foreground">
                {form.watch('review_text')?.length || 0}/1000
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-zinc-950 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold uppercase">Published</label>
                  <p className="text-[10px] text-muted-foreground">Show on website</p>
                </div>
                <Switch 
                  checked={form.watch('is_published')}
                  onCheckedChange={(val) => form.setValue('is_published', val)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold uppercase">Verified</label>
                  <p className="text-[10px] text-muted-foreground">Show verified badge</p>
                </div>
                <Switch 
                  checked={form.watch('is_verified')}
                  onCheckedChange={(val) => form.setValue('is_verified', val)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Display Order (Lower = First)</label>
              <Input type="number" {...form.register('display_order', { valueAsNumber: true })} />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[var(--green-base)] text-white hover:bg-[var(--green-dark)]" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingReview ? 'Update Review' : 'Save Review'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the review from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
