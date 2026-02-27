import React, { useState } from 'react'
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
