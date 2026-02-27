import React, { useState } from 'react'
import { useServiceStore } from '../../stores/serviceStore'
import { AIServiceConfig, AIProviderType, PanelType } from '../../types/ai-service'

interface AddServiceModalProps {
  onClose: () => void
}

export function AddServiceModal({ onClose }: AddServiceModalProps) {
  const addService = useServiceStore((s) => s.addService)

  const [name, setName] = useState('')
  const [provider, setProvider] = useState<AIProviderType>('openai')
  const [panelType, setPanelType] = useState<PanelType>('web')
  const [url, setUrl] = useState('')
  const [command, setCommand] = useState('')
  const [color, setColor] = useState('#33ff33')
  const [subscriptionCost, setSubscriptionCost] = useState('')
  const [apiKey, setApiKey] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const service: AIServiceConfig = {
      id,
      name,
      provider,
      panelType,
      url: panelType === 'web' ? url : undefined,
      command: panelType === 'terminal' ? command : undefined,
      sessionPartition: panelType === 'web' ? `persist:${id}` : undefined,
      color,
      subscriptionCost: subscriptionCost ? parseFloat(subscriptionCost) : undefined,
      enabled: true
    }

    await addService(service)

    if (apiKey) {
      await window.api.persistence.saveApiKey(id, apiKey)
    }

    onClose()
  }

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
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--accent-green)',
          padding: 24,
          width: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: 'var(--crt-glow), 0 16px 48px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header del modal */}
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
            AGREGAR SERVICIO IA
          </span>
        </div>

        <FieldLabel label="NOMBRE">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%' }}
            placeholder="EJ: CLAUDE PRO"
          />
        </FieldLabel>

        <div style={{ display: 'flex', gap: 12 }}>
          <FieldLabel label="PROVEEDOR" style={{ flex: 1 }}>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProviderType)}
              style={{ width: '100%' }}
            >
              <option value="openai">OPENAI</option>
              <option value="anthropic">ANTHROPIC</option>
              <option value="google">GOOGLE</option>
              <option value="manual">MANUAL</option>
            </select>
          </FieldLabel>

          <FieldLabel label="TIPO PANEL" style={{ flex: 1 }}>
            <select
              value={panelType}
              onChange={(e) => setPanelType(e.target.value as PanelType)}
              style={{ width: '100%' }}
            >
              <option value="web">WEB</option>
              <option value="terminal">TERMINAL</option>
            </select>
          </FieldLabel>
        </div>

        {panelType === 'web' && (
          <FieldLabel label="URL">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ width: '100%' }}
              placeholder="HTTPS://..."
            />
          </FieldLabel>
        )}

        {panelType === 'terminal' && (
          <FieldLabel label="COMANDO">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              style={{ width: '100%' }}
              placeholder="EJ: CLAUDE, CODEX"
            />
          </FieldLabel>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <FieldLabel label="COLOR" style={{ flex: 1 }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: '100%', height: 30, padding: 2 }}
            />
          </FieldLabel>
          <FieldLabel label="SUSCRIPCION $/MES" style={{ flex: 1 }}>
            <input
              type="number"
              value={subscriptionCost}
              onChange={(e) => setSubscriptionCost(e.target.value)}
              style={{ width: '100%' }}
              placeholder="0"
            />
          </FieldLabel>
        </div>

        <FieldLabel label="API KEY (OPCIONAL, ALMACENADA ENCRIPTADA)">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ width: '100%' }}
            placeholder="SK-..."
          />
        </FieldLabel>

        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 8,
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 16px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: 1
            }}
          >
            CANCELAR
          </button>
          <button
            type="submit"
            style={{
              padding: '7px 16px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--accent-green)',
              color: 'var(--accent-green)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: 1,
              boxShadow: 'var(--crt-glow)'
            }}
          >
            [+] AGREGAR
          </button>
        </div>
      </form>
    </div>
  )
}

function FieldLabel({
  label, children, style
}: {
  label: string; children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <label style={{
      fontSize: 9,
      color: 'var(--text-muted)',
      letterSpacing: 2,
      fontFamily: 'var(--font-mono)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      ...style
    }}>
      {label}
      {children}
    </label>
  )
}
