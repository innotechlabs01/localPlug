interface StepCardProps {
  order: number
  title: string
  description: string
  icon: React.ReactNode
}

const numberColors = [
  'from-[var(--accent-gold)] to-[var(--accent-gold-dark)] shadow-[0_8px_24px_rgba(212,165,116,0.35)]',
  'from-[var(--accent-orange)] to-[#c44d2a] shadow-[0_8px_24px_rgba(232,125,62,0.35)]',
  'from-[#6366f1] to-[#4f46e5] shadow-[0_8px_24px_rgba(99,102,241,0.35)]',
  'from-[#10b981] to-[#059669] shadow-[0_8px_24px_rgba(16,185,129,0.35)]',
]

export default function StepCard({ order, title, description }: StepCardProps) {
  return (
    <div className="relative z-[1] text-center">
      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${numberColors[order - 1]} flex items-center justify-center mx-auto mb-6 text-[var(--bg-dark)] text-2xl font-bold`}>
        {order}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2.5">{title}</h3>
      <p className="text-[15px] text-[var(--text-muted)] max-w-[240px] mx-auto">{description}</p>
    </div>
  )
}
