import { SignIn } from '@clerk/nextjs'

export default function HotelSignInPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'var(--bg-dark)' }}
    >
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'var(--accent-gold)', color: 'var(--bg-dark)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            Hotel Portal
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Gestiona tu hotel y reservaciones
          </p>
        </div>

        <SignIn
          forceRedirectUrl="/hotel"
          appearance={{
            variables: {
              colorPrimary: 'var(--accent-gold)',
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
                'bg-[var(--accent-gold)] hover:bg-[var(--accent-gold-dark)] text-black font-semibold',
              footerActionLink: 'text-[var(--accent-gold)]',
              dividerLine: 'bg-[var(--border)]',
              dividerText: 'text-gray-500',
              socialButtonsBlockButton: 'border-[var(--border)] text-white',
              socialButtonsBlockButtonText: 'text-white',
              formFieldInputShowPasswordButton: 'text-gray-400',
              identityPreviewEditButton: 'text-[var(--accent-gold)]',
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
