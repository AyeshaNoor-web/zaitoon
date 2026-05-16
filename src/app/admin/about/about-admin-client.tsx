'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Save, Plus, Pencil, Trash2, Globe, 
  Image as ImageIcon, Loader2, Check, X,
  User, BookOpen, Layers
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

import { 
  AboutPageContent, AboutValue, Chef, ChefInsert, ChefUpdate,
  BlogPost, BlogPostInsert, BlogPostUpdate 
} from '@/types/about'
import { 
  updateAboutContent, createChef, updateChef, deleteChef,
  createBlogPost, updateBlogPost, deleteBlogPost, toggleBlogPostPublished 
} from '@/lib/about'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
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

// ── Validation Schemas ──────────────────────────────────────────────────────

const chefSchema = z.object({
  name: z.string().min(2).max(100),
  title: z.string().min(2).max(150),
  experience_years: z.number().min(1).max(60),
  bio: z.string().min(20).max(1000),
  photo_url: z.string().url().optional().or(z.literal('')),
  specialties: z.string(), // Comma-separated
  instagram_url: z.string().url().optional().or(z.literal('')),
  facebook_url: z.string().url().optional().or(z.literal('')),
  display_order: z.number().min(0),
  is_active: z.boolean()
})

const blogPostSchema = z.object({
  cover_image_url: z.string().url().optional().or(z.literal('')),
  category: z.string().min(1).max(50),
  title: z.string().min(5).max(200),
  excerpt: z.string().min(10).max(500),
  body: z.string().optional(),
  published_date: z.string(),
  is_published: z.boolean(),
  display_order: z.number().min(0)
})

interface Props {
  initialContent: AboutPageContent
  initialValues: AboutValue[]
  initialChefs: Chef[]
  initialPosts: BlogPost[]
}

export function AboutAdminClient({ 
  initialContent, 
  initialValues, 
  initialChefs, 
  initialPosts 
}: Props) {
  const [content, setContent] = useState(initialContent)
  const [chefs, setChefs] = useState(initialChefs)
  const [posts, setPosts] = useState(initialPosts)
  
  const [isSavingContent, setIsSavingContent] = useState(false)
  
  // Dialog states
  const [chefDialog, setChefDialog] = useState<{ open: boolean, chef: Chef | null }>({ open: false, chef: null })
  const [postDialog, setPostDialog] = useState<{ open: boolean, post: BlogPost | null }>({ open: false, post: null })
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'chef' | 'post' } | null>(null)

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleContentSave = async () => {
    setIsSavingContent(true)
    try {
      await Promise.all(
        Object.entries(content).map(([key, val]) => updateAboutContent(key, val))
      )
      toast.success('About page content updated successfully')
    } catch (err: any) {
      toast.error('Failed to update content: ' + err.message)
    } finally {
      setIsSavingContent(false)
    }
  }

  // Chefs
  const chefForm = useForm<z.infer<typeof chefSchema>>({
    resolver: zodResolver(chefSchema),
    defaultValues: { is_active: true, display_order: 0 }
  })

  const onChefSubmit = async (data: z.infer<typeof chefSchema>) => {
    const payload = {
      ...data,
      specialties: data.specialties.split(',').map(s => s.trim()).filter(Boolean)
    }
    
    try {
      if (chefDialog.chef) {
        const updated = await updateChef(chefDialog.chef.id, payload)
        setChefs(chefs.map(c => c.id === updated.id ? updated : c))
        toast.success('Chef profile updated')
      } else {
        const created = await createChef(payload as ChefInsert)
        setChefs([...chefs, created].sort((a, b) => a.display_order - b.display_order))
        toast.success('New chef added')
      }
      setChefDialog({ open: false, chef: null })
      chefForm.reset()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Blog Posts
  const postForm = useForm<z.infer<typeof blogPostSchema>>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: { is_published: true, display_order: 0, published_date: new Date().toISOString().split('T')[0] }
  })

  const onPostSubmit = async (data: z.infer<typeof blogPostSchema>) => {
    try {
      if (postDialog.post) {
        const updated = await updateBlogPost(postDialog.post.id, data)
        setPosts(posts.map(p => p.id === updated.id ? updated : p))
        toast.success('Blog post updated')
      } else {
        const created = await createBlogPost(data as BlogPostInsert)
        setPosts([...posts, created].sort((a, b) => a.display_order - b.display_order))
        toast.success('New blog post created')
      }
      setPostDialog({ open: false, post: null })
      postForm.reset()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      if (deleteConfirm.type === 'chef') {
        await deleteChef(deleteConfirm.id)
        setChefs(chefs.filter(c => c.id !== deleteConfirm.id))
      } else {
        await deleteBlogPost(deleteConfirm.id)
        setPosts(posts.filter(p => p.id !== deleteConfirm.id))
      }
      toast.success('Deleted successfully')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleteConfirm(null)
    }
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
          <TabsTrigger value="content" className="data-[state=active]:bg-[var(--green-base)] data-[state=active]:text-white gap-2">
            <Globe className="w-4 h-4" /> Page Content
          </TabsTrigger>
          <TabsTrigger value="chefs" className="data-[state=active]:bg-[var(--green-base)] data-[state=active]:text-white gap-2">
            <User className="w-4 h-4" /> Chefs
          </TabsTrigger>
          <TabsTrigger value="blog" className="data-[state=active]:bg-[var(--green-base)] data-[state=active]:text-white gap-2">
            <BookOpen className="w-4 h-4" /> Blog Posts
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Page Content ─────────────────────────────────────────── */}
        <TabsContent value="content" className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Hero Section</CardTitle>
              <CardDescription className="text-zinc-400">Main banner and introduction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Heading</label>
                  <Input 
                    value={content.hero_heading} 
                    onChange={e => setContent({...content, hero_heading: e.target.value})}
                    className="bg-black border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Subheading</label>
                  <Input 
                    value={content.hero_subheading} 
                    onChange={e => setContent({...content, hero_subheading: e.target.value})}
                    className="bg-black border-zinc-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Hero Image URL</label>
                <Input 
                  value={content.hero_image_url} 
                  onChange={e => setContent({...content, hero_image_url: e.target.value})}
                  className="bg-black border-zinc-700 text-white font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Our Story</CardTitle>
              <CardDescription className="text-zinc-400">The historical narrative section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Story Heading</label>
                <Input 
                  value={content.story_heading} 
                  onChange={e => setContent({...content, story_heading: e.target.value})}
                  className="bg-black border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Story Body</label>
                <Textarea 
                  value={content.story_body} 
                  onChange={e => setContent({...content, story_body: e.target.value})}
                  rows={8}
                  className="bg-black border-zinc-700 text-white leading-relaxed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Story Image URL</label>
                <Input 
                  value={content.story_image_url} 
                  onChange={e => setContent({...content, story_image_url: e.target.value})}
                  className="bg-black border-zinc-700 text-white font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Statistical Highlights</CardTitle>
              <CardDescription className="text-zinc-400">Animated counters in the stats bar</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(num => (
                <div key={num} className="p-4 bg-black/40 rounded-xl border border-zinc-800 space-y-3">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Stat {num}</span>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase">Number</label>
                      <Input 
                        value={content[`stat_${num}_number`]} 
                        onChange={e => setContent({...content, [`stat_${num}_number`]: e.target.value})}
                        className="h-8 bg-zinc-900 border-zinc-700 text-white"
                      />
                    </div>
                    <div className="w-16 space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase">Suffix</label>
                      <Input 
                        value={content[`stat_${num}_suffix`]} 
                        onChange={e => setContent({...content, [`stat_${num}_suffix`]: e.target.value})}
                        className="h-8 bg-zinc-900 border-zinc-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase">Label</label>
                    <Input 
                      value={content[`stat_${num}_label`]} 
                      onChange={e => setContent({...content, [`stat_${num}_label`]: e.target.value})}
                      className="h-8 bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleContentSave} 
              disabled={isSavingContent}
              className="bg-[var(--green-base)] hover:bg-[var(--green-dark)] text-white px-8 h-12 rounded-xl font-bold gap-2 shadow-lg shadow-green-900/20"
            >
              {isSavingContent ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save All Page Changes
            </Button>
          </div>
        </TabsContent>

        {/* ── TAB 2: Chefs ────────────────────────────────────────────────── */}
        <TabsContent value="chefs" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Culinary Team</h2>
              <p className="text-sm text-zinc-500">Manage the profiles of your kitchen masters.</p>
            </div>
            <Button onClick={() => setChefDialog({ open: true, chef: null })} className="bg-[var(--green-base)] text-white gap-2">
              <Plus className="w-4 h-4" /> Add New Chef
            </Button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-bold uppercase text-[10px]">Chef</TableHead>
                  <TableHead className="text-zinc-400 font-bold uppercase text-[10px]">Title</TableHead>
                  <TableHead className="text-zinc-400 font-bold uppercase text-[10px]">Experience</TableHead>
                  <TableHead className="text-zinc-400 font-bold uppercase text-[10px]">Active</TableHead>
                  <TableHead className="text-zinc-400 font-bold uppercase text-[10px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chefs.map((chef) => (
                  <TableRow key={chef.id} className="border-zinc-800 hover:bg-white/5">
                    <TableCell className="font-bold text-white flex items-center gap-3 py-4">
                      {chef.photo_url ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-700">
                          <Image src={chef.photo_url} alt={chef.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 uppercase">
                          {chef.name.charAt(0)}
                        </div>
                      )}
                      {chef.name}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">{chef.title}</TableCell>
                    <TableCell className="text-zinc-400 text-sm font-mono">{chef.experience_years}y</TableCell>
                    <TableCell>
                      <Switch 
                        checked={chef.is_active} 
                        onCheckedChange={async (val) => {
                          try {
                            const updated = await updateChef(chef.id, { is_active: val })
                            setChefs(chefs.map(c => c.id === updated.id ? updated : c))
                            toast.success(`Chef ${val ? 'activated' : 'deactivated'}`)
                          } catch (err: any) { toast.error(err.message) }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-400 hover:text-white"
                          onClick={() => {
                            setChefDialog({ open: true, chef })
                            chefForm.reset({
                              ...chef,
                              specialties: chef.specialties.join(', '),
                              photo_url: chef.photo_url || '',
                              instagram_url: chef.instagram_url || '',
                              facebook_url: chef.facebook_url || ''
                            })
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-400 hover:text-red-500"
                          onClick={() => setDeleteConfirm({ id: chef.id, type: 'chef' })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── TAB 3: Blog Posts ───────────────────────────────────────────── */}
        <TabsContent value="blog" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Kitchen Blog</h2>
              <p className="text-sm text-zinc-500">Share stories and recipes with your audience.</p>
            </div>
            <Button onClick={() => setPostDialog({ open: true, post: null })} className="bg-[var(--green-base)] text-white gap-2">
              <Plus className="w-4 h-4" /> Create New Post
            </Button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-bold uppercase text-[10px]">Post</TableHead>
                  <TableHead className="text-zinc-400 font-bold uppercase text-[10px]">Category</TableHead>
                  <TableHead className="text-zinc-400 font-bold uppercase text-[10px]">Date</TableHead>
                  <TableHead className="text-zinc-400 font-bold uppercase text-[10px]">Status</TableHead>
                  <TableHead className="text-zinc-400 font-bold uppercase text-[10px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id} className="border-zinc-800 hover:bg-white/5">
                    <TableCell className="font-bold text-white flex items-center gap-4 py-4 max-w-md">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-zinc-700">
                        <Image src={post.cover_image_url || ''} alt={post.title} fill className="object-cover" />
                      </div>
                      <div className="truncate">
                        <p className="truncate">{post.title}</p>
                        <p className="text-[10px] font-normal text-zinc-500 truncate">{post.excerpt}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 uppercase tracking-wider">
                        {post.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm font-mono">
                      {new Date(post.published_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={post.is_published} 
                        onCheckedChange={async (val) => {
                          try {
                            await toggleBlogPostPublished(post.id, val)
                            setPosts(posts.map(p => p.id === post.id ? { ...p, is_published: val } : p))
                            toast.success(`Post ${val ? 'published' : 'hidden'}`)
                          } catch (err: any) { toast.error(err.message) }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-400 hover:text-white"
                          onClick={() => {
                            setPostDialog({ open: true, post })
                            postForm.reset({
                              ...post,
                              cover_image_url: post.cover_image_url || '',
                              body: post.body || ''
                            })
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-400 hover:text-red-500"
                          onClick={() => setDeleteConfirm({ id: post.id, type: 'post' })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}

      {/* Chef Dialog */}
      <Dialog open={chefDialog.open} onOpenChange={(open) => !open && setChefDialog({ open, chef: null })}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <form onSubmit={chefForm.handleSubmit(onChefSubmit)}>
            <DialogHeader>
              <DialogTitle>{chefDialog.chef ? 'Edit Chef Profile' : 'Add New Chef'}</DialogTitle>
              <DialogDescription className="text-zinc-400">Master profile details for the culinary team.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Full Name</label>
                <Input {...chefForm.register('name')} className="bg-black border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Official Title</label>
                <Input {...chefForm.register('title')} placeholder="e.g. Head Chef" className="bg-black border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Experience Years</label>
                <Input type="number" {...chefForm.register('experience_years', { valueAsNumber: true })} className="bg-black border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Display Order</label>
                <Input type="number" {...chefForm.register('display_order', { valueAsNumber: true })} className="bg-black border-zinc-800" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Specialties (comma separated)</label>
                <Input {...chefForm.register('specialties')} placeholder="e.g. Karahi, Nihari, BBQ" className="bg-black border-zinc-800" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Bio / Quote</label>
                <Textarea {...chefForm.register('bio')} rows={3} className="bg-black border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Photo URL</label>
                <Input {...chefForm.register('photo_url')} className="bg-black border-zinc-800 font-mono text-[10px]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Instagram URL</label>
                <Input {...chefForm.register('instagram_url')} className="bg-black border-zinc-800 font-mono text-[10px]" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setChefDialog({ open: false, chef: null })}>Cancel</Button>
              <Button type="submit" className="bg-[var(--green-base)] text-white">
                {chefDialog.chef ? 'Save Changes' : 'Create Profile'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Blog Post Dialog */}
      <Dialog open={postDialog.open} onOpenChange={(open) => !open && setPostDialog({ open, post: null })}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl">
          <form onSubmit={postForm.handleSubmit(onPostSubmit)}>
            <DialogHeader>
              <DialogTitle>{postDialog.post ? 'Edit Blog Post' : 'Create New Post'}</DialogTitle>
              <DialogDescription className="text-zinc-400">Share recipes, updates and culture.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Post Title</label>
                <Input {...postForm.register('title')} className="bg-black border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Category</label>
                <Input {...postForm.register('category')} placeholder="e.g. Recipe" className="bg-black border-zinc-800" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Excerpt / Short Description</label>
                <Textarea {...postForm.register('excerpt')} rows={2} className="bg-black border-zinc-800" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Full Article Content</label>
                <Textarea {...postForm.register('body')} rows={8} className="bg-black border-zinc-800 font-serif leading-relaxed" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Cover Image URL</label>
                <Input {...postForm.register('cover_image_url')} className="bg-black border-zinc-800 font-mono text-[10px]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Published Date</label>
                <Input type="date" {...postForm.register('published_date')} className="bg-black border-zinc-800" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setPostDialog({ open: false, post: null })}>Cancel</Button>
              <Button type="submit" className="bg-[var(--green-base)] text-white">
                {postDialog.post ? 'Update Post' : 'Publish Post'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete the {deleteConfirm?.type} and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete Forever</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
