import { SignIn } from '@clerk/nextjs'

export default function AdminSignInPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'var(--admin-bg)' }}
    >
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'var(--admin-accent)', color: 'var(--admin-bg)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--admin-fg)', fontFamily: 'var(--font-display)' }}
          >
            Admin Panel
          </h1>
          <p className="text-sm" style={{ color: 'var(--admin-fg-secondary)' }}>
            Plataforma de administración
          </p>
        </div>

        <SignIn
          forceRedirectUrl="/admin"
          appearance={{
            variables: {
              colorPrimary: 'var(--admin-accent)',
              colorBackground: 'var(--admin-surface)',
              colorText: 'var(--admin-fg)',
              colorInputText: 'var(--admin-fg)',
              borderRadius: 'var(--radius-md)',
            },
            elements: {
              rootBox: 'w-full',
              card: 'bg-transparent border-0 shadow-none w-full',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-400',
              formFieldLabel: 'text-gray-400',
              formFieldInput: 'bg-[var(--admin-bg-secondary)] border-[var(--admin-border)] text-white',
              formButtonPrimary:
                'bg-[var(--admin-accent)] hover:bg-emerald-600 text-black font-semibold',
              footerActionLink: 'text-[var(--admin-accent)]',
              dividerLine: 'bg-[var(--admin-border)]',
              dividerText: 'text-gray-500',
              socialButtonsBlockButton: 'border-[var(--admin-border)] text-white',
              socialButtonsBlockButtonText: 'text-white',
              formFieldInputShowPasswordButton: 'text-gray-400',
              identityPreviewEditButton: 'text-[var(--admin-accent)]',
            },
          }}
        />

        <p className="text-center text-xs mt-6" style={{ color: 'var(--admin-fg-muted)' }}>
          Powered by LocalPlug
        </p>
      </div>
    </div>
  )
}
