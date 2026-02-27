import React, { useState, useEffect, useMemo } from 'react'
import { useServiceStore } from '../../stores/serviceStore'
import { useTrackingStore } from '../../stores/trackingStore'
import { useLayoutStore } from '../../stores/layoutStore'
import { ContextWindowBar } from '../dashboard/ContextWindowBar'

const ASCII_LOGO = `
 ██╗ █████╗ ███╗   ███╗    ███╗   ███╗ ██████╗ ████████╗██╗  ██╗███████╗██████╗
 ██║██╔══██╗████╗ ████║    ████╗ ████║██╔═══██╗╚══██╔══╝██║  ██║██╔════╝██╔══██╗
 ██║███████║██╔████╔██║    ██╔████╔██║██║   ██║   ██║   ███████║█████╗  ██████╔╝
 ██║██╔══██║██║╚██╔╝██║    ██║╚██╔╝██║██║   ██║   ██║   ██╔══██║██╔══╝  ██╔══██╗
 ██║██║  ██║██║ ╚═╝ ██║    ██║ ╚═╝ ██║╚██████╔╝   ██║   ██║  ██║███████╗██║  ██║
 ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝    ╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`

export function WelcomePanel() {
  const services = useServiceStore((s) => s.services)
  const globalCwd = useServiceStore((s) => s.globalCwd)
  const usage = useTrackingStore((s) => s.usage)
  const totalCostUsd = useTrackingStore((s) => s.totalCostUsd)
  const model = useLayoutStore((s) => s.model)
  const [now, setNow] = useState(Date.now())

  // Refresh clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Detect which services have open panels in flexlayout
  const activePanelServiceIds = useMemo(() => {
    const ids = new Set<string>()
    try {
      const json = model.toJson()
      const walk = (node: any) => {
        if (node.config?.serviceId) {
          ids.add(node.config.serviceId)
        }
        if (node.children) {
          node.children.forEach(walk)
        }
      }
      walk(json.layout)
    } catch { /* ignore */ }
    return ids
  }, [model, now]) // now forces periodic recalculation

  const enabledServices = services.filter(s => s.enabled)

  // Aggregate totals
  const totalInputTokens = Object.values(usage).reduce((s, u) => s + (u.inputTokens || 0), 0)
  const totalOutputTokens = Object.values(usage).reduce((s, u) => s + (u.outputTokens || 0), 0)

  // Find max usage for bar scaling
  const maxTokens = Math.max(
    1,
    ...Object.values(usage).map(u => (u.inputTokens || 0) + (u.outputTokens || 0))
  )

  const formatTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary)',
      padding: 24,
      overflow: 'auto',
      gap: 16
    }}>
      {/* Header: Logo + Monitor title */}
      <div style={{ textAlign: 'center' }}>
        <pre style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          color: 'var(--accent-amber)',
          textShadow: 'var(--crt-glow-amber)',
          lineHeight: 1.2,
          margin: 0
        }}>
          {ASCII_LOGO}
        </pre>
        <div style={{
          marginTop: 8,
          fontSize: 11,
          fontFamily: 'var(--font-display)',
          color: 'var(--accent-green)',
          letterSpacing: 4,
          textTransform: 'uppercase',
          textShadow: 'var(--crt-glow)'
        }}>
          MONITOR DE SISTEMA
        </div>
        <div style={{
          fontSize: 9,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: 1,
          marginTop: 4
        }}>
          {new Date(now).toLocaleString('es-ES', {
            weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          }).toUpperCase()}
        </div>
      </div>

      {/* Grid: metrics + active services */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Global metrics */}
        <MetricBox label="TOKENS ENTRADA" value={formatTokens(totalInputTokens)} color="var(--accent-green)" />
        <MetricBox label="TOKENS SALIDA" value={formatTokens(totalOutputTokens)} color="var(--accent-amber)" />
        <MetricBox label="COSTE API ACUMULADO" value={`$${totalCostUsd.toFixed(4)}`} color="var(--accent-cyan)" />
        <MetricBox
          label="DIRECTORIO DE TRABAJO"
          value={globalCwd || 'NO CONFIGURADO'}
          color={globalCwd ? 'var(--accent-cyan)' : 'var(--text-muted)'}
          small
        />
      </div>

      {/* Active services status */}
      <div style={{
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        padding: 12
      }}>
        <div style={{
          fontSize: 9,
          color: 'var(--accent-amber)',
          letterSpacing: 2,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          marginBottom: 10,
          textShadow: 'var(--crt-glow-amber)'
        }}>
          ESTADO DE SERVICIOS IA
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {enabledServices.map((service) => {
            const isActive = activePanelServiceIds.has(service.id)
            const svcUsage = usage[service.id]
            const totalTk = (svcUsage?.inputTokens || 0) + (svcUsage?.outputTokens || 0)
            const barWidth = maxTokens > 0 ? (totalTk / maxTokens) * 100 : 0

            return (
              <div key={service.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 0'
              }}>
                {/* Status indicator */}
                <div style={{
                  width: 6, height: 6,
                  background: isActive ? service.color : 'var(--text-muted)',
                  boxShadow: isActive ? `0 0 8px ${service.color}` : 'none',
                  flexShrink: 0,
                  animation: isActive ? 'glow-pulse 2s ease-in-out infinite' : 'none'
                }} />

                {/* Name */}
                <span style={{
                  width: 100,
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  textShadow: isActive ? 'var(--crt-glow)' : 'none',
                  flexShrink: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {service.name}
                </span>

                {/* Status tag */}
                <span style={{
                  fontSize: 8,
                  fontFamily: 'var(--font-mono)',
                  color: isActive ? 'var(--accent-green)' : 'var(--text-muted)',
                  letterSpacing: 1,
                  width: 50,
                  flexShrink: 0
                }}>
                  [{isActive ? 'ACTIVO' : 'IDLE'}]
                </span>

                {/* Mini usage bar */}
                <div style={{
                  flex: 1,
                  height: 8,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${service.color}66, ${service.color})`,
                    boxShadow: barWidth > 0 ? `0 0 4px ${service.color}40` : 'none',
                    transition: 'width 0.5s ease'
                  }} />
                </div>

                {/* Token count */}
                <span style={{
                  fontSize: 8,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  width: 50,
                  textAlign: 'right',
                  flexShrink: 0
                }}>
                  {formatTokens(totalTk)}
                </span>

                {/* Cost */}
                <span style={{
                  fontSize: 8,
                  fontFamily: 'var(--font-mono)',
                  color: svcUsage?.costUsd ? 'var(--accent-amber)' : 'var(--text-muted)',
                  width: 50,
                  textAlign: 'right',
                  flexShrink: 0
                }}>
                  ${(svcUsage?.costUsd || 0).toFixed(3)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Context windows for active services */}
      {enabledServices
        .filter(s => activePanelServiceIds.has(s.id) && usage[s.id])
        .map(service => {
          const svcUsage = usage[service.id]
          if (!svcUsage) return null
          return (
            <div key={service.id}>
              <div style={{
                fontSize: 9,
                color: service.color,
                letterSpacing: 1,
                fontFamily: 'var(--font-mono)',
                marginBottom: 4,
                textTransform: 'uppercase',
                textShadow: `0 0 6px ${service.color}40`
              }}>
                {service.name} // VENTANA DE CONTEXTO
              </div>
              <ContextWindowBar
                used={svcUsage.contextWindowUsed || 0}
                max={svcUsage.contextWindowMax || 200000}
              />
            </div>
          )
        })
      }

      {/* Footer */}
      <div style={{
        borderTop: '1px solid var(--border-color)',
        paddingTop: 10,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 9,
        color: 'var(--text-muted)',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginTop: 'auto'
      }}>
        <span>DUKE EL HORROR INDUSTRIES // 2026</span>
        <span>IAM MOTHER v0.1.0 // MONITOR EN TIEMPO REAL</span>
      </div>
    </div>
  )
}

function MetricBox({ label, value, color, small }: {
  label: string
  value: string
  color: string
  small?: boolean
}) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }}>
      <div style={{
        fontSize: 8,
        color: 'var(--text-muted)',
        letterSpacing: 2,
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: small ? 10 : 18,
        color,
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        letterSpacing: 1,
        textShadow: `0 0 8px ${color === 'var(--text-muted)' ? 'transparent' : color}40`,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {value}
      </div>
    </div>
  )
}
