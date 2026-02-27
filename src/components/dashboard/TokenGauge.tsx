import React from 'react'

interface TokenGaugeProps {
  label: string
  value: number
  color: string
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function TokenGauge({ label, value, color }: TokenGaugeProps) {
  // Simular barras de nivel estilo CRT
  const maxBars = 20
  const filled = Math.min(Math.ceil((value / 1_000_000) * maxBars), maxBars)

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        padding: 14,
        border: '1px solid var(--border-color)',
        position: 'relative'
      }}
    >
      {/* Corner decorations */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 6, height: 6,
        borderTop: `1px solid ${color}`,
        borderLeft: `1px solid ${color}`
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 6, height: 6,
        borderTop: `1px solid ${color}`,
        borderRight: `1px solid ${color}`
      }} />

      <div style={{
        fontSize: 9,
        color: 'var(--text-muted)',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 2,
        fontFamily: 'var(--font-mono)'
      }}>
        {label}
      </div>

      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: 'var(--font-display)',
        textShadow: `0 0 12px ${color}60`,
        letterSpacing: 2
      }}>
        {formatTokens(value)}
      </div>

      {/* Barra de nivel CRT */}
      <div style={{
        display: 'flex',
        gap: 2,
        marginTop: 8,
        height: 6
      }}>
        {Array.from({ length: maxBars }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '100%',
              background: i < filled ? color : 'var(--bg-tertiary)',
              opacity: i < filled ? (0.4 + (i / maxBars) * 0.6) : 0.3,
              boxShadow: i < filled ? `0 0 4px ${color}40` : undefined
            }}
          />
        ))}
      </div>

      <div style={{
        fontSize: 10,
        color: 'var(--text-muted)',
        marginTop: 6,
        fontFamily: 'var(--font-mono)',
        letterSpacing: 1
      }}>
        {value.toLocaleString('es-ES')} TOKENS
      </div>
    </div>
  )
}
