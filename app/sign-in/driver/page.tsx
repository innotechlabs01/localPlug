import { SignIn } from '@clerk/nextjs'

export default function DriverSignInPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'var(--bg-dark)' }}
    >
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'var(--admin-accent)', color: 'var(--bg-dark)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            Driver Portal
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Gestiona tus asignaciones y ganancias
          </p>
        </div>

        <SignIn
          forceRedirectUrl="/driver"
          appearance={{
            variables: {
              colorPrimary: 'var(--admin-accent)',
              colorBackground: 'var(--bg-elevated)',
              colorText: 'var(--text-primary)',
              colorInputText: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
            },
            elements: {
              rootBox: 'w-full',
              card: 'bg-transparent border-0 shadow-none w-full',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-400',
              formFieldLabel: 'text-gray-400',
              formFieldInput: 'bg-[var(--surface)] border-[var(--border)] text-white',
              formButtonPrimary:
                'bg-[var(--admin-accent)] hover:bg-emerald-600 text-black font-semibold',
              footerActionLink: 'text-[var(--admin-accent)]',
              dividerLine: 'bg-[var(--border)]',
              dividerText: 'text-gray-500',
              socialButtonsBlockButton: 'border-[var(--border)] text-white',
              socialButtonsBlockButtonText: 'text-white',
              formFieldInputShowPasswordButton: 'text-gray-400',
              identityPreviewEditButton: 'text-[var(--admin-accent)]',
            },
          }}
        />

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Powered by LocalPlug
        </p>
      </div>
    </div>
  )
}
