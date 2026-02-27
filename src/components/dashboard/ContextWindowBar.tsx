import React from 'react'

interface ContextWindowBarProps {
  used: number
  max: number
}

export function ContextWindowBar({ used, max }: ContextWindowBarProps) {
  const percentage = max > 0 ? Math.min((used / max) * 100, 100) : 0
  const color =
    percentage > 90
      ? 'var(--accent-red)'
      : percentage > 70
        ? 'var(--accent-orange)'
        : 'var(--accent-green)'

  const statusText =
    percentage > 90 ? 'CRITICO' :
    percentage > 70 ? 'ALERTA' :
    percentage > 30 ? 'NOMINAL' : 'MINIMO'

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        padding: 14,
        border: '1px solid var(--border-color)'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 8
      }}>
        <span style={{
          fontSize: 9,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 2,
          fontFamily: 'var(--font-mono)'
        }}>
          VENTANA DE CONTEXTO
        </span>
        <span style={{
          fontSize: 10,
          color,
          fontFamily: 'var(--font-mono)',
          letterSpacing: 1,
          textShadow: `0 0 6px ${color === 'var(--accent-red)' ? 'rgba(255,34,0,0.5)' : 'transparent'}`
        }}>
          [{statusText}] {(used / 1000).toFixed(0)}K / {(max / 1000).toFixed(0)}K
        </span>
      </div>

      {/* Barra principal */}
      <div style={{
        height: 12,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 8px ${color}60`,
          transition: 'width 0.5s ease'
        }} />
        {/* Marcadores de grid */}
        {[25, 50, 75].map((mark) => (
          <div key={mark} style={{
            position: 'absolute',
            left: `${mark}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'var(--border-color)'
          }} />
        ))}
      </div>

      <div style={{
        fontSize: 9,
        color: 'var(--text-muted)',
        marginTop: 4,
        textAlign: 'right',
        letterSpacing: 1,
        fontFamily: 'var(--font-mono)'
      }}>
        {percentage.toFixed(1)}% UTILIZADO
      </div>
    </div>
  )
}
