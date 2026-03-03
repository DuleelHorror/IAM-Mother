import React, { useState, useEffect } from 'react'
import { PanelToolbar, ToolbarButton } from '../layout/PanelToolbar'

interface WebToolbarProps {
  url: string
  title: string
  serviceId?: string
  onNavigate: (url: string) => void
  onBack: () => void
  onForward: () => void
  onReload: () => void
  onOpenExternal?: () => void
  onImportSession?: () => void
  importing?: boolean
}

export function WebToolbar({
  url,
  title,
  serviceId,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onOpenExternal,
  onImportSession,
  importing
}: WebToolbarProps) {
  const [inputUrl, setInputUrl] = useState(url)

  useEffect(() => {
    setInputUrl(url)
  }, [url])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNavigate(inputUrl)
  }

  return (
    <PanelToolbar>
      <ToolbarButton onClick={onBack} title="Atras">
        &#x25C0;
      </ToolbarButton>
      <ToolbarButton onClick={onForward} title="Adelante">
        &#x25B6;
      </ToolbarButton>
      <ToolbarButton onClick={onReload} title="Recargar">
        &#x21BB;
      </ToolbarButton>

      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex' }}>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          style={{
            flex: 1,
            height: 24,
            fontSize: 10,
            padding: '0 8px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            color: 'var(--accent-green)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: 0.5
          }}
          placeholder="INTRODUCIR URL..."
        />
      </form>

      {/* Login en navegador externo */}
      {onOpenExternal && (
        <ToolbarButton onClick={onOpenExternal} title="Abrir en tu navegador para iniciar sesion con tus credenciales guardadas">
          LOGIN
        </ToolbarButton>
      )}

      {/* Importar sesion del navegador */}
      {onImportSession && (
        <ToolbarButton onClick={onImportSession} title="Importar cookies de sesion desde Chrome/Edge">
          {importing ? 'IMPORTANDO...' : 'IMPORTAR'}
        </ToolbarButton>
      )}

      {serviceId && (
        <span style={{
          fontSize: 9,
          color: 'var(--text-amber)',
          maxWidth: 100,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: 1,
          textShadow: 'var(--crt-glow-amber)'
        }}>
          {serviceId}
        </span>
      )}
    </PanelToolbar>
  )
}
