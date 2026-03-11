export default function RestaurantSchema() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: 'Zaitoon \u2013 House of Shawarma & BBQ',
        description: 'Authentic Lebanese shawarma and BBQ restaurant in Lahore, Pakistan.',
        url: 'https://zaitoon.pk',
        logo: 'https://zaitoon.pk/logo-en.png',
        image: 'https://zaitoon.pk/og-image.jpg',
        servesCuisine: ['Lebanese', 'BBQ', 'Middle Eastern', 'Pakistani'],
        priceRange: 'Rs. 350 \u2013 Rs. 7,500',
        currenciesAccepted: 'PKR',
        paymentAccepted: 'Cash, JazzCash, EasyPaisa',
        hasMenu: 'https://zaitoon.pk/menu',
        telephone: '+92-300-1330234',
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '1200',
            bestRating: '5',
        },
        location: [
            {
                '@type': 'LocalBusiness',
                name: 'Zaitoon Wapda Town',
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: 'E-88, Block E1, Wapda Town Phase 1',
                    addressLocality: 'Lahore',
                    addressRegion: 'Punjab',
                    addressCountry: 'PK',
                },
                geo: {
                    '@type': 'GeoCoordinates',
                    latitude: 31.4697,
                    longitude: 74.2728,
                },
                openingHours: 'Mo-Su 12:00-01:00',
                telephone: '+92-300-1330234',
            },
            {
                '@type': 'LocalBusiness',
                name: 'Zaitoon Cantonment',
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: '22-23, Tufail Road, near Mall of Lahore',
                    addressLocality: 'Lahore',
                    addressRegion: 'Punjab',
                    addressCountry: 'PK',
                },
                geo: {
                    '@type': 'GeoCoordinates',
                    latitude: 31.5497,
                    longitude: 74.3436,
                },
                openingHours: 'Mo-Su 12:00-01:00',
                telephone: '+92-300-1330234',
            },
        ],
        sameAs: [
            'https://www.instagram.com/zaitoonlahore',
            'https://www.facebook.com/zaitoonlahore',
        ],
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    )
}
