import React from 'react'
import { PanelToolbar } from '../layout/PanelToolbar'

interface TerminalToolbarProps {
  serviceId?: string
  connected: boolean
}

export function TerminalToolbar({ serviceId, connected }: TerminalToolbarProps) {
  return (
    <PanelToolbar>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: connected ? 'var(--accent-green)' : 'var(--accent-red)',
          boxShadow: connected ? 'var(--crt-glow)' : 'var(--crt-glow-red)',
          animation: connected ? 'glow-pulse 2s ease-in-out infinite' : undefined,
          flexShrink: 0
        }}
      />
      <span style={{ fontSize: 10, color: 'var(--text-amber)', letterSpacing: 1 }}>
        TERM://{serviceId || 'LOCAL'}
      </span>
      <div style={{ flex: 1 }} />
      <span style={{
        fontSize: 9,
        color: connected ? 'var(--accent-green)' : 'var(--accent-red)',
        textShadow: connected ? 'var(--crt-glow)' : 'var(--crt-glow-red)',
        letterSpacing: 1
      }}>
        {connected ? '[ENLACE ACTIVO]' : '[DESCONECTADO]'}
      </span>
    </PanelToolbar>
  )
}
