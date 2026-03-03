import React from 'react'
import { PanelToolbar } from '../layout/PanelToolbar'

interface TerminalToolbarProps {
  serviceId?: string
  connected: boolean
  shell?: string
  cwd?: string
  onChangeCwd?: () => void
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

function truncatePath(p: string, max: number = 30): string {
  if (!p) return ''
  if (p.length <= max) return p
  const parts = p.replace(/\\/g, '/').split('/')
  if (parts.length >= 2) {
    const last = parts[parts.length - 1]
    const drive = parts[0]
    const truncated = `${drive}/.../${last}`
    if (truncated.length <= max) return truncated
    return `.../${last}`
  }
  return '...' + p.slice(p.length - max + 3)
}

export function TerminalToolbar({ serviceId, connected, shell, cwd, onChangeCwd }: TerminalToolbarProps) {
  const shellLabel = getShellLabel(shell)
  const [cwdHovered, setCwdHovered] = React.useState(false)

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

      {/* Folder picker button */}
      <button
        onClick={onChangeCwd}
        onMouseEnter={() => setCwdHovered(true)}
        onMouseLeave={() => setCwdHovered(false)}
        title={cwd || 'Seleccionar carpeta de trabajo'}
        style={{
          padding: '2px 6px',
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          background: cwdHovered ? 'var(--bg-hover)' : 'transparent',
          color: cwdHovered ? 'var(--accent-cyan)' : 'var(--text-muted)',
          border: `1px solid ${cwdHovered ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
          cursor: 'pointer',
          letterSpacing: 0.5,
          transition: 'all 0.15s',
          maxWidth: 220,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textShadow: cwdHovered ? '0 0 6px rgba(0, 255, 204, 0.4)' : 'none'
        }}
      >
        {cwd ? truncatePath(cwd) : 'CARPETA...'}
      </button>

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
