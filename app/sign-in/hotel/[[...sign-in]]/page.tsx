'use client'
import { SignIn } from '@clerk/nextjs'

export default function HotelSignInPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <div style={{
        display: 'none',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0c0c14 0%, #1a1520 50%, #0c0c14 100%)',
      }}
        className="sign-in-branding"
      >
        <div style={{
          position: 'absolute', top: '20%', left: '30%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,165,116,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '20%',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,165,116,0.05) 0%, transparent 70%)',
          filter: 'blur(80px)', pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative', zIndex: 1, textAlign: 'center',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px', margin: '0 auto 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))',
            boxShadow: '0 8px 32px rgba(212,165,116,0.25)',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0c0c14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M3 7v14" />
              <path d="M21 7v14" />
              <path d="M7 3v4" />
              <path d="M12 3v4" />
              <path d="M17 3v4" />
              <rect x="5" y="7" width="4" height="4" />
              <rect x="10" y="7" width="4" height="4" />
              <rect x="15" y="7" width="4" height="4" />
              <rect x="5" y="13" width="4" height="4" />
              <rect x="10" y="13" width="4" height="4" />
              <rect x="15" y="13" width="4" height="4" />
            </svg>
          </div>

          <h1 style={{
            fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)', margin: '0 0 12px',
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            Hotel Portal
          </h1>
          <p style={{
            fontSize: '15px', color: 'var(--text-muted)', maxWidth: '280px',
            lineHeight: 1.6, margin: '0 auto',
          }}>
            Gestiona tus reservaciones, habitaciones y servicios desde un solo lugar.
          </p>

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px',
            justifyContent: 'center', marginTop: '40px',
          }}>
            {['Reservaciones', 'Habitaciones', 'Servicios', 'Configuracion'].map(f => (
              <span key={f} style={{
                padding: '6px 14px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 500,
                background: 'rgba(212,165,116,0.08)', color: 'var(--accent-gold)',
                border: '1px solid rgba(212,165,116,0.12)',
              }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '40px 24px', position: 'relative',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginBottom: '32px',
        }}
          className="sign-in-mobile-logo"
        >
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))',
            boxShadow: '0 6px 24px rgba(212,165,116,0.2)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0c0c14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M3 7v14" />
              <path d="M21 7v14" />
              <path d="M7 3v4" />
              <path d="M12 3v4" />
              <path d="M17 3v4" />
              <rect x="5" y="7" width="4" height="4" />
              <rect x="10" y="7" width="4" height="4" />
              <rect x="15" y="7" width="4" height="4" />
              <rect x="5" y="13" width="4" height="4" />
              <rect x="10" y="13" width="4" height="4" />
              <rect x="15" y="13" width="4" height="4" />
            </svg>
          </div>
          <h1 style={{
            fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)', margin: 0,
          }}>
            Hotel Portal
          </h1>
        </div>

        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)', margin: '0 0 8px',
            }}>
              Bienvenido de vuelta
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
              Inicia sesion para acceder a tu panel
            </p>
          </div>

          <SignIn
            routing="path"
            path="/sign-in/hotel"
            forceRedirectUrl="/hotel"
            appearance={{
              variables: {
                colorPrimary: 'var(--accent-gold)',
                colorBackground: 'transparent',
                colorText: 'var(--text-primary)',
                colorInputText: 'var(--text-primary)',
                colorInputBackground: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)',
              },
              elements: {
                rootBox: { width: '100%' },
                card: {
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  width: '100%',
                  padding: 0,
                },
                headerTitle: {
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  fontWeight: 600,
                },
                headerSubtitle: {
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                },
                formFieldLabel: {
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                },
                formFieldInput: {
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  padding: '12px 14px',
                  transition: 'border-color 200ms cubic-bezier(0.4,0,0.2,1)',
                },
                formButtonPrimary: {
                  background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))',
                  color: '#0c0c14',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '12px 0',
                  boxShadow: '0 4px 16px rgba(212,165,116,0.25)',
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    boxShadow: '0 6px 24px rgba(212,165,116,0.35)',
                    transform: 'translateY(-1px)',
                  },
                },
                footerActionLink: {
                  color: 'var(--accent-gold)',
                  fontSize: '13px',
                  fontWeight: 500,
                },
                dividerLine: {
                  background: 'var(--border)',
                },
                dividerText: {
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                },
                socialButtonsBlockButton: {
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    background: 'var(--surface)',
                    borderColor: 'var(--accent-gold)',
                  },
                },
                socialButtonsBlockButtonText: {
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                },
                formFieldInputShowPasswordButton: {
                  color: 'var(--text-muted)',
                },
                identityPreviewEditButton: {
                  color: 'var(--accent-gold)',
                },
                footer: {
                  padding: 0,
                  marginTop: '24px',
                },
                footerAction: {
                  padding: 0,
                },
              },
            }}
          />

          <div style={{
            marginTop: '40px', textAlign: 'center',
            paddingTop: '20px', borderTop: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Powered by <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>LocalPlug</span>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sign-in-branding { display: flex !important; }
          .sign-in-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  )
}
