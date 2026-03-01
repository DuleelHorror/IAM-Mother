import React, { useState, useRef } from 'react'
import { useServiceStore } from '../../stores/serviceStore'
import { useLayoutStore } from '../../stores/layoutStore'
import { useTrackingStore } from '../../stores/trackingStore'
import { AIServiceConfig } from '../../types/ai-service'
import { AddServiceModal } from './AddServiceModal'
import { EditServiceModal } from './EditServiceModal'
import { SettingsModal } from './SettingsModal'

export function ServiceList() {
  const services = useServiceStore((s) => s.services)
  const reorderServices = useServiceStore((s) => s.reorderServices)
  const globalCwd = useServiceStore((s) => s.globalCwd)
  const selectGlobalCwd = useServiceStore((s) => s.selectGlobalCwd)
  const addPanel = useLayoutStore((s) => s.addPanel)
  const usage = useTrackingStore((s) => s.usage)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [editingService, setEditingService] = useState<AIServiceConfig | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const openService = (service: AIServiceConfig) => {
    const config: any = { serviceId: service.id }

    if (service.panelType === 'terminal') {
      config.shell = service.shell
      config.command = service.command
      config.cwd = service.cwd
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
    if (parts.length >= 2) {
      const last = parts[parts.length - 1]
      const drive = parts[0]
      const truncated = `${drive}/.../${last}`
      if (truncated.length <= max) return truncated
      return `.../${last}`
    }
    return '...' + p.slice(p.length - max + 3)
  }

  const enabledServices = services.filter((s) => s.enabled)
  const filteredServices = searchFilter
    ? enabledServices.filter((s) => s.name.toLowerCase().includes(searchFilter.toLowerCase()))
    : enabledServices

  // Drag & drop handlers - use real index in full services array
  const handleDragStart = (e: React.DragEvent, service: AIServiceConfig) => {
    const realIdx = services.findIndex((s) => s.id === service.id)
    setDragIndex(realIdx)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, service: AIServiceConfig) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const realIdx = services.findIndex((s) => s.id === service.id)
    setDropIndex(realIdx)
  }

  const handleDrop = (e: React.DragEvent, service: AIServiceConfig) => {
    e.preventDefault()
    const toIdx = services.findIndex((s) => s.id === service.id)
    if (dragIndex != null && dragIndex !== toIdx) {
      reorderServices(dragIndex, toIdx)
    }
    setDragIndex(null)
    setDropIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDropIndex(null)
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

      {/* Search filter - only when expanded */}
      {!collapsed && (
        <div style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-color)' }}>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="BUSCAR..."
            style={{
              width: '100%',
              padding: '4px 6px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 1,
              textTransform: 'uppercase'
            }}
          />
        </div>
      )}

      {/* Lista de servicios */}
      <div style={{ flex: 1, overflow: 'auto', padding: '2px 0' }}>
        {filteredServices.map((service) => {
          const serviceUsage = usage[service.id]
          const realIdx = services.findIndex((s) => s.id === service.id)
          const isDragging = dragIndex === realIdx
          const isDropTarget = dropIndex === realIdx && dragIndex !== realIdx
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
              onEdit={() => setEditingService(service)}
              isDragging={isDragging}
              isDropTarget={isDropTarget}
              onDragStart={(e) => handleDragStart(e, service)}
              onDragOver={(e) => handleDragOver(e, service)}
              onDrop={(e) => handleDrop(e, service)}
              onDragEnd={handleDragEnd}
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

        {/* Boton configuracion */}
        <button
          onClick={() => setShowSettingsModal(true)}
          title="Configuracion"
          style={{
            width: '100%',
            padding: collapsed ? '6px 0' : '5px 0',
            background: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
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
            el.style.borderColor = 'var(--text-secondary)'
            el.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            const el = e.target as HTMLElement
            el.style.borderColor = 'var(--border-color)'
            el.style.color = 'var(--text-secondary)'
          }}
        >
          {collapsed ? '\u2699' : '\u2699 CONFIG'}
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
      {editingService && (
        <EditServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
        />
      )}
      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
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

/** Item expandido: nombre, tipo, coste, edit, drag */
function ServiceItem({
  service,
  cost,
  onOpen,
  onDashboard,
  onEdit,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: {
  service: AIServiceConfig
  cost?: number
  onOpen: () => void
  onDashboard: () => void
  onEdit: () => void
  isDragging: boolean
  isDropTarget: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        padding: '5px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        cursor: 'pointer',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        borderLeft: hovered ? `2px solid ${service.color}` : '2px solid transparent',
        borderTop: isDropTarget ? '2px solid var(--accent-green)' : '2px solid transparent',
        opacity: isDragging ? 0.4 : 1,
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
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            style={{
              padding: '2px 5px',
              background: 'transparent',
              color: 'var(--accent-cyan)',
              fontSize: 8,
              border: '1px solid var(--accent-cyan)',
              flexShrink: 0,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 1,
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
            title="Editar servicio"
          >
            EDIT
          </button>
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
        </>
      )}
    </div>
  )
}
