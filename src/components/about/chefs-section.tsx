import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Instagram, Facebook } from 'lucide-react'
import { Chef } from '@/types/about'

interface Props {
  chefs: Chef[]
  heading: string
  subheading: string
}

export function ChefsSection({ chefs, heading, subheading }: Props) {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold">{heading}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {subheading}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {chefs.map((chef) => (
          <Card key={chef.id} className="relative pt-12 overflow-visible border-none bg-gray-50 dark:bg-zinc-900 shadow-sm">
            {/* Experience Badge */}
            <div className="absolute top-4 right-4 bg-[var(--green-base)] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {chef.experience_years} Years
            </div>

            <CardContent className="p-8 flex flex-col items-center">
              {/* Photo */}
              <div className="relative w-32 h-32 mb-6 -mt-16 ring-4 ring-white dark:ring-zinc-800 rounded-full overflow-hidden shadow-lg">
                {chef.photo_url ? (
                  <Image
                    src={chef.photo_url}
                    alt={chef.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-2xl font-bold text-zinc-400">
                    {chef.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="text-center space-y-2 mb-4">
                <h3 className="text-xl font-bold">{chef.name}</h3>
                <p className="text-sm font-semibold text-[var(--green-base)] uppercase tracking-wide">
                  {chef.title}
                </p>
              </div>

              <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6 italic">
                &ldquo;{chef.bio}&rdquo;
              </p>

              {/* Specialties */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {chef.specialties.map((spec, i) => (
                  <span 
                    key={i} 
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--green-base)]/10 text-[var(--green-base)] uppercase"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* Socials */}
              {(chef.instagram_url || chef.facebook_url) && (
                <div className="flex items-center gap-4 pt-4 border-t w-full justify-center border-zinc-200 dark:border-zinc-800">
                  {chef.instagram_url && (
                    <a href={chef.instagram_url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-pink-500 transition-colors">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {chef.facebook_url && (
                    <a href={chef.facebook_url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-blue-600 transition-colors">
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
