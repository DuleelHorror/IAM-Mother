import React from 'react'
import { useTrackingStore } from '../../stores/trackingStore'
import { useServiceStore } from '../../stores/serviceStore'
import { TokenGauge } from './TokenGauge'
import { CostTracker } from './CostTracker'
import { ContextWindowBar } from './ContextWindowBar'
import { SubscriptionBadge } from './SubscriptionBadge'
import { UsageTrendChart } from './UsageTrendChart'

interface AIDashboardProps {
  serviceId?: string
}

export function AIDashboard({ serviceId }: AIDashboardProps) {
  const usage = useTrackingStore((s) => (serviceId ? s.usage[serviceId] : null))
  const service = useServiceStore((s) =>
    serviceId ? s.getService(serviceId) : undefined
  )

  if (!serviceId || !service) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted)',
          gap: 8,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: 1
        }}
      >
        <div style={{ fontSize: 14, color: 'var(--accent-amber)' }}>
          SIN SERVICIO SELECCIONADO
        </div>
        <div style={{ fontSize: 11 }}>
          Abra un dashboard desde el panel lateral
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 16,
        gap: 12,
        overflow: 'auto',
        background: 'var(--bg-primary)'
      }}
    >
      {/* Header del servicio */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{
          width: 10, height: 10,
          background: service.color,
          boxShadow: `0 0 8px ${service.color}60`
        }} />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--accent-amber)',
          letterSpacing: 2,
          textShadow: 'var(--crt-glow-amber)'
        }}>
          {service.name.toUpperCase()}
        </span>
        <span style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: 1,
          textTransform: 'uppercase'
        }}>
          [{service.provider}]
        </span>
        <div style={{ flex: 1 }} />
        {service.subscriptionCost && (
          <SubscriptionBadge
            cost={service.subscriptionCost}
            renewalDate={service.subscriptionRenewalDate}
          />
        )}
      </div>

      {/* Gauges de tokens */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <TokenGauge
          label="TOKENS ENTRADA"
          value={usage?.inputTokens || 0}
          color="var(--accent-green)"
        />
        <TokenGauge
          label="TOKENS SALIDA"
          value={usage?.outputTokens || 0}
          color="var(--accent-amber)"
        />
      </div>

      <CostTracker
        costUsd={usage?.costUsd || 0}
        subscriptionCost={service.subscriptionCost}
      />

      <ContextWindowBar
        used={usage?.contextWindowUsed || 0}
        max={usage?.contextWindowMax || 200000}
      />

      {/* Usage trend chart */}
      {usage?.dailyHistory && usage.dailyHistory.length > 0 && (
        <UsageTrendChart
          dailyHistory={usage.dailyHistory}
          color={service.color}
        />
      )}

      <div style={{
        fontSize: 9,
        color: 'var(--text-muted)',
        textAlign: 'right',
        letterSpacing: 1,
        textTransform: 'uppercase'
      }}>
        Ultima actualizacion:{' '}
        {usage?.lastUpdated
          ? new Date(usage.lastUpdated).toLocaleTimeString('es-ES')
          : 'NUNCA'}
      </div>
    </div>
  )
}
