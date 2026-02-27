import React, { useState } from 'react'
import { useServiceStore } from '../../stores/serviceStore'
import { useLayoutStore } from '../../stores/layoutStore'
import { useTrackingStore } from '../../stores/trackingStore'
import { AIServiceConfig } from '../../types/ai-service'
import { AddServiceModal } from './AddServiceModal'

export function ServiceList() {
  const services = useServiceStore((s) => s.services)
  const globalCwd = useServiceStore((s) => s.globalCwd)
  const selectGlobalCwd = useServiceStore((s) => s.selectGlobalCwd)
  const addPanel = useLayoutStore((s) => s.addPanel)
  const usage = useTrackingStore((s) => s.usage)
  const [showAddModal, setShowAddModal] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const openService = (service: AIServiceConfig) => {
    const config: any = { serviceId: service.id }

    if (service.panelType === 'terminal') {
      config.shell = service.shell
      config.command = service.command
      addPanel(service.name, 'terminal', config)
    } else if (service.panelType === 'web') {
      config.url = service.url
      config.partition = service.sessionPartition
      addPanel(service.name, 'web', config)
    }
  }

  const openDashboard = (service: AIServiceConfig) => {
    addPanel(`${service.name} Stats`, 'dashboard', { serviceId: service.id })
  }

  const openWelcome = () => {
    addPanel('IAM MOTHER', 'welcome', {})
  }

  const openSubscriptions = () => {
    addPanel('COSTES', 'subscriptions', {})
  }

  const truncatePath = (p: string, max: number = 22) => {
    if (!p) return 'SIN CARPETA'
    if (p.length <= max) return p
    const parts = p.replace(/\\/g, '/').split('/')
    // Show drive + last folder
    if (parts.length >= 2) {
      const last = parts[parts.length - 1]
      const drive = parts[0]
      const truncated = `${drive}/.../${last}`
      if (truncated.length <= max) return truncated
      return `.../${last}`
    }
    return '...' + p.slice(p.length - max + 3)
  }

  const sidebarWidth = collapsed ? 42 : 220

  return (
    <div
      style={{
        width: sidebarWidth,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'width 0.2s ease'
      }}
    >
      {/* Header con toggle */}
      <div style={{
        padding: collapsed ? '10px 0' : '10px 10px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 6
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <div style={{
              width: 5, height: 5,
              background: 'var(--accent-green)',
              boxShadow: 'var(--crt-glow)',
              animation: 'glow-pulse 2s ease-in-out infinite',
              flexShrink: 0
            }} />
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'var(--accent-amber)',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              fontFamily: 'var(--font-mono)',
              textShadow: 'var(--crt-glow-amber)',
              whiteSpace: 'nowrap'
            }}>
              SERVICIOS IA
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            flexShrink: 0,
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.borderColor = 'var(--accent-green)'
            ;(e.target as HTMLElement).style.color = 'var(--accent-green)'
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.borderColor = 'var(--border-color)'
            ;(e.target as HTMLElement).style.color = 'var(--text-muted)'
          }}
        >
          {collapsed ? '\u25B6' : '\u25C0'}
        </button>
      </div>

      {/* Selector de carpeta global */}
      <div style={{
        padding: collapsed ? '6px 4px' : '6px 8px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <button
          onClick={selectGlobalCwd}
          title={globalCwd || 'Seleccionar carpeta de trabajo'}
          style={{
            width: '100%',
            padding: collapsed ? '6px 0' : '5px 6px',
            background: 'var(--bg-primary)',
            color: globalCwd ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontSize: collapsed ? 12 : 9,
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            letterSpacing: collapsed ? 0 : 0.5,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            const el = e.target as HTMLElement
            el.style.borderColor = 'var(--accent-cyan)'
            el.style.textShadow = '0 0 6px rgba(0, 255, 204, 0.4)'
          }}
          onMouseLeave={(e) => {
            const el = e.target as HTMLElement
            el.style.borderColor = 'var(--border-color)'
            el.style.textShadow = 'none'
          }}
        >
          {collapsed ? '\u{1F4C1}' : `\u{1F4C1} ${truncatePath(globalCwd)}`}
        </button>
      </div>

      {/* Lista de servicios */}
      <div style={{ flex: 1, overflow: 'auto', padding: '2px 0' }}>
        {services.filter((s) => s.enabled).map((service) => {
          const serviceUsage = usage[service.id]
          return collapsed ? (
            <CollapsedServiceItem
              key={service.id}
              service={service}
              onOpen={() => openService(service)}
            />
          ) : (
            <ServiceItem
              key={service.id}
              service={service}
              cost={serviceUsage?.costUsd}
              onOpen={() => openService(service)}
              onDashboard={() => openDashboard(service)}
            />
          )
        })}
      </div>

      {/* Botones inferiores */}
      <div style={{
        padding: collapsed ? '6px 4px' : '6px 8px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>
        {/* Boton IAM MOTHER */}
        <button
          onClick={openWelcome}
          title="Abrir panel IAM MOTHER"
          style={{
            width: '100%',
            padding: collapsed ? '6px 0' : '5px 0',
            background: 'var(--bg-primary)',
            color: 'var(--accent-amber)',
            fontSize: collapsed ? 12 : 9,
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            fontFamily: collapsed ? 'var(--font-mono)' : 'var(--font-display)',
            letterSpacing: collapsed ? 0 : 2,
            textTransform: 'uppercase',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            const el = e.target as HTMLElement
            el.style.borderColor = 'var(--accent-amber)'
            el.style.textShadow = 'var(--crt-glow-amber)'
          }}
          onMouseLeave={(e) => {
            const el = e.target as HTMLElement
            el.style.borderColor = 'var(--border-color)'
            el.style.textShadow = 'none'
          }}
        >
          {collapsed ? 'M' : 'IAM MOTHER'}
        </button>

        {/* Boton costes de suscripcion */}
        <button
          onClick={openSubscriptions}
          title="Ver costes de suscripcion"
          style={{
            width: '100%',
            padding: collapsed ? '6px 0' : '5px 0',
            background: 'var(--bg-primary)',
            color: 'var(--accent-cyan)',
            fontSize: collapsed ? 12 : 9,
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            letterSpacing: collapsed ? 0 : 2,
            textTransform: 'uppercase',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            const el = e.target as HTMLElement
            el.style.borderColor = 'var(--accent-cyan)'
            el.style.textShadow = '0 0 8px rgba(0, 255, 204, 0.3)'
          }}
          onMouseLeave={(e) => {
            const el = e.target as HTMLElement
            el.style.borderColor = 'var(--border-color)'
            el.style.textShadow = 'none'
          }}
        >
          {collapsed ? '$' : '\u{1F4B0} COSTES'}
        </button>

        {/* Boton agregar servicio */}
        <button
          onClick={() => setShowAddModal(true)}
          title="Agregar servicio IA"
          style={{
            width: '100%',
            padding: collapsed ? '6px 0' : '5px 0',
            background: 'var(--bg-primary)',
            color: 'var(--accent-green)',
            fontSize: collapsed ? 14 : 9,
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            letterSpacing: collapsed ? 0 : 2,
            textTransform: 'uppercase',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            const el = e.target as HTMLElement
            el.style.borderColor = 'var(--accent-green)'
            el.style.boxShadow = '0 0 8px rgba(51, 255, 51, 0.2)'
          }}
          onMouseLeave={(e) => {
            const el = e.target as HTMLElement
            el.style.borderColor = 'var(--border-color)'
            el.style.boxShadow = 'none'
          }}
        >
          {collapsed ? '+' : '[+] AGREGAR'}
        </button>
      </div>

      {showAddModal && (
        <AddServiceModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}

/** Item colapsado: solo el punto de color */
function CollapsedServiceItem({
  service,
  onOpen
}: {
  service: AIServiceConfig
  onOpen: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={service.name}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 0',
        cursor: 'pointer',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        transition: 'all 0.15s'
      }}
    >
      <div style={{
        width: 8,
        height: 8,
        background: service.color,
        boxShadow: hovered ? `0 0 10px ${service.color}` : 'none',
        transition: 'all 0.15s'
      }} />
    </div>
  )
}

/** Item expandido: nombre, tipo, coste */
function ServiceItem({
  service,
  cost,
  onOpen,
  onDashboard
}: {
  service: AIServiceConfig
  cost?: number
  onOpen: () => void
  onDashboard: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        padding: '5px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        cursor: 'pointer',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        borderLeft: hovered ? `2px solid ${service.color}` : '2px solid transparent',
        transition: 'all 0.15s'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      <div style={{
        width: 5, height: 5,
        background: service.color,
        boxShadow: hovered ? `0 0 8px ${service.color}80` : undefined,
        flexShrink: 0
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10,
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          textShadow: hovered ? 'var(--crt-glow)' : undefined
        }}>
          {service.name}
        </div>
        <div style={{
          fontSize: 8,
          color: 'var(--text-muted)',
          display: 'flex',
          gap: 6,
          letterSpacing: 1,
          fontFamily: 'var(--font-mono)'
        }}>
          <span>{service.panelType === 'terminal' ? 'CLI' : 'WEB'}</span>
          {cost != null && cost > 0 && (
            <span style={{ color: 'var(--accent-amber)' }}>
              ${cost.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDashboard()
          }}
          style={{
            padding: '2px 5px',
            background: 'transparent',
            color: 'var(--accent-amber)',
            fontSize: 8,
            border: '1px solid var(--accent-amber)',
            flexShrink: 0,
            fontFamily: 'var(--font-mono)',
            letterSpacing: 1,
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
          title="Abrir dashboard"
        >
          DATOS
        </button>
      )}
    </div>
  )
}
