import DriverAuthForm from './DriverAuthForm'

export default function DriverSignInPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Left panel — branding */}
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
        {/* Decorative glow */}
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

        {/* Logo */}
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

          {/* Feature pills */}
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

      {/* Right panel — sign in / sign up form */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '40px 24px', position: 'relative',
      }}>
        {/* Mobile logo */}
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
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)', margin: '0 0 8px',
            }}>
              Bienvenido
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
              Inicia sesion o crea tu cuenta de conductor
            </p>
          </div>

          {/* Auth form (sign-in / sign-up toggle) */}
          <DriverAuthForm />

          {/* Footer */}
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

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 768px) {
          .sign-in-branding { display: flex !important; }
          .sign-in-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  )
}
