import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const size = { width: 180, height: 180 }
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
          borderRadius: '40px',
          border: '4px solid #9C7FD9',
          position: 'relative',
        }}
      >
        {/* Terminal dots */}
        <div style={{ display: 'flex', position: 'absolute', top: '20px', left: '20px', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFBD2E' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28CA42' }} />
        </div>
        
        {/* Terminal prompt */}
        <div
          style={{
            display: 'flex',
            fontSize: '56px',
            fontFamily: 'monospace',
            color: '#CBACF9',
            fontWeight: 'bold',
            marginTop: '10px',
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
