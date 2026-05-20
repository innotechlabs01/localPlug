interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const variantStyles = {
  primary:
    'bg-gold-gradient text-[var(--bg-dark)] shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5',
  secondary:
    'bg-[var(--glass)] text-white border border-[var(--border-light)] backdrop-blur-md hover:bg-white/10 hover:border-[var(--accent-gold)] hover:-translate-y-0.5',
  ghost:
    'border border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-white/5 hover:text-white hover:-translate-y-0.5',
}

const liftStyles =
  'active:translate-y-0'

const sizeStyles = {
  sm: 'px-4 py-2 text-label-sm',
  md: 'px-6 py-3 text-label-md',
  lg: 'px-8 py-4 text-label-md',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2.5 rounded-[var(--radius-md)] font-semibold text-[15px] transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/50 focus:ring-offset-2 focus:ring-offset-[var(--bg-dark)] disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${liftStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
