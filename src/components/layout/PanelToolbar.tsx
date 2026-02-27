import React from 'react'

interface PanelToolbarProps {
  children: React.ReactNode
}

export function PanelToolbar({ children }: PanelToolbarProps) {
  return (
    <div
      style={{
        height: 'var(--toolbar-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 6,
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5
      }}
    >
      {children}
    </div>
  )
}

export function ToolbarButton({
  children,
  onClick,
  title,
  active,
  danger
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
  active?: boolean
  danger?: boolean
}) {
  const [hovered, setHovered] = React.useState(false)
  const activeColor = danger ? 'var(--accent-red)' : 'var(--accent-green)'

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '3px 8px',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        background: active ? 'var(--bg-active)' : hovered ? 'var(--bg-hover)' : 'transparent',
        color: active || hovered ? activeColor : 'var(--text-muted)',
        border: `1px solid ${active || hovered ? activeColor : 'transparent'}`,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        transition: 'all 0.15s',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textShadow: (active || hovered) ? (danger ? 'var(--crt-glow-red)' : 'var(--crt-glow)') : 'none'
      }}
    >
      {children}
    </button>
  )
}
