import { SignIn } from '@clerk/nextjs'

export default function AdminSignInPage() {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--admin-bg)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              marginBottom: '16px',
              background: 'var(--admin-accent)',
              color: 'var(--admin-bg)',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '4px',
              color: 'var(--admin-fg)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Admin Panel
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--admin-fg-secondary)' }}>
            Plataforma de administracion
          </p>
        </div>

          <SignIn
            routing="path"
            path="/sign-in/admin"
            forceRedirectUrl="/admin"
            appearance={{
              variables: {
                colorPrimary: 'var(--admin-accent)',
                colorBackground: 'transparent',
                colorText: 'var(--admin-fg)',
                colorInputText: 'var(--admin-fg)',
                colorInputBackground: 'var(--admin-bg-secondary)',
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
                  color: 'var(--admin-fg)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  fontWeight: 600,
                },
                headerSubtitle: {
                  color: 'var(--admin-fg-secondary)',
                  fontSize: '13px',
                },
                formFieldLabel: {
                  color: 'var(--admin-fg-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                },
                formFieldInput: {
                  background: 'var(--admin-bg-secondary)',
                  border: '1px solid var(--admin-border)',
                  color: 'var(--admin-fg)',
                  fontSize: '14px',
                  padding: '12px 14px',
                  transition: 'border-color 200ms cubic-bezier(0.4,0,0.2,1)',
                },
                formButtonPrimary: {
                  background: 'var(--admin-accent)',
                  color: '#000',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '12px 0',
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    opacity: 0.9,
                    transform: 'translateY(-1px)',
                  },
                },
                footerActionLink: {
                  color: 'var(--admin-accent)',
                  fontSize: '13px',
                  fontWeight: 500,
                },
                dividerLine: { background: 'var(--admin-border)' },
                dividerText: { color: 'var(--admin-fg-muted)', fontSize: '12px' },
                socialButtonsBlockButton: {
                  border: '1px solid var(--admin-border)',
                  background: 'var(--admin-bg-secondary)',
                  color: 'var(--admin-fg)',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    background: 'var(--admin-bg)',
                    borderColor: 'var(--admin-accent)',
                  },
                },
                socialButtonsBlockButtonText: { color: 'var(--admin-fg)', fontWeight: 500 },
                formFieldInputShowPasswordButton: { color: 'var(--admin-fg-secondary)' },
                identityPreviewEditButton: { color: 'var(--admin-accent)' },
                footer: { padding: 0, marginTop: '24px' },
                footerAction: { padding: 0 },
              },
            }}
        />

        <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '24px', color: 'var(--admin-fg-muted)' }}>
          Powered by LocalPlug
        </p>
      </div>
    </div>
  )
}
