import React from 'react'

interface CostTrackerProps {
  costUsd: number
  subscriptionCost?: number
}

export function CostTracker({ costUsd, subscriptionCost }: CostTrackerProps) {
  const totalMonthly = costUsd + (subscriptionCost || 0)

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        padding: 14,
        border: '1px solid var(--border-color)'
      }}
    >
      <div style={{
        fontSize: 9,
        color: 'var(--text-muted)',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 2,
        fontFamily: 'var(--font-mono)'
      }}>
        COSTES DEL PERIODO
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <CostColumn
          label="USO API"
          value={costUsd}
          color="var(--accent-green)"
        />
        {subscriptionCost != null && subscriptionCost > 0 && (
          <CostColumn
            label="SUSCRIPCION"
            value={subscriptionCost}
            color="var(--accent-orange)"
            integer
          />
        )}
        <CostColumn
          label="TOTAL MENSUAL"
          value={totalMonthly}
          color="var(--accent-amber)"
        />
      </div>
    </div>
  )
}

function CostColumn({
  label, value, color, integer
}: {
  label: string; value: number; color: string; integer?: boolean
}) {
  return (
    <div>
      <div style={{
        fontSize: 9,
        color: 'var(--text-muted)',
        marginBottom: 4,
        letterSpacing: 1,
        fontFamily: 'var(--font-mono)'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 22,
        fontWeight: 700,
        color,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: 'var(--font-display)',
        textShadow: `0 0 10px ${color}50`,
        letterSpacing: 1
      }}>
        ${integer ? value.toFixed(0) : value.toFixed(2)}
      </div>
    </div>
  )
}
