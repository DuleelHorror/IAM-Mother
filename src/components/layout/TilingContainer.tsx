import React, { useCallback, useRef, useEffect, useState } from 'react'
import { Layout, Model, IJsonModel, TabNode, Action, Actions, ITabRenderValues } from 'flexlayout-react'
import 'flexlayout-react/style/dark.css'
import { useLayoutStore } from '../../stores/layoutStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { PanelFactory } from './PanelFactory'

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
  const [colorPicker, setColorPicker] = useState<{
    nodeId: string
    x: number
    y: number
  } | null>(null)

  // Guardar layout inmediatamente al cerrar la app
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveLayoutNow()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Close color picker on any outside click
  useEffect(() => {
    if (!colorPicker) return
    const handleClick = () => setColorPicker(null)
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [colorPicker])

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
    return action
  }, [])

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

    // Add color picker button
    renderValues.buttons.push(
      <button
        key="color-btn"
        title="Cambiar color de pestana"
        onMouseDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
          const rect = (e.target as HTMLElement).getBoundingClientRect()
          setColorPicker({
            nodeId: node.getId(),
            x: rect.left,
            y: rect.bottom + 4
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
        // Trigger save
        if (saveTimeout) clearTimeout(saveTimeout)
        saveTimeout = setTimeout(saveLayoutNow, 500)
      }
    } catch { /* ignore */ }
    setColorPicker(null)
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

      {/* Color picker popup */}
      {colorPicker && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: colorPicker.x,
            top: colorPicker.y,
            zIndex: 99999,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--accent-green)',
            boxShadow: '0 0 12px rgba(51, 255, 51, 0.15), 0 4px 12px rgba(0,0,0,0.5)',
            padding: 6,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 4
          }}
        >
          {TAB_COLORS.map((c) => (
            <button
              key={c.name}
              title={c.name}
              onClick={() => applyColor(colorPicker.nodeId, c.value)}
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
      )}
    </div>
  )
}
