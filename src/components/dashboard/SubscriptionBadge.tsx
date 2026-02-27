import React from 'react'

interface SubscriptionBadgeProps {
  cost: number
  renewalDate?: string
}

export function SubscriptionBadge({ cost, renewalDate }: SubscriptionBadgeProps) {
  let daysUntilRenewal: number | null = null
  if (renewalDate) {
    const diff = new Date(renewalDate).getTime() - Date.now()
    daysUntilRenewal = Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const isUrgent = daysUntilRenewal !== null && daysUntilRenewal <= 3

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        border: `1px solid ${isUrgent ? 'var(--accent-red)' : 'var(--accent-amber)'}`,
        background: isUrgent ? 'rgba(255, 34, 0, 0.1)' : 'rgba(255, 170, 0, 0.08)',
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        letterSpacing: 1,
        textTransform: 'uppercase'
      }}
    >
      <span style={{
        color: 'var(--accent-amber)',
        textShadow: 'var(--crt-glow-amber)'
      }}>
        ${cost}/MES
      </span>
      {daysUntilRenewal !== null && (
        <span style={{
          color: isUrgent ? 'var(--accent-red)' : 'var(--text-muted)',
          textShadow: isUrgent ? 'var(--crt-glow-red)' : undefined
        }}>
          {daysUntilRenewal > 0 ? `${daysUntilRenewal}D` : 'VENCIDO'}
        </span>
      )}
    </div>
  )
}
