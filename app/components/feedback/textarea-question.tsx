'use client';

interface TextareaQuestionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export default function TextareaQuestion({ value, onChange, placeholder }: TextareaQuestionProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20 resize-none transition-all duration-200"
    />
  );
}
