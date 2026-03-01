import React, { useState, useRef, useEffect } from 'react'
import { useLayoutStore } from '../../stores/layoutStore'

export function WorkspaceBar() {
  const workspaces = useLayoutStore((s) => s.workspaces)
  const activeId = useLayoutStore((s) => s.activeWorkspaceId)
  const switchWorkspace = useLayoutStore((s) => s.switchWorkspace)
  const addWorkspace = useLayoutStore((s) => s.addWorkspace)
  const removeWorkspace = useLayoutStore((s) => s.removeWorkspace)
  const renameWorkspace = useLayoutStore((s) => s.renameWorkspace)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const startRename = (id: string, currentName: string) => {
    setEditingId(id)
    setEditName(currentName)
  }

  const finishRename = () => {
    if (editingId && editName.trim()) {
      renameWorkspace(editingId, editName.trim().toUpperCase())
    }
    setEditingId(null)
  }

  return (
    <div style={{
      height: 26,
      background: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'stretch',
      flexShrink: 0,
      overflow: 'hidden'
    }}>
      {workspaces.map((ws) => (
        <WorkspaceTab
          key={ws.id}
          name={ws.name}
          active={ws.id === activeId}
          editing={editingId === ws.id}
          editName={editName}
          canClose={workspaces.length > 1}
          onClick={() => switchWorkspace(ws.id)}
          onDoubleClick={() => startRename(ws.id, ws.name)}
          onClose={() => removeWorkspace(ws.id)}
          onEditChange={setEditName}
          onEditFinish={finishRename}
        />
      ))}

      {/* Boton nueva pantalla */}
      <AddButton onClick={() => addWorkspace()} />

      {/* Boton presets */}
      <PresetButton />

      {/* Linea decorativa */}
      <div style={{
        flex: 1,
        borderBottom: '1px solid var(--border-color)',
        alignSelf: 'flex-end'
      }} />
    </div>
  )
}

function WorkspaceTab({
  name,
  active,
  editing,
  editName,
  canClose,
  onClick,
  onDoubleClick,
  onClose,
  onEditChange,
  onEditFinish
}: {
  name: string
  active: boolean
  editing: boolean
  editName: string
  canClose: boolean
  onClick: () => void
  onDoubleClick: () => void
  onClose: () => void
  onEditChange: (v: string) => void
  onEditFinish: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 12px',
        fontSize: 9,
        fontFamily: 'var(--font-mono)',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        cursor: 'pointer',
        color: active ? 'var(--accent-amber)' : hovered ? 'var(--text-primary)' : 'var(--text-muted)',
        background: active ? 'var(--bg-secondary)' : 'transparent',
        borderTop: active ? '2px solid var(--accent-amber)' : '2px solid transparent',
        borderRight: '1px solid var(--border-color)',
        textShadow: active ? 'var(--crt-glow-amber)' : 'none',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        userSelect: 'none'
      }}
    >
      {editing ? (
        <input
          autoFocus
          value={editName}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditFinish}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditFinish()
            if (e.key === 'Escape') onEditFinish()
          }}
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--accent-amber)',
            color: 'var(--accent-amber)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            padding: '1px 4px',
            width: 100,
            outline: 'none'
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span>{name}</span>
      )}

      {canClose && (hovered || active) && !editing && (
        <span
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            lineHeight: 1,
            transition: 'color 0.15s'
          }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--accent-red)'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
        >
          ×
        </span>
      )}
    </div>
  )
}

function AddButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Nueva pantalla"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        fontSize: 14,
        cursor: 'pointer',
        color: hovered ? 'var(--accent-green)' : 'var(--text-muted)',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        borderRight: '1px solid var(--border-color)',
        textShadow: hovered ? 'var(--crt-glow)' : 'none',
        transition: 'all 0.15s'
      }}
    >
      +
    </div>
  )
}

function PresetButton() {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const presets = useLayoutStore((s) => s.presets)
  const saveAsPreset = useLayoutStore((s) => s.saveAsPreset)
  const loadPreset = useLayoutStore((s) => s.loadPreset)
  const deletePreset = useLayoutStore((s) => s.deletePreset)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSave = async () => {
    const name = presetName.trim()
    if (!name) return
    await saveAsPreset(name.toUpperCase())
    setPresetName('')
  }

  const handleLoad = (id: string) => {
    if (confirmId === id) {
      loadPreset(id)
      setOpen(false)
      setConfirmId(null)
    } else {
      setConfirmId(id)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deletePreset(id)
    if (confirmId === id) setConfirmId(null)
  }

  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase'
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <div
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Presets de entorno"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          fontSize: 12,
          cursor: 'pointer',
          color: open ? 'var(--accent-amber)' : hovered ? 'var(--accent-green)' : 'var(--text-muted)',
          background: open ? 'var(--bg-secondary)' : hovered ? 'var(--bg-hover)' : 'transparent',
          borderRight: '1px solid var(--border-color)',
          textShadow: (open || hovered) ? 'var(--crt-glow)' : 'none',
          transition: 'all 0.15s',
          height: '100%'
        }}
      >
        &#9776;
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 1000,
          minWidth: 240,
          background: 'var(--bg-primary)',
          border: '1px solid var(--accent-green)',
          boxShadow: '0 0 12px rgba(51, 255, 0, 0.15)',
          ...baseStyle
        }}>
          {/* Save section */}
          <div style={{
            padding: '8px 10px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            gap: 6
          }}>
            <input
              autoFocus
              placeholder="NOMBRE DEL PRESET..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              style={{
                flex: 1,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '3px 6px',
                outline: 'none',
                ...baseStyle
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-amber)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
            />
            <button
              onClick={handleSave}
              style={{
                background: 'transparent',
                border: '1px solid var(--accent-green)',
                color: 'var(--accent-green)',
                padding: '3px 8px',
                cursor: 'pointer',
                ...baseStyle
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'var(--accent-green)'
                ;(e.target as HTMLElement).style.color = 'var(--bg-primary)'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'transparent'
                ;(e.target as HTMLElement).style.color = 'var(--accent-green)'
              }}
            >
              GUARDAR
            </button>
          </div>

          {/* Preset list */}
          {presets.length === 0 ? (
            <div style={{
              padding: '12px 10px',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}>
              SIN PRESETS GUARDADOS
            </div>
          ) : (
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {presets.map((p) => (
                <PresetItem
                  key={p.id}
                  name={p.name}
                  date={new Date(p.createdAt).toLocaleDateString()}
                  workspaceCount={p.workspaces.length}
                  confirming={confirmId === p.id}
                  onClick={() => handleLoad(p.id)}
                  onDelete={(e) => handleDelete(e, p.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PresetItem({
  name,
  date,
  workspaceCount,
  confirming,
  onClick,
  onDelete
}: {
  name: string
  date: string
  workspaceCount: number
  confirming: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: confirming ? 'var(--accent-amber)' : hovered ? 'var(--text-primary)' : 'var(--text-muted)',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        borderBottom: '1px solid var(--border-color)',
        transition: 'all 0.15s'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          textShadow: confirming ? 'var(--crt-glow-amber)' : 'none'
        }}>
          {confirming ? '> CARGAR?' : name}
        </span>
        <span style={{
          fontSize: 8,
          color: 'var(--text-muted)',
          opacity: 0.7
        }}>
          {date} — {workspaceCount} pantalla{workspaceCount !== 1 ? 's' : ''}
        </span>
      </div>
      {hovered && (
        <span
          onClick={onDelete}
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            padding: '0 4px',
            transition: 'color 0.15s'
          }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--accent-red)'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
        >
          ×
        </span>
      )}
    </div>
  )
}
