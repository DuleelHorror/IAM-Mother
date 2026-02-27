import React, { useMemo } from 'react'
import { useServiceStore } from '../../stores/serviceStore'

interface SubscriptionRow {
  id: string
  name: string
  color: string
  monthlyCost: number
  renewalDate?: string
  provider: string
}

export function SubscriptionPanel() {
  const services = useServiceStore((s) => s.services)

  const subscriptions = useMemo<SubscriptionRow[]>(() => {
    return services
      .filter(s => s.enabled && s.subscriptionCost && s.subscriptionCost > 0)
      .map(s => ({
        id: s.id,
        name: s.name,
        color: s.color,
        monthlyCost: s.subscriptionCost!,
        renewalDate: s.subscriptionRenewalDate,
        provider: s.provider
      }))
  }, [services])

  const totalMonthly = subscriptions.reduce((s, sub) => s + sub.monthlyCost, 0)
  const totalAnnual = totalMonthly * 12
  const maxCost = Math.max(1, ...subscriptions.map(s => s.monthlyCost))

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
          COSTES DE SUSCRIPCION
        </div>
        <div style={{
          fontSize: 9,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: 1,
          marginTop: 4
        }}>
          WEYLAND-DUKE CORP // MODULO FINANCIERO
        </div>
      </div>

      {/* Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
            TOTAL MENSUAL
          </div>
          <div style={{
            fontSize: 28,
            color: 'var(--accent-green)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            textShadow: 'var(--crt-glow)'
          }}>
            ${totalMonthly}
          </div>
          <div style={{
            fontSize: 8,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: 1
          }}>
            USD / MES
          </div>
        </div>

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
            ESTIMACION ANUAL
          </div>
          <div style={{
            fontSize: 28,
            color: 'var(--accent-amber)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            textShadow: 'var(--crt-glow-amber)'
          }}>
            ${totalAnnual}
          </div>
          <div style={{
            fontSize: 8,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: 1
          }}>
            USD / ANO
          </div>
        </div>
      </div>

      {/* Subscription table */}
      <div style={{
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)'
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 80px 100px 90px',
          padding: '8px 14px',
          borderBottom: '1px solid var(--border-color)',
          fontSize: 8,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: 2,
          textTransform: 'uppercase'
        }}>
          <span>SERVICIO</span>
          <span>PROVEEDOR</span>
          <span style={{ textAlign: 'right' }}>COSTE/MES</span>
          <span style={{ textAlign: 'right' }}>RENOVACION</span>
        </div>

        {/* Rows */}
        {subscriptions.length === 0 ? (
          <div style={{
            padding: '20px 14px',
            textAlign: 'center',
            fontSize: 10,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: 1
          }}>
            NO HAY SUSCRIPCIONES CONFIGURADAS
          </div>
        ) : (
          subscriptions.map((sub, i) => (
            <div
              key={sub.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 100px 90px',
                padding: '10px 14px',
                borderBottom: i < subscriptions.length - 1 ? '1px solid var(--border-color)' : 'none',
                alignItems: 'center',
                fontSize: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 6, height: 6,
                  background: sub.color,
                  boxShadow: `0 0 6px ${sub.color}60`,
                  flexShrink: 0
                }} />
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  textShadow: 'var(--crt-glow)'
                }}>
                  {sub.name}
                </span>
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                fontSize: 9,
                letterSpacing: 1,
                textTransform: 'uppercase'
              }}>
                {sub.provider}
              </span>
              <span style={{
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-green)',
                fontWeight: 600,
                textShadow: 'var(--crt-glow)'
              }}>
                ${sub.monthlyCost}/mes
              </span>
              <span style={{
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                color: sub.renewalDate ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontSize: 9
              }}>
                {sub.renewalDate || '---'}
              </span>
            </div>
          ))
        )}

        {/* Total row */}
        {subscriptions.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 100px 90px',
            padding: '10px 14px',
            borderTop: '2px solid var(--accent-amber)',
            background: 'rgba(255, 170, 0, 0.05)',
            alignItems: 'center',
            fontSize: 10
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-amber)',
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontWeight: 700,
              textShadow: 'var(--crt-glow-amber)'
            }}>
              TOTAL
            </span>
            <span />
            <span style={{
              textAlign: 'right',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-amber)',
              fontWeight: 700,
              fontSize: 12,
              textShadow: 'var(--crt-glow-amber)'
            }}>
              ${totalMonthly}/mes
            </span>
            <span />
          </div>
        )}
      </div>

      {/* Visual cost comparison bars */}
      {subscriptions.length > 0 && (
        <div style={{
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          padding: 14
        }}>
          <div style={{
            fontSize: 9,
            color: 'var(--accent-amber)',
            letterSpacing: 2,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            marginBottom: 12,
            textShadow: 'var(--crt-glow-amber)'
          }}>
            DISTRIBUCION DE COSTES
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {subscriptions.map(sub => {
              const pct = (sub.monthlyCost / maxCost) * 100
              const totalPct = totalMonthly > 0 ? (sub.monthlyCost / totalMonthly) * 100 : 0
              return (
                <div key={sub.id}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 3
                  }}>
                    <span style={{
                      fontSize: 9,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      letterSpacing: 0.5,
                      textTransform: 'uppercase'
                    }}>
                      {sub.name}
                    </span>
                    <span style={{
                      fontSize: 9,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)'
                    }}>
                      {totalPct.toFixed(0)}% // ${sub.monthlyCost}
                    </span>
                  </div>
                  <div style={{
                    height: 10,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${sub.color}88, ${sub.color})`,
                      boxShadow: `0 0 6px ${sub.color}40`,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              )
            })}
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
        <span>CONFIGURAR COSTES EN SERVICIOS IA</span>
      </div>
    </div>
  )
}
