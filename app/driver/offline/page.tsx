'use client'

export default function DriverOfflinePage() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
      gap: '16px',
    }}>
      <div style={{ fontSize: 40 }}>📡</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary, #fff)', margin: 0 }}>
        Sin conexión a internet
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted, #9ca3af)', maxWidth: 340, margin: 0 }}>
        Verifica tu señal móvil o Wi‑Fi e intenta nuevamente para ver tus asignaciones y ganancias actualizadas.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '10px 20px',
          borderRadius: 10,
          border: '1px solid var(--border, #2e2e32)',
          background: 'var(--ui-accent, #22c55e)',
          color: '#000',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Reintentar
      </button>
    </div>
  )
}
