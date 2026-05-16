import { getAboutPageContent, getAboutValues, getChefs, getBlogPosts } from '@/lib/about'
import AdminLayout from '@/components/admin/AdminLayout'
import { AboutAdminClient } from './about-admin-client'

export const metadata = {
  title: 'About Page CMS | Zaitoon Admin',
}

export default async function AdminAboutPage() {
  const [content, values, chefs, posts] = await Promise.all([
    getAboutPageContent(),
    getAboutValues(),
    getChefs(false), // Include inactive chefs for admin
    getBlogPosts(false) // Include unpublished posts for admin
  ])

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Our Story & About CMS</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage your restaurant story, team of chefs, and kitchen blog.
          </p>
        </div>

        <AboutAdminClient 
          initialContent={content}
          initialValues={values}
          initialChefs={chefs}
          initialPosts={posts}
        />
      </div>
    </AdminLayout>
  )
}
