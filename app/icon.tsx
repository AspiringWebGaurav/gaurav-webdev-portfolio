import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#13162D',
          borderRadius: '4px',
          border: '2px solid #9C7FD9',
          position: 'relative',
        }}
      >
        {/* Terminal dots */}
        <div style={{ display: 'flex', position: 'absolute', top: '4px', left: '4px', gap: '2px' }}>
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#FFBD2E' }} />
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#28CA42' }} />
        </div>
        
        {/* Terminal prompt */}
        <div
          style={{
            display: 'flex',
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#CBACF9',
            fontWeight: 'bold',
            marginTop: '4px',
          }}
        >
          &gt;g
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
