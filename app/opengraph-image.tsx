import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Gaurav Patil - Full Stack Developer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0B0B0F 0%, #1a1a2e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Terminal Window */}
        <div
          style={{
            background: '#13162D',
            border: '4px solid #9C7FD9',
            borderRadius: '16px',
            padding: '60px 80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '30px',
            position: 'relative',
            boxShadow: '0 0 60px rgba(156, 127, 217, 0.4)',
          }}
        >
          {/* Terminal dots */}
          <div style={{ display: 'flex', position: 'absolute', top: '20px', left: '24px', gap: '10px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#FFBD2E' }} />
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#28CA42' }} />
          </div>

          {/* Terminal prompt */}
          <div
            style={{
              display: 'flex',
              fontSize: '72px',
              fontFamily: 'monospace',
              color: '#CBACF9',
              fontWeight: 'bold',
              textShadow: '0 0 20px rgba(203, 172, 249, 0.5)',
            }}
          >
            &gt; gaurav_
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: 'flex',
              fontSize: '32px',
              fontFamily: 'sans-serif',
              color: '#ffffff',
              opacity: 0.9,
            }}
          >
            Full Stack Developer | Software Engineer
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#CBACF9',
            opacity: 0.9,
            fontWeight: 'bold',
          }}
        >
          www.gauravpatil.online
        </div>
        
        {/* Portfolio Badge */}
        <div
          style={{
            position: 'absolute',
            top: '30px',
            right: '40px',
            background: 'rgba(203, 172, 249, 0.15)',
            border: '2px solid #CBACF9',
            borderRadius: '8px',
            padding: '8px 20px',
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#CBACF9',
            fontWeight: 'bold',
          }}
        >
          PORTFOLIO 2026
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
