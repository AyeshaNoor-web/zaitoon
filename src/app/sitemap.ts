import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://zaitoon.pk',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: 'https://zaitoon.pk/menu',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: 'https://zaitoon.pk/loyalty',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
    ]
}
