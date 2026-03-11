import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['var(--font-display)', 'Playfair Display', 'Georgia', 'serif'],
                body: ['var(--font-body)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
                urdu: ['var(--font-urdu)', 'Noto Nastaliq Urdu', 'serif'],
            },
            colors: {
                /* Zaitoon brand greens */
                brand: {
                    darkest: '#050A07',
                    dark: '#0A1A0D',
                    green: '#1A7A3E',
                    mid: '#28A854',
                    vivid: '#2DBF60',
                    light: '#E8F9EE',
                },
                gold: {
                    rich: '#C9920A',
                    bright: '#F0B429',
                    pale: '#FDE68A',
                },
                cream: '#F9F5EE',
                parchment: '#F0E8D5',
                charcoal: '#111111',
                stone: '#5A5A5A',
                smoke: '#E5E5E5',
                /* Light base (Cheezious style) */
                'z-bg': '#F6F6F6',
                'z-card': '#FFFFFF',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            boxShadow: {
                'card-sm': '0 2px 8px rgba(0,0,0,0.06)',
                'card-md': '0 4px 20px rgba(0,0,0,0.09)',
                'card-lg': '0 8px 40px rgba(0,0,0,0.12)',
                'card-xl': '0 16px 60px rgba(0,0,0,0.16)',
                'green': '0 6px 24px rgba(40,168,84,0.35)',
                'gold': '0 6px 24px rgba(201,146,10,0.30)',
            },
        },
    },
    plugins: [],
}

export default config
