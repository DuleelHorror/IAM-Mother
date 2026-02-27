import React, { useEffect, useState } from 'react'
import { useLayoutStore } from '../../stores/layoutStore'

export function TitleBar() {
  const [maximized, setMaximized] = useState(false)
  const [time, setTime] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.app.isMaximized().then(setMaximized)
    const unsub = window.api.app.onMaximizeChange(setMaximized)

    // Reloj estilo Nostromo
    const tick = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('es-ES', { hour12: false }) +
        '.' +
        String(now.getMilliseconds()).padStart(3, '0').slice(0, 2)
      )
    }
    tick()
    const timer = setInterval(tick, 100)

    return () => {
      unsub()
      clearInterval(timer)
    }
  }, [])

  return (
    <div
      style={{
        height: 'var(--titlebar-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        WebkitAppRegion: 'drag' as any,
        userSelect: 'none',
        padding: '0 12px',
        flexShrink: 0
      }}
    >
      {/* Identificador del sistema */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}>
            WEYLAND-DUKE CORP
          </span>
          <span style={{
            width: 4, height: 4,
            background: 'var(--accent-green)',
            borderRadius: '50%',
            boxShadow: 'var(--crt-glow)',
            animation: 'glow-pulse 2s ease-in-out infinite'
          }} />
        </div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--accent-amber)',
          letterSpacing: 3,
          textShadow: 'var(--crt-glow-amber)'
        }}>
          IAM MOTHER
        </span>
        <span style={{
          fontSize: 9,
          color: 'var(--text-muted)',
          letterSpacing: 1,
          textTransform: 'uppercase',
          borderLeft: '1px solid var(--border-color)',
          paddingLeft: 8
        }}>
          INTERFACE 2.4.1 // CENTRO DE CONTROL IA
        </span>
      </div>

      {/* Centro: reloj + estado del sistema */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontSize: 11,
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: 1
      }}>
        <span>SYS::NOMINAL</span>
        <span style={{ color: 'var(--accent-amber)' }}>{time}</span>
      </div>

      {/* Controles de ventana */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          WebkitAppRegion: 'no-drag' as any
        }}
      >
        <TitleBarButton
          onClick={() => {
            try {
              const data = useLayoutStore.getState().getAllWorkspacesJson()
              window.api.persistence.saveLayout(data)
              setSaved(true)
              setTimeout(() => setSaved(false), 2000)
            } catch {}
          }}
          label="GUARDAR"
          accent
        >
          {saved ? '\u2713' : '\u2B07'}
        </TitleBarButton>
        <TitleBarButton
          onClick={() => window.location.reload()}
          label="REFRESCAR"
        >
          &#x21BB;
        </TitleBarButton>
        <div style={{ width: 8 }} />
        <TitleBarButton onClick={() => window.api.app.minimize()} label="MIN">
          &#x2500;
        </TitleBarButton>
        <TitleBarButton onClick={() => window.api.app.maximize()} label={maximized ? 'RST' : 'MAX'}>
          {maximized ? '\u29C9' : '\u25A1'}
        </TitleBarButton>
        <TitleBarButton
          onClick={() => window.api.app.close()}
          danger
          label="END"
        >
          &#x2715;
        </TitleBarButton>
      </div>
    </div>
  )
}

function TitleBarButton({
  children,
  onClick,
  danger,
  accent,
  label
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
  accent?: boolean
  label?: string
}) {
  const [hovered, setHovered] = useState(false)
  const hoverBg = danger ? 'rgba(255, 34, 0, 0.3)' : accent ? 'rgba(255, 170, 0, 0.15)' : 'var(--bg-hover)'
  const hoverColor = danger ? 'var(--accent-red)' : accent ? 'var(--accent-amber)' : 'var(--text-primary)'
  const glowStyle = danger ? 'var(--crt-glow-red)' : accent ? 'var(--crt-glow-amber)' : 'var(--crt-glow)'
  const borderColor = danger ? 'var(--accent-red)' : accent ? 'var(--accent-amber)' : 'var(--border-color)'

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={label}
      style={{
        width: 40,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        background: hovered ? hoverBg : 'transparent',
        color: hovered ? hoverColor : 'var(--text-muted)',
        border: hovered ? `1px solid ${borderColor}` : '1px solid transparent',
        transition: 'all 0.15s',
        textShadow: hovered ? glowStyle : 'none'
      }}
    >
      {children}
    </button>
  )
}
