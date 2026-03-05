import React, { useCallback, useRef, useEffect, useState } from 'react'
import { Layout, Model, IJsonModel, TabNode, Action, Actions, ITabRenderValues } from 'flexlayout-react'
import 'flexlayout-react/style/dark.css'
import { useLayoutStore } from '../../stores/layoutStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { PanelFactory } from './PanelFactory'
import { destroySession } from '../../services/terminalSessionRegistry'

const TAB_COLORS = [
  { name: 'VERDE', value: '#33ff33' },
  { name: 'AMBAR', value: '#ffaa00' },
  { name: 'CYAN', value: '#00ffcc' },
  { name: 'ROJO', value: '#ff2200' },
  { name: 'AZUL', value: '#00aaff' },
  { name: 'MAGENTA', value: '#ff00ff' },
  { name: 'BLANCO', value: '#cccccc' },
  { name: 'NINGUNO', value: '' }
]

let saveTimeout: ReturnType<typeof setTimeout> | null = null

function saveLayoutNow() {
  try {
    const data = useLayoutStore.getState().getAllWorkspacesJson()
    window.api.persistence.saveLayout(data)
  } catch {
    // ignore serialization errors
  }
}

export function TilingContainer() {
  const model = useLayoutStore((s) => s.model)
  const layoutRef = useRef<Layout>(null)
  const [tabEditor, setTabEditor] = useState<{
    nodeId: string
    x: number
    y: number
    name: string
  } | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Guardar layout inmediatamente al cerrar la app
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveLayoutNow()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Close tab editor on any outside click
  useEffect(() => {
    if (!tabEditor) return
    const handleClick = () => setTabEditor(null)
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [tabEditor])

  // Auto-focus rename input when tab editor opens
  useEffect(() => {
    if (tabEditor && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [tabEditor])

  const factory = useCallback((node: TabNode) => {
    return <PanelFactory node={node} />
  }, [])

  const handleModelChange = useCallback((_model: Model) => {
    // Debounced auto-save durante uso normal (only if enabled)
    if (!useSettingsStore.getState().autoSaveLayout) return
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(saveLayoutNow, 2000)
  }, [])

  const handleAction = useCallback((action: Action) => {
    // When a tab is actually closed, destroy its terminal session
    if (action.type === Actions.DELETE_TAB) {
      const nodeId = (action as any).data?.node
      if (nodeId) {
        try {
          const node = model.getNodeById(nodeId) as TabNode | null
          if (node && node.getComponent?.() === 'terminal') {
            destroySession(nodeId)
          }
        } catch { /* node may already be gone */ }
      }
    }
    return action
  }, [model])

  const handleRenderTab = useCallback((node: TabNode, renderValues: ITabRenderValues) => {
    const config = node.getConfig() || {}
    const tabColor = config.tabColor

    // Add a small color dot before the tab name
    if (tabColor) {
      renderValues.leading = (
        <div style={{
          width: 6,
          height: 6,
          background: tabColor,
          boxShadow: `0 0 6px ${tabColor}80`,
          marginRight: 4,
          flexShrink: 0
        }} />
      )
    }

    // Add tab editor button (name + color)
    renderValues.buttons.push(
      <button
        key="color-btn"
        title="Editar nombre y color"
        onMouseDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
          const rect = (e.target as HTMLElement).getBoundingClientRect()
          setTabEditor({
            nodeId: node.getId(),
            x: rect.left,
            y: rect.bottom + 4,
            name: node.getName()
          })
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: tabColor || 'var(--text-muted)',
          fontSize: 10,
          cursor: 'pointer',
          padding: '0 2px',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {'\u25CF'}
      </button>
    )
  }, [])

  const applyColor = useCallback((nodeId: string, color: string) => {
    try {
      const node = model.getNodeById(nodeId) as TabNode
      if (node) {
        const oldConfig = node.getConfig() || {}
        model.doAction(Actions.updateNodeAttributes(nodeId, {
          config: { ...oldConfig, tabColor: color || undefined }
        }))
        if (saveTimeout) clearTimeout(saveTimeout)
        saveTimeout = setTimeout(saveLayoutNow, 500)
      }
    } catch { /* ignore */ }
  }, [model])

  const applyName = useCallback((nodeId: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      model.doAction(Actions.renameTab(nodeId, trimmed))
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(saveLayoutNow, 500)
    } catch { /* ignore */ }
  }, [model])

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <Layout
        ref={layoutRef}
        model={model}
        factory={factory}
        onModelChange={handleModelChange}
        onAction={handleAction}
        onRenderTab={handleRenderTab}
        realtimeResize={true}
      />

      {/* Tab editor popup (name + color) */}
      {tabEditor && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: tabEditor.x,
            top: tabEditor.y,
            zIndex: 99999,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--accent-green)',
            boxShadow: '0 0 12px rgba(51, 255, 51, 0.15), 0 4px 12px rgba(0,0,0,0.5)',
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            minWidth: 120
          }}
        >
          {/* Name input */}
          <input
            ref={renameInputRef}
            type="text"
            value={tabEditor.name}
            onChange={(e) => setTabEditor({ ...tabEditor, name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applyName(tabEditor.nodeId, tabEditor.name)
                setTabEditor(null)
              }
              if (e.key === 'Escape') setTabEditor(null)
            }}
            onBlur={() => {
              applyName(tabEditor.nodeId, tabEditor.name)
            }}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '3px 5px',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              width: '100%',
              boxSizing: 'border-box'
            }}
            placeholder="NOMBRE..."
          />
          {/* Color grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 4
          }}>
            {TAB_COLORS.map((c) => (
              <button
                key={c.name}
                title={c.name}
                onClick={() => {
                  applyColor(tabEditor.nodeId, c.value)
                  applyName(tabEditor.nodeId, tabEditor.name)
                  setTabEditor(null)
                }}
                style={{
                  width: 22,
                  height: 22,
                  background: c.value || 'var(--bg-primary)',
                  border: c.value
                    ? `1px solid ${c.value}`
                    : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  boxShadow: c.value ? `0 0 4px ${c.value}40` : 'none',
                  position: 'relative'
                }}
              >
                {!c.value && (
                  <span style={{
                    color: 'var(--text-muted)',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    X
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
