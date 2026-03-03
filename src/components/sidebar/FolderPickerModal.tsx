import React, { useState } from 'react'
import { useServiceStore } from '../../stores/serviceStore'

interface FolderPickerModalProps {
  serviceName: string
  onSelect: (folder: string | undefined) => void
  onClose: () => void
}

function truncatePath(p: string, max: number = 45): string {
  if (!p) return ''
  if (p.length <= max) return p
  const parts = p.replace(/\\/g, '/').split('/')
  if (parts.length >= 3) {
    const last = parts[parts.length - 1]
    const secondLast = parts[parts.length - 2]
    const drive = parts[0]
    const truncated = `${drive}/.../${secondLast}/${last}`
    if (truncated.length <= max) return truncated
    return `.../${secondLast}/${last}`
  }
  return '...' + p.slice(p.length - max + 3)
}

function getFolderName(p: string): string {
  const parts = p.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || p
}

export function FolderPickerModal({ serviceName, onSelect, onClose }: FolderPickerModalProps) {
  const recentFolders = useServiceStore((s) => s.recentFolders)
  const globalCwd = useServiceStore((s) => s.globalCwd)
  const addRecentFolder = useServiceStore((s) => s.addRecentFolder)
  const removeRecentFolder = useServiceStore((s) => s.removeRecentFolder)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)

  const handleBrowse = async () => {
    const dir = await window.api.dialog.selectDirectory()
    if (dir) {
      await addRecentFolder(dir)
      onSelect(dir)
    }
  }

  const handleSelectRecent = async (folder: string) => {
    await addRecentFolder(folder) // moves to front
    onSelect(folder)
  }

  const handleRemoveRecent = async (e: React.MouseEvent, folder: string) => {
    e.stopPropagation()
    await removeRecentFolder(folder)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--accent-green)',
          boxShadow: '0 0 20px rgba(51, 255, 51, 0.1), 0 8px 32px rgba(0, 0, 0, 0.6)',
          padding: 0,
          minWidth: 340,
          maxWidth: 440,
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-mono)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{
            fontSize: 10,
            color: 'var(--accent-amber)',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            textShadow: 'var(--crt-glow-amber)'
          }}>
            ABRIR {serviceName}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              padding: '0 4px'
            }}
          >
            X
          </button>
        </div>

        {/* Subtitle */}
        <div style={{
          padding: '8px 14px 4px',
          fontSize: 9,
          color: 'var(--text-muted)',
          letterSpacing: 1,
          textTransform: 'uppercase'
        }}>
          SELECCIONAR CARPETA DE TRABAJO
        </div>

        {/* Recent folders list */}
        {recentFolders.length > 0 && (
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '4px 8px'
          }}>
            {recentFolders.map((folder, idx) => (
              <div
                key={folder}
                onClick={() => handleSelectRecent(folder)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  background: hoveredIdx === idx ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: hoveredIdx === idx ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                  transition: 'all 0.1s'
                }}
              >
                <span style={{
                  fontSize: 12,
                  flexShrink: 0,
                  opacity: 0.7
                }}>
                  {'\u{1F4C1}'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 10,
                    color: hoveredIdx === idx ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 500,
                    letterSpacing: 0.5,
                    textShadow: hoveredIdx === idx ? 'var(--crt-glow)' : 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {getFolderName(folder)}
                  </div>
                  <div style={{
                    fontSize: 8,
                    color: 'var(--text-muted)',
                    letterSpacing: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {truncatePath(folder)}
                  </div>
                </div>
                {hoveredIdx === idx && (
                  <button
                    onClick={(e) => handleRemoveRecent(e, folder)}
                    title="Quitar de recientes"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent-red)',
                      fontSize: 9,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 4px',
                      flexShrink: 0,
                      opacity: 0.7
                    }}
                  >
                    X
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No recent folders message */}
        {recentFolders.length === 0 && (
          <div style={{
            padding: '16px 14px',
            fontSize: 9,
            color: 'var(--text-muted)',
            textAlign: 'center',
            letterSpacing: 1
          }}>
            NO HAY CARPETAS RECIENTES
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          padding: '8px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          {/* Browse button */}
          <button
            onClick={handleBrowse}
            onMouseEnter={() => setHoveredBtn('browse')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              width: '100%',
              padding: '7px 10px',
              background: hoveredBtn === 'browse' ? 'var(--bg-hover)' : 'var(--bg-primary)',
              color: hoveredBtn === 'browse' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: `1px solid ${hoveredBtn === 'browse' ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
              cursor: 'pointer',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 1,
              textTransform: 'uppercase',
              textAlign: 'left',
              transition: 'all 0.15s',
              textShadow: hoveredBtn === 'browse' ? '0 0 6px rgba(0,255,204,0.4)' : 'none'
            }}
          >
            {'\u{1F4C2}'} EXAMINAR...
          </button>

          {/* Global cwd option */}
          {globalCwd && (
            <button
              onClick={() => {
                addRecentFolder(globalCwd)
                onSelect(globalCwd)
              }}
              onMouseEnter={() => setHoveredBtn('global')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                width: '100%',
                padding: '7px 10px',
                background: hoveredBtn === 'global' ? 'var(--bg-hover)' : 'var(--bg-primary)',
                color: hoveredBtn === 'global' ? 'var(--accent-amber)' : 'var(--text-secondary)',
                border: `1px solid ${hoveredBtn === 'global' ? 'var(--accent-amber)' : 'var(--border-color)'}`,
                cursor: 'pointer',
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                letterSpacing: 1,
                textTransform: 'uppercase',
                textAlign: 'left',
                transition: 'all 0.15s',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textShadow: hoveredBtn === 'global' ? 'var(--crt-glow-amber)' : 'none'
              }}
            >
              {'\u{1F30D}'} GLOBAL: {truncatePath(globalCwd, 35)}
            </button>
          )}

          {/* Default / no folder */}
          <button
            onClick={() => onSelect(undefined)}
            onMouseEnter={() => setHoveredBtn('default')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              width: '100%',
              padding: '7px 10px',
              background: hoveredBtn === 'default' ? 'var(--bg-hover)' : 'var(--bg-primary)',
              color: hoveredBtn === 'default' ? 'var(--accent-green)' : 'var(--text-muted)',
              border: `1px solid ${hoveredBtn === 'default' ? 'var(--accent-green)' : 'var(--border-color)'}`,
              cursor: 'pointer',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 1,
              textTransform: 'uppercase',
              textAlign: 'left',
              transition: 'all 0.15s',
              textShadow: hoveredBtn === 'default' ? 'var(--crt-glow)' : 'none'
            }}
          >
            {'\u{1F4BB}'} DIRECTORIO POR DEFECTO
          </button>
        </div>
      </div>
    </div>
  )
}
