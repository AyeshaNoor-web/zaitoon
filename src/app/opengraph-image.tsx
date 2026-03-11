import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Zaitoon \u2013 House of Shawarma & BBQ Lahore'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #050D08 0%, #0A1F13 50%, #1B4332 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'serif',
                }}
            >
                <div style={{ fontSize: 72, color: '#F0B429', fontWeight: 700, marginBottom: 16 }}>
                    \u0632\u06cc\u062a\u0648\u0646
                </div>
                <div style={{ fontSize: 48, color: 'white', fontWeight: 600 }}>
                    Zaitoon
                </div>
                <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
                    House of Shawarma & BBQ \u00b7 Lahore
                </div>
                <div style={{
                    marginTop: 32,
                    background: '#C9920A',
                    color: '#050D08',
                    padding: '12px 32px',
                    borderRadius: 12,
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                }}>
                    ORDER ONLINE \u2192 zaitoon.pk
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
