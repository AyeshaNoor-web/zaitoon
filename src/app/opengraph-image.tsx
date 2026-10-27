import { ImageResponse } from 'next/og'

export const alt = 'Zaitoon – House of Shawarma & BBQ, Lahore'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '72px 80px',
                    background: 'radial-gradient(ellipse at 85% 0%, rgba(211,86,31,0.35), transparent 60%), #20251A',
                    color: '#F6F1E7',
                    fontFamily: 'serif',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 24, letterSpacing: '0.18em', color: 'rgba(246,241,231,0.7)' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 999, background: '#D3561F' }} />
                    ZAITOON · LAHORE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 104, lineHeight: 1, letterSpacing: '-0.03em' }}>Lahore&apos;s finest</div>
                    <div style={{ fontSize: 104, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#F8E3D5' }}>shawarma &amp; grill</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 26, color: 'rgba(246,241,231,0.75)' }}>
                    <span>Charcoal BBQ · Lebanese shawarma · Delivery across Lahore</span>
                    <span style={{ background: '#B9411A', color: '#fff', padding: '14px 28px', borderRadius: 999 }}>Order online</span>
                </div>
            </div>
        ),
        { ...size }
    )
}
