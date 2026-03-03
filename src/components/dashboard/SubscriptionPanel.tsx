import React, { useMemo } from 'react'
import { useServiceStore } from '../../stores/serviceStore'
import { useLayoutStore } from '../../stores/layoutStore'
import { useTrackingStore } from '../../stores/trackingStore'

interface ActivePanel {
  name: string
  component: string
  serviceId?: string
}

export function SubscriptionPanel() {
  const services = useServiceStore((s) => s.services)
  const model = useLayoutStore((s) => s.model)
  const usage = useTrackingStore((s) => s.usage)

  // Walk layout model to find all open panels
  const openPanels = useMemo<ActivePanel[]>(() => {
    const panels: ActivePanel[] = []
    try {
      const json = model.toJson()
      const walk = (node: any) => {
        if (node.component) {
          panels.push({
            name: node.name || node.component,
            component: node.component,
            serviceId: node.config?.serviceId
          })
        }
        if (node.children) {
          node.children.forEach(walk)
        }
      }
      walk(json.layout)
    } catch { /* ignore */ }
    return panels
  }, [model])

  // Set of active service IDs (services with at least one open panel)
  const activeServiceIds = useMemo(() => {
    return new Set(openPanels.filter(p => p.serviceId).map(p => p.serviceId!))
  }, [openPanels])

  // Classify panels
  const terminalPanels = openPanels.filter(p => p.component === 'terminal')
  const webPanels = openPanels.filter(p => p.component === 'web')

  // Split services into active and inactive
  const enabledServices = services.filter(s => s.enabled)
  const activeServices = enabledServices.filter(s => activeServiceIds.has(s.id))
  const inactiveServices = enabledServices.filter(s => !activeServiceIds.has(s.id))

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
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: 12
      }}>
        <div style={{
          fontSize: 14,
          fontFamily: 'var(--font-display)',
          color: 'var(--accent-amber)',
          letterSpacing: 3,
          textTransform: 'uppercase',
          textShadow: 'var(--crt-glow-amber)'
        }}>
          ACTIVIDAD EN TIEMPO REAL
        </div>
        <div style={{
          fontSize: 9,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: 1,
          marginTop: 4
        }}>
          WEYLAND-DUKE CORP // MONITOR DE ACTIVIDAD
        </div>
      </div>

      {/* Summary counters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <SummaryBox
          label="IAS ACTIVAS"
          value={activeServices.length}
          total={enabledServices.length}
          color="var(--accent-green)"
          glow="var(--crt-glow)"
        />
        <SummaryBox
          label="CONSOLAS"
          value={terminalPanels.length}
          color="var(--accent-cyan)"
          glow="0 0 8px rgba(0, 255, 204, 0.4)"
        />
        <SummaryBox
          label="PANELES WEB"
          value={webPanels.length}
          color="var(--accent-amber)"
          glow="var(--crt-glow-amber)"
        />
      </div>

      {/* Section: IAs ACTIVAS */}
      <div style={{
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--border-color)',
          fontSize: 9,
          color: 'var(--accent-green)',
          letterSpacing: 2,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          textShadow: 'var(--crt-glow)'
        }}>
          IAS ACTIVAS
        </div>

        {activeServices.length === 0 && inactiveServices.length === 0 ? (
          <div style={{
            padding: '20px 14px',
            textAlign: 'center',
            fontSize: 10,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: 1
          }}>
            NO HAY SERVICIOS CONFIGURADOS
          </div>
        ) : (
          <>
            {/* Active services */}
            {activeServices.map((service, i) => {
              const serviceUsage = usage[service.id]
              const tokens = serviceUsage
                ? serviceUsage.inputTokens + serviceUsage.outputTokens
                : 0
              const cost = serviceUsage?.costUsd ?? 0
              return (
                <div
                  key={service.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '14px 1fr 50px 70px 60px',
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border-color)',
                    alignItems: 'center',
                    fontSize: 10,
                    gap: 8
                  }}
                >
                  {/* Pulsing indicator */}
                  <div style={{
                    width: 8,
                    height: 8,
                    background: service.color,
                    boxShadow: `0 0 8px ${service.color}80`,
                    animation: 'glow-pulse 2s ease-in-out infinite'
                  }} />
                  {/* Name */}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    textShadow: 'var(--crt-glow)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {service.name}
                  </span>
                  {/* Type */}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    color: service.panelType === 'terminal' ? 'var(--accent-cyan)' : 'var(--accent-amber)',
                    fontSize: 8,
                    letterSpacing: 1,
                    textTransform: 'uppercase'
                  }}>
                    {service.panelType === 'terminal' ? 'CLI' : 'WEB'}
                  </span>
                  {/* Tokens */}
                  <span style={{
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    fontSize: 9
                  }}>
                    {tokens > 0 ? formatTokens(tokens) : '---'}
                  </span>
                  {/* Cost */}
                  <span style={{
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono)',
                    color: cost > 0 ? 'var(--accent-green)' : 'var(--text-muted)',
                    fontWeight: cost > 0 ? 600 : 400,
                    textShadow: cost > 0 ? 'var(--crt-glow)' : undefined
                  }}>
                    {cost > 0 ? `$${cost.toFixed(2)}` : '---'}
                  </span>
                </div>
              )
            })}

            {/* Inactive services (dimmed) */}
            {inactiveServices.map((service) => (
              <div
                key={service.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '14px 1fr 50px 70px 60px',
                  padding: '8px 14px',
                  borderBottom: '1px solid var(--border-color)',
                  alignItems: 'center',
                  fontSize: 10,
                  gap: 8,
                  opacity: 0.35
                }}
              >
                <div style={{
                  width: 8,
                  height: 8,
                  background: service.color,
                  opacity: 0.4
                }} />
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {service.name}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  fontSize: 8,
                  letterSpacing: 1
                }}>
                  {service.panelType === 'terminal' ? 'CLI' : 'WEB'}
                </span>
                <span style={{
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  fontSize: 9
                }}>
                  ---
                </span>
                <span style={{
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  fontSize: 9
                }}>
                  IDLE
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Section: CONSOLAS ACTIVAS */}
      {terminalPanels.length > 0 && (
        <div style={{
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{
            padding: '8px 14px',
            borderBottom: '1px solid var(--border-color)',
            fontSize: 9,
            color: 'var(--accent-cyan)',
            letterSpacing: 2,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            textShadow: '0 0 8px rgba(0, 255, 204, 0.4)'
          }}>
            CONSOLAS ACTIVAS
          </div>

          {terminalPanels.map((panel, i) => {
            const service = panel.serviceId
              ? services.find(s => s.id === panel.serviceId)
              : undefined
            return (
              <div
                key={`term-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 14px',
                  borderBottom: i < terminalPanels.length - 1 ? '1px solid var(--border-color)' : 'none',
                  fontSize: 10
                }}
              >
                <div style={{
                  width: 6,
                  height: 6,
                  background: service?.color ?? 'var(--accent-cyan)',
                  boxShadow: `0 0 6px ${service?.color ?? 'rgba(0, 255, 204, 0.5)'}80`,
                  animation: 'glow-pulse 2s ease-in-out infinite',
                  flexShrink: 0
                }} />
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  textShadow: 'var(--crt-glow)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {panel.name}
                </span>
                {service && (
                  <span style={{
                    fontSize: 8,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    letterSpacing: 1,
                    textTransform: 'uppercase'
                  }}>
                    {service.name}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Section: PANELES WEB */}
      {webPanels.length > 0 && (
        <div style={{
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{
            padding: '8px 14px',
            borderBottom: '1px solid var(--border-color)',
            fontSize: 9,
            color: 'var(--accent-amber)',
            letterSpacing: 2,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            textShadow: 'var(--crt-glow-amber)'
          }}>
            PANELES WEB
          </div>

          {webPanels.map((panel, i) => {
            const service = panel.serviceId
              ? services.find(s => s.id === panel.serviceId)
              : undefined
            return (
              <div
                key={`web-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 14px',
                  borderBottom: i < webPanels.length - 1 ? '1px solid var(--border-color)' : 'none',
                  fontSize: 10
                }}
              >
                <div style={{
                  width: 6,
                  height: 6,
                  background: service?.color ?? 'var(--accent-amber)',
                  boxShadow: `0 0 6px ${service?.color ?? 'rgba(255, 170, 0, 0.5)'}80`,
                  animation: 'glow-pulse 2s ease-in-out infinite',
                  flexShrink: 0
                }} />
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  textShadow: 'var(--crt-glow)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {panel.name}
                </span>
                {service && (
                  <span style={{
                    fontSize: 8,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    letterSpacing: 1,
                    textTransform: 'uppercase'
                  }}>
                    {service.name}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state when no panels are open */}
      {openPanels.length === 0 && (
        <div style={{
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          padding: '30px 14px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: 1,
            marginBottom: 6
          }}>
            NO HAY PANELES ABIERTOS
          </div>
          <div style={{
            fontSize: 9,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: 0.5,
            opacity: 0.6
          }}>
            ABRE UN SERVICIO DESDE EL SIDEBAR PARA COMENZAR
          </div>
        </div>
      )}

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
        <span>{openPanels.length} PANEL{openPanels.length !== 1 ? 'ES' : ''} ACTIVO{openPanels.length !== 1 ? 'S' : ''}</span>
      </div>
    </div>
  )
}

function SummaryBox({ label, value, total, color, glow }: {
  label: string
  value: number
  total?: number
  color: string
  glow: string
}) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      padding: 14,
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
        fontSize: 28,
        color,
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        textShadow: glow
      }}>
        {value}
        {total != null && (
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontWeight: 400
          }}>
            /{total}
          </span>
        )}
      </div>
    </div>
  )
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
