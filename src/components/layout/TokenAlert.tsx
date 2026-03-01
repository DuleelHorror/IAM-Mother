import React, { useState, useEffect } from 'react'

interface TokenAlertProps {
  serviceId: string
  serviceName: string
  percentage: number
  onDismiss: () => void
}

export function TokenAlert({ serviceId, serviceName, percentage, onDismiss }: TokenAlertProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDismiss()
    }, 10000)
    return () => clearTimeout(timer)
  }, [serviceId])

  if (!visible) return null

  const isRed = percentage > 95
  const alertColor = isRed ? 'var(--accent-red)' : 'var(--accent-amber)'
  const glowColor = isRed
    ? '0 0 12px rgba(255, 34, 0, 0.3)'
    : '0 0 12px rgba(255, 170, 0, 0.3)'

  return (
    <div style={{
      position: 'fixed',
      bottom: 36,
      right: 16,
      zIndex: 999,
      background: 'var(--bg-secondary)',
      border: `1px solid ${alertColor}`,
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: `${glowColor}, 0 4px 16px rgba(0, 0, 0, 0.6)`,
      fontFamily: 'var(--font-mono)',
      animation: 'glow-pulse 2s ease-in-out infinite',
      maxWidth: 340
    }}>
      <div style={{
        width: 8, height: 8,
        background: alertColor,
        boxShadow: glowColor,
        flexShrink: 0
      }} />
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 9, color: alertColor, letterSpacing: 2,
          textShadow: glowColor
        }}>
          {isRed ? 'CONTEXTO CRITICO' : 'CONTEXTO ALTO'}
        </div>
        <div style={{
          fontSize: 10, color: 'var(--text-secondary)', letterSpacing: 0.5, marginTop: 2
        }}>
          {serviceName}: {percentage.toFixed(0)}% USADO
        </div>
      </div>
      <button onClick={() => { setVisible(false); onDismiss() }}
        style={{
          background: 'transparent', border: 'none',
          color: 'var(--text-muted)', fontSize: 14,
          cursor: 'pointer', fontFamily: 'var(--font-mono)',
          padding: '0 4px', lineHeight: 1
        }}>
        X
      </button>
    </div>
  )
}
