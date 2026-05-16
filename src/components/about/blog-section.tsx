import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { BlogPost } from '@/types/about'

interface Props {
  posts: BlogPost[]
  heading: string
}

export function BlogSection({ posts, heading }: Props) {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold">{heading}</h2>
        <div className="w-16 h-1 bg-[var(--green-base)] mx-auto mt-4 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Card key={post.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-white dark:bg-zinc-900">
            <div className="relative h-56 overflow-hidden">
              <Image
                src={post.cover_image_url || 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600'}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            
            <CardContent className="p-6 flex flex-col flex-1">
              <span className="text-[10px] font-black uppercase text-[var(--green-base)] tracking-widest mb-2 inline-block">
                {post.category}
              </span>
              <h3 className="text-lg font-bold mb-3 line-clamp-2 leading-tight group-hover:text-[var(--green-base)] transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                {post.excerpt}
              </p>
              
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-medium">
                  {new Date(post.published_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <Link 
                  href={`/blog/${post.id}`} 
                  className="text-xs font-bold text-[var(--green-base)] hover:translate-x-1 transition-transform flex items-center gap-1"
                >
                  Read More &rarr;
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
