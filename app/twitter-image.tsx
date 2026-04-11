import { ImageResponse } from 'next/og'

// export const runtime = 'edge' // disabled to allow static generation and fix font manifest
export const alt = 'Gaurav Patil - Full Stack Developer'
export const size = { width: 1200, height: 675 }
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
            padding: '50px 70px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '25px',
            position: 'relative',
            boxShadow: '0 0 60px rgba(156, 127, 217, 0.4)',
          }}
        >
          {/* Terminal dots */}
          <div style={{ display: 'flex', position: 'absolute', top: '18px', left: '22px', gap: '9px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#FFBD2E' }} />
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#28CA42' }} />
          </div>

          {/* Terminal prompt */}
          <div
            style={{
              display: 'flex',
              fontSize: '68px',
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
              fontSize: '30px',
              fontFamily: 'sans-serif',
              color: '#ffffff',
              opacity: 0.9,
            }}
          >
            Full Stack Developer
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '35px',
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#CBACF9',
            opacity: 0.9,
            fontWeight: 'bold',
          }}
        >
          www.gauravpatil.online
        </div>
        
        {/* Available Badge */}
        <div
          style={{
            position: 'absolute',
            top: '25px',
            right: '35px',
            background: 'rgba(40, 202, 66, 0.2)',
            border: '2px solid #28CA42',
            borderRadius: '6px',
            padding: '6px 16px',
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#28CA42',
            fontWeight: 'bold',
          }}
        >
          AVAILABLE
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
