import { ImageResponse } from 'next/og'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F172A',
          color: 'white',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0 80px',
          }}
        >
          <h1
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              textAlign: 'center',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Premium Andean
            <span style={{ color: '#059669' }}> Hospitality</span>
          </h1>
          <p
            style={{
              fontSize: 28,
              color: '#CBD5E1',
              textAlign: 'center',
              marginTop: 24,
              marginBottom: 0,
              lineHeight: 1.4,
            }}
          >
            Medellín Stress-Free Arrival
          </p>
        </div>
      </div>
    ),
    size,
  )
}
