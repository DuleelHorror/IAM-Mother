import React from 'react'
import { PanelToolbar } from '../layout/PanelToolbar'

interface TerminalToolbarProps {
  serviceId?: string
  connected: boolean
  shell?: string
}

function getShellLabel(shell?: string): string {
  if (!shell) return ''
  const s = shell.toLowerCase()
  if (s.includes('powershell') || s.includes('pwsh')) return 'POWERSHELL'
  if (s.includes('bash')) return 'BASH'
  if (s.includes('zsh')) return 'ZSH'
  if (s.includes('fish')) return 'FISH'
  if (s.includes('cmd')) return 'CMD'
  if (s.includes('wsl')) return 'WSL'
  return shell.toUpperCase()
}

export function TerminalToolbar({ serviceId, connected, shell }: TerminalToolbarProps) {
  const shellLabel = getShellLabel(shell)

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
      {shellLabel && (
        <span style={{
          fontSize: 9,
          color: 'var(--accent-cyan)',
          letterSpacing: 1
        }}>
          [{shellLabel}]
        </span>
      )}
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
