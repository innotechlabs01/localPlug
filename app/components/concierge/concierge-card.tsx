interface ConciergeCardProps {
  title: string
  description: string
  icon: React.ReactNode
}

export default function ConciergeCard({ title, description, icon }: ConciergeCardProps) {
  return (
    <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 transition-all duration-300 hover:bg-[var(--bg-elevated)] hover:border-[var(--accent-gold)] hover:-translate-y-1 cursor-pointer">
      <div className="w-14 h-14 rounded-[var(--radius-md)] bg-[rgba(212,165,116,0.15)] flex items-center justify-center mb-5 text-[var(--accent-gold)] text-2xl">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2.5">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{description}</p>
    </article>
  )
}
