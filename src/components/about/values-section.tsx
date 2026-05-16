import { Card, CardContent } from '@/components/ui/card'
import { AboutValue } from '@/types/about'

interface Props {
  values: AboutValue[]
}

export function ValuesSection({ values }: Props) {
  return (
    <section className="py-20 bg-gray-50 dark:bg-zinc-950/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
          <div className="w-16 h-1 bg-[var(--green-base)] mx-auto rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((val) => (
            <Card key={val.id} className="border-none shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 bg-white dark:bg-zinc-900">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="text-5xl mb-6">{val.icon}</div>
                <h3 className="font-bold text-xl mb-3">{val.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {val.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
