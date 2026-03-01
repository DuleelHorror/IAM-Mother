import React from 'react'
import { useTrackingStore } from '../../stores/trackingStore'
import { useServiceStore } from '../../stores/serviceStore'

export function StatusBar() {
  const totalCost = useTrackingStore((s) => s.totalCostUsd)
  const usage = useTrackingStore((s) => s.usage)
  const services = useServiceStore((s) => s.services)

  const activeCount = Object.keys(usage).length
  const totalSubscriptionCost = services.reduce(
    (sum, s) => sum + (s.subscriptionCost || 0),
    0
  )

  // Check for context window alerts
  const alertServices = Object.entries(usage).filter(([_, data]) => {
    if (data.contextWindowMax <= 0) return false
    return (data.contextWindowUsed / data.contextWindowMax) > 0.8
  })
  const hasAlert = alertServices.length > 0
  const isCritical = alertServices.some(([_, data]) =>
    (data.contextWindowUsed / data.contextWindowMax) > 0.95
  )

  return (
    <div
      style={{
        height: 'var(--statusbar-height)',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        fontSize: 9,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        flexShrink: 0
      }}
    >
      <div style={{ display: 'flex', gap: 20 }}>
        <StatusItem label="SERVICIOS" value={String(services.filter((s) => s.enabled).length)} />
        <StatusItem label="TRACKING" value={String(activeCount)} />
        {hasAlert ? (
          <span style={{ animation: 'glow-pulse 1.5s ease-in-out infinite' }}>
            <StatusItem
              label="CONTEXTO"
              value="ALERTA"
              color={isCritical ? 'var(--accent-red)' : 'var(--accent-amber)'}
            />
          </span>
        ) : (
          <StatusItem label="ESTADO" value="NOMINAL" color="var(--accent-green)" />
        )}
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <StatusItem label="COSTE API" value={`$${totalCost.toFixed(2)}`} color="var(--accent-amber)" />
        <StatusItem label="SUSCRIPCIONES" value={`$${totalSubscriptionCost.toFixed(0)}/MES`} color="var(--accent-orange)" />
        <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>
          DUKE EL HORROR // IAM MOTHER v0.1
        </span>
      </div>
    </div>
  )
}

function StatusItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span>
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>{' '}
      <span style={{
        color: color || 'var(--text-secondary)',
        textShadow: color ? `0 0 6px ${color}40` : undefined
      }}>
        {value}
      </span>
    </span>
  )
}
