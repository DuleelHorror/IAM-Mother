import React from 'react'
import { useSettingsStore } from '../../stores/settingsStore'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const autoSaveLayout = useSettingsStore((s) => s.autoSaveLayout)
  const setAutoSaveLayout = useSettingsStore((s) => s.setAutoSaveLayout)

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
          width: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          boxShadow: 'var(--crt-glow), 0 16px 48px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingBottom: 10,
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 4
        }}>
          <div style={{
            width: 6, height: 6,
            background: 'var(--accent-amber)',
            boxShadow: 'var(--crt-glow-amber)'
          }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--accent-amber)',
            letterSpacing: 2,
            textShadow: 'var(--crt-glow-amber)'
          }}>
            CONFIGURACION
          </span>
        </div>

        {/* Theme section */}
        <div>
          <div style={{
            fontSize: 9,
            color: 'var(--text-muted)',
            letterSpacing: 2,
            fontFamily: 'var(--font-mono)',
            marginBottom: 8
          }}>
            TEMA
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <ThemeOption
              label="NOSTROMO"
              previewBg="#050a05"
              previewFg="#33ff33"
              active={theme === 'dark'}
              onClick={() => setTheme('dark')}
            />
            <ThemeOption
              label="LIGHT"
              previewBg="#f5f5f5"
              previewFg="#1a1a1a"
              active={theme === 'light'}
              onClick={() => setTheme('light')}
            />
          </div>
        </div>

        {/* Auto-save layout toggle */}
        <div>
          <div style={{
            fontSize: 9,
            color: 'var(--text-muted)',
            letterSpacing: 2,
            fontFamily: 'var(--font-mono)',
            marginBottom: 8
          }}>
            GUARDAR LAYOUT AUTOMATICO
          </div>
          <button
            onClick={() => setAutoSaveLayout(!autoSaveLayout)}
            style={{
              padding: '8px 16px',
              background: autoSaveLayout ? 'var(--bg-active)' : 'var(--bg-primary)',
              border: autoSaveLayout ? '1px solid var(--accent-green)' : '1px solid var(--border-color)',
              color: autoSaveLayout ? 'var(--accent-green)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: 1,
              cursor: 'pointer',
              textShadow: autoSaveLayout ? 'var(--crt-glow)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            {autoSaveLayout ? '[ON] ACTIVADO' : '[OFF] DESACTIVADO'}
          </button>
        </div>

        {/* Close button */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 4
        }}>
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

function ThemeOption({
  label,
  previewBg,
  previewFg,
  active,
  onClick
}: {
  label: string
  previewBg: string
  previewFg: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 8px',
        background: active ? 'var(--bg-active)' : 'var(--bg-primary)',
        border: active ? '1px solid var(--accent-green)' : '1px solid var(--border-color)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.15s'
      }}
    >
      {/* Preview swatch */}
      <div style={{
        width: 40,
        height: 28,
        background: previewBg,
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <span style={{
          color: previewFg,
          fontSize: 8,
          fontFamily: 'var(--font-mono)',
          letterSpacing: 1
        }}>
          Aa
        </span>
      </div>
      {/* Label */}
      <span style={{
        fontSize: 9,
        fontFamily: 'var(--font-mono)',
        letterSpacing: 1,
        color: active ? 'var(--accent-green)' : 'var(--text-muted)'
      }}>
        {label}
      </span>
    </button>
  )
}
