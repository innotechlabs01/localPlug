import React from 'react'

// ── Card ──
export const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
}

// ── Table ──
export const tableHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textAlign: 'left',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
}

export const tableCellStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '13px',
  color: 'var(--text-secondary)',
  borderBottom: '1px solid var(--border)',
  fontVariantNumeric: 'tabular-nums',
}

// ── Page header ──
export const pageHeading: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-display)',
  margin: 0,
}

export const pageSubtext: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text-muted)',
  marginTop: '4px',
}

// ── Section title (inside cards) ──
export const sectionTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--accent-gold)',
  fontFamily: 'var(--font-display)',
  marginBottom: '16px',
}

// ── Form inputs ──
export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '13px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 200ms cubic-bezier(0.4,0,0.2,1)',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  marginBottom: '6px',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

// ── Badges ──
export const badge = (bg: string, fg: string): React.CSSProperties => ({
  padding: '3px 10px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '11px',
  fontWeight: 600,
  background: bg,
  color: fg,
})

// ── Primary button ──
export const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  background: 'var(--accent-gold)',
  color: 'var(--bg-dark)',
  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
}

// ── Ghost / outline button ──
export const btnGhost: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-secondary)',
  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
}

// ── Status badge map ──
export const ROOM_STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  available: { bg: 'rgba(74,222,128,0.12)', fg: '#4ade80', label: 'Disponible' },
  occupied: { bg: 'rgba(250,204,21,0.12)', fg: '#facc15', label: 'Ocupada' },
  maintenance: { bg: 'rgba(248,113,113,0.12)', fg: '#f87171', label: 'Mantenimiento' },
}

export const ORDER_STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  new: { bg: 'rgba(250,204,21,0.12)', fg: '#facc15', label: 'Nueva' },
  accepted: { bg: 'rgba(74,222,128,0.12)', fg: '#4ade80', label: 'Aceptada' },
  checked_in: { bg: 'rgba(96,165,250,0.12)', fg: '#60a5fa', label: 'Check-in' },
  completed: { bg: 'rgba(74,222,128,0.12)', fg: '#4ade80', label: 'Completada' },
  cancelled: { bg: 'rgba(248,113,113,0.12)', fg: '#f87171', label: 'Cancelada' },
}
