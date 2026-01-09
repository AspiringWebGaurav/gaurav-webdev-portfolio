"use client";

/**
 * Next.js Global Error Handler (Root Level)
 * Catches errors that escape the regular error boundary
 * Must be in app directory root
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ 
        margin: 0, 
        padding: 0, 
        background: '#1a1a2e',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: '2rem',
          maxWidth: '600px'
        }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '1rem' 
          }}>
            ⚠️
          </div>
          <h1 style={{ 
            fontSize: '2rem', 
            marginBottom: '1rem',
            background: 'linear-gradient(to right, #f87171, #fb923c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Something Went Wrong
          </h1>
          <p style={{ 
            color: '#9ca3af', 
            marginBottom: '2rem' 
          }}>
            {error.message || 'An unexpected error occurred'}
          </p>
          
          <div style={{
            padding: '1rem 1.5rem',
            background: 'rgba(147, 51, 234, 0.2)',
            border: '1px solid rgba(147, 51, 234, 0.3)',
            borderRadius: '12px',
            marginBottom: '2rem',
            display: 'inline-block'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem' 
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '3px solid #a78bfa',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <div>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '4px',
                  color: '#c4b5fd'
                }}>
                  📤 Sending to Gaurav...
                </div>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: '#ddd6fe' 
                }}>
                  Crash report with screenshot
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500',
              marginRight: '0.75rem'
            }}
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Go Home
          </button>
        </div>
        
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </body>
    </html>
  );
}
