import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export default function NotFound() {
    return (
        <>
            <Navbar />
            <main id="main" className="pt-nav flex min-h-[100svh] items-center justify-center px-5">
                <div className="max-w-md py-20 text-center">
                    <p className="font-accent text-[8rem] italic leading-none text-ember-500">404</p>
                    <h1 className="mt-4 text-[clamp(2rem,5vw,2.75rem)]">This page went off the grill.</h1>
                    <p className="mt-3 text-ink-2">The link may be old or mistyped. The menu, at least, is right where we left it.</p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link href="/menu" className="btn-primary">See the menu</Link>
                        <Link href="/" className="btn-outline-dark">Go home</Link>
                    </div>
                </div>
            </main>
        </>
    )
}
