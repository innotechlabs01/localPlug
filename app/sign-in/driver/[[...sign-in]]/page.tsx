'use client'
import { SignIn } from '@clerk/nextjs'

export default function DriverSignInPage() {
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
        background: 'linear-gradient(135deg, #0c0c14 0%, #101815 50%, #0c0c14 100%)',
      }}
        className="sign-in-branding"
      >
        <div style={{
          position: 'absolute', top: '15%', right: '25%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', left: '20%',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,222,128,0.04) 0%, transparent 70%)',
          filter: 'blur(80px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px', margin: '0 auto 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #4ade80, #16a34a)',
            boxShadow: '0 8px 32px rgba(74,222,128,0.25)',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0c0c14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
              <path d="M15 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.684-.949V8a1 1 0 0 1 1-1h1.382a1 1 0 0 1 .894.553l1.448 2.894A1 1 0 0 0 18.118 11H22v6a1 1 0 0 1-1 1h-1" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="19" cy="18" r="2" />
            </svg>
          </div>

          <h1 style={{
            fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)', margin: '0 0 12px',
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            Driver Portal
          </h1>
          <p style={{
            fontSize: '15px', color: 'var(--text-muted)', maxWidth: '280px',
            lineHeight: 1.6, margin: '0 auto',
          }}>
            Gestiona tus asignaciones, rutas y ganancias en tiempo real.
          </p>

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px',
            justifyContent: 'center', marginTop: '40px',
          }}>
            {['Asignaciones', 'Rutas', 'Ganancias', 'Perfil'].map(f => (
              <span key={f} style={{
                padding: '6px 14px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 500,
                background: 'rgba(74,222,128,0.08)', color: '#4ade80',
                border: '1px solid rgba(74,222,128,0.12)',
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
            background: 'linear-gradient(135deg, #4ade80, #16a34a)',
            boxShadow: '0 6px 24px rgba(74,222,128,0.2)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0c0c14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
              <path d="M15 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.684-.949V8a1 1 0 0 1 1-1h1.382a1 1 0 0 1 .894.553l1.448 2.894A1 1 0 0 0 18.118 11H22v6a1 1 0 0 1-1 1h-1" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="19" cy="18" r="2" />
            </svg>
          </div>
          <h1 style={{
            fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)', margin: 0,
          }}>
            Driver Portal
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
              Inicia sesion para ver tus asignaciones
            </p>
          </div>

          <SignIn
            routing="path"
            path="/sign-in/driver"
            forceRedirectUrl="/driver"
            appearance={{
              variables: {
                colorPrimary: '#4ade80',
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
                  background: 'linear-gradient(135deg, #4ade80, #16a34a)',
                  color: '#0c0c14',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '12px 0',
                  boxShadow: '0 4px 16px rgba(74,222,128,0.25)',
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    boxShadow: '0 6px 24px rgba(74,222,128,0.35)',
                    transform: 'translateY(-1px)',
                  },
                },
                footerActionLink: {
                  color: '#4ade80',
                  fontSize: '13px',
                  fontWeight: 500,
                },
                dividerLine: { background: 'var(--border)' },
                dividerText: { color: 'var(--text-muted)', fontSize: '12px' },
                socialButtonsBlockButton: {
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    background: 'var(--surface)',
                    borderColor: '#4ade80',
                  },
                },
                socialButtonsBlockButtonText: { color: 'var(--text-primary)', fontWeight: 500 },
                formFieldInputShowPasswordButton: { color: 'var(--text-muted)' },
                identityPreviewEditButton: { color: '#4ade80' },
                footer: { padding: 0, marginTop: '24px' },
                footerAction: { padding: 0 },
              },
            }}
          />

          <div style={{
            marginTop: '40px', textAlign: 'center',
            paddingTop: '20px', borderTop: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Powered by <span style={{ color: '#4ade80', fontWeight: 600 }}>LocalPlug</span>
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
