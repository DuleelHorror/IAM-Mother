import React from 'react'

interface ShortcutsModalProps {
  onClose: () => void
}

const SHORTCUTS = [
  { keys: 'Ctrl + T', action: 'NUEVO TERMINAL' },
  { keys: 'Ctrl + N', action: 'NUEVO PANEL WEB' },
  { keys: 'Ctrl + W', action: 'CERRAR PESTANA' },
  { keys: 'Ctrl + B', action: 'TOGGLE SIDEBAR' },
  { keys: 'Ctrl + /', action: 'MOSTRAR ATAJOS' },
  { keys: 'Shift + Enter', action: 'NUEVA LINEA EN TERMINAL' },
  { keys: 'Ctrl + C', action: 'COPIAR SELECCION / SIGINT' },
  { keys: 'Ctrl + V', action: 'PEGAR EN TERMINAL' },
  { keys: 'F12', action: 'TOGGLE DEVTOOLS' },
]

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--accent-green)',
          padding: 24,
          width: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: 'var(--crt-glow), 0 16px 48px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingBottom: 10,
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{
            width: 6, height: 6,
            background: 'var(--accent-green)',
            boxShadow: 'var(--crt-glow)'
          }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--accent-green)',
            letterSpacing: 2,
            textShadow: 'var(--crt-glow)'
          }}>
            ATAJOS DE TECLADO
          </span>
        </div>

        {/* Shortcuts table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SHORTCUTS.map((s) => (
            <div key={s.keys} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <span style={{
                fontSize: 10,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: 0.5
              }}>
                {s.action}
              </span>
              <kbd style={{
                fontSize: 10,
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: 1,
                padding: '2px 8px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)'
              }}>
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>

        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: 1,
              cursor: 'pointer'
            }}
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  )
}
