import React, { useState, useEffect } from 'react'
import { useServiceStore } from '../../stores/serviceStore'
import { AIServiceConfig } from '../../types/ai-service'

interface EditServiceModalProps {
  service: AIServiceConfig
  onClose: () => void
}

export function EditServiceModal({ service, onClose }: EditServiceModalProps) {
  const updateService = useServiceStore((s) => s.updateService)

  const [name, setName] = useState(service.name)
  const [url, setUrl] = useState(service.url || '')
  const [command, setCommand] = useState(service.command || '')
  const [shell, setShell] = useState(service.shell || '')
  const [color, setColor] = useState(service.color)
  const [subscriptionCost, setSubscriptionCost] = useState(
    service.subscriptionCost != null ? String(service.subscriptionCost) : ''
  )
  const [subscriptionRenewalDate, setSubscriptionRenewalDate] = useState(
    service.subscriptionRenewalDate || ''
  )
  const [enabled, setEnabled] = useState(service.enabled)
  const [cwd, setCwd] = useState(service.cwd || '')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [newApiKey, setNewApiKey] = useState('')

  useEffect(() => {
    window.api.persistence.getApiKey(service.id).then((key: string | null) => {
      setHasApiKey(!!key)
    })
  }, [service.id])

  const handleSelectCwd = async () => {
    const result = await window.api.dialog.selectDirectory()
    if (result) setCwd(result)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const updates: Partial<AIServiceConfig> = {
      name,
      color,
      enabled,
      cwd: cwd || undefined,
      subscriptionCost: subscriptionCost ? parseFloat(subscriptionCost) : undefined,
      subscriptionRenewalDate: subscriptionRenewalDate || undefined
    }

    if (service.panelType === 'web') {
      updates.url = url
    } else if (service.panelType === 'terminal') {
      updates.command = command
      updates.shell = shell || undefined
    }

    await updateService(service.id, updates)

    if (newApiKey) {
      await window.api.persistence.saveApiKey(service.id, newApiKey)
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
          border: '1px solid var(--accent-amber)',
          padding: 24,
          width: 420,
          maxHeight: '80vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 0 12px rgba(255, 170, 0, 0.15), 0 16px 48px rgba(0, 0, 0, 0.7)'
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
            background: service.color,
            boxShadow: `0 0 8px ${service.color}60`
          }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--accent-amber)',
            letterSpacing: 2,
            textShadow: 'var(--crt-glow-amber)'
          }}>
            EDITAR SERVICIO
          </span>
        </div>

        {/* Read-only fields */}
        <div style={{ display: 'flex', gap: 12 }}>
          <FieldLabel label="ID" style={{ flex: 1 }}>
            <input type="text" value={service.id} readOnly
              style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }} />
          </FieldLabel>
          <FieldLabel label="PROVEEDOR" style={{ flex: 1 }}>
            <input type="text" value={service.provider.toUpperCase()} readOnly
              style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }} />
          </FieldLabel>
        </div>

        <FieldLabel label="NOMBRE">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            required style={{ width: '100%' }} />
        </FieldLabel>

        {service.panelType === 'web' && (
          <FieldLabel label="URL">
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              style={{ width: '100%' }} placeholder="HTTPS://..." />
          </FieldLabel>
        )}

        {service.panelType === 'terminal' && (
          <>
            <FieldLabel label="COMANDO">
              <input type="text" value={command} onChange={(e) => setCommand(e.target.value)}
                style={{ width: '100%' }} placeholder="EJ: CLAUDE, CODEX" />
            </FieldLabel>
            <FieldLabel label="SHELL (OPCIONAL)">
              <input type="text" value={shell} onChange={(e) => setShell(e.target.value)}
                style={{ width: '100%' }} placeholder="EJ: POWERSHELL, BASH, WSL" />
            </FieldLabel>
          </>
        )}

        {/* CWD picker */}
        <FieldLabel label="CARPETA DE TRABAJO (CWD)">
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="text" value={cwd} readOnly
              style={{ flex: 1, cursor: 'pointer', color: cwd ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
              placeholder="GLOBAL POR DEFECTO"
              onClick={handleSelectCwd} />
            <button type="button" onClick={handleSelectCwd}
              style={{
                padding: '4px 8px', background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer'
              }}>
              ...
            </button>
            {cwd && (
              <button type="button" onClick={() => setCwd('')}
                style={{
                  padding: '4px 8px', background: 'var(--bg-primary)',
                  border: '1px solid var(--accent-red)', color: 'var(--accent-red)',
                  fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer'
                }}>
                X
              </button>
            )}
          </div>
        </FieldLabel>

        <div style={{ display: 'flex', gap: 12 }}>
          <FieldLabel label="COLOR" style={{ flex: 1 }}>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              style={{ width: '100%', height: 30, padding: 2 }} />
          </FieldLabel>
          <FieldLabel label="SUSCRIPCION $/MES" style={{ flex: 1 }}>
            <input type="number" value={subscriptionCost}
              onChange={(e) => setSubscriptionCost(e.target.value)}
              style={{ width: '100%' }} placeholder="0" />
          </FieldLabel>
        </div>

        <FieldLabel label="FECHA RENOVACION">
          <input type="date" value={subscriptionRenewalDate}
            onChange={(e) => setSubscriptionRenewalDate(e.target.value)}
            style={{ width: '100%' }} />
        </FieldLabel>

        {/* Enabled toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2,
            fontFamily: 'var(--font-mono)'
          }}>ESTADO:</span>
          <button type="button" onClick={() => setEnabled(!enabled)}
            style={{
              padding: '4px 12px',
              background: enabled ? 'var(--bg-active)' : 'var(--bg-primary)',
              border: enabled ? '1px solid var(--accent-green)' : '1px solid var(--accent-red)',
              color: enabled ? 'var(--accent-green)' : 'var(--accent-red)',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, cursor: 'pointer'
            }}>
            {enabled ? '[ON] ACTIVO' : '[OFF] INACTIVO'}
          </button>
        </div>

        {/* API Key */}
        <FieldLabel label={`API KEY ${hasApiKey ? '(YA CONFIGURADA)' : '(NO CONFIGURADA)'}`}>
          <input type="password" value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
            style={{ width: '100%' }}
            placeholder={hasApiKey ? 'DEJAR VACIO PARA NO CAMBIAR' : 'SK-...'} />
        </FieldLabel>

        {/* Buttons */}
        <div style={{
          display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end'
        }}>
          <button type="button" onClick={onClose}
            style={{
              padding: '7px 16px', background: 'transparent',
              border: '1px solid var(--border-color)', color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, cursor: 'pointer'
            }}>
            CANCELAR
          </button>
          <button type="submit"
            style={{
              padding: '7px 16px', background: 'var(--bg-primary)',
              border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)',
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, cursor: 'pointer',
              boxShadow: '0 0 8px rgba(255, 170, 0, 0.15)'
            }}>
            GUARDAR
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
      fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2,
      fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: 4,
      ...style
    }}>
      {label}
      {children}
    </label>
  )
}
