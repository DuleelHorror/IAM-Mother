import React, { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { TerminalToolbar } from './TerminalToolbar'
import { useServiceStore } from '../../stores/serviceStore'
import {
  getSession,
  registerSession,
  detachSession
} from '../../services/terminalSessionRegistry'

interface TerminalPanelProps {
  nodeId: string
  shell?: string
  command?: string
  serviceId?: string
  cwd?: string
}

export function TerminalPanel({ nodeId, shell, command, serviceId, cwd }: TerminalPanelProps) {
  const termRef = useRef<HTMLDivElement>(null)
  const [connected, setConnected] = useState(false)
  const [currentCwd, setCurrentCwd] = useState(cwd || '')
  const ptyIdRef = useRef<string | null>(null)
  const globalCwd = useServiceStore((s) => s.globalCwd)

  useEffect(() => {
    const container = termRef.current
    if (!container) return

    let disposed = false
    let ptyId: string | null = null
    let unsubData: (() => void) | null = null
    let unsubExit: (() => void) | null = null
    let inputDisposable: { dispose(): void } | null = null
    let observer: ResizeObserver | null = null

    const term = new Terminal({
      theme: {
        background: '#050a05',
        foreground: '#33ff33',
        cursor: '#33ff33',
        cursorAccent: '#050a05',
        selectionBackground: 'rgba(51, 255, 51, 0.2)',
        black: '#0a120a',
        red: '#ff2200',
        green: '#33ff33',
        yellow: '#ffaa00',
        blue: '#00aaff',
        magenta: '#ff00ff',
        cyan: '#00ffcc',
        white: '#33ff33',
        brightBlack: '#116611',
        brightRed: '#ff4422',
        brightGreen: '#66ff66',
        brightYellow: '#ffcc44',
        brightBlue: '#44ccff',
        brightMagenta: '#ff44ff',
        brightCyan: '#44ffdd',
        brightWhite: '#88ff88'
      },
      fontFamily: "'Share Tech Mono', 'Consolas', 'Courier New', monospace",
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    // Interceptar Ctrl+C / Ctrl+V antes de que xterm los procese
    term.attachCustomKeyEventHandler((ev) => {
      // Shift+Enter: salto de línea sin ejecutar
      if (ev.shiftKey && ev.key === 'Enter' && ev.type === 'keydown') {
        if (ptyId && !disposed) {
          const isUnixShell = shell && (
            shell.includes('bash') ||
            shell.includes('wsl') ||
            shell.includes('zsh') ||
            shell.includes('fish') ||
            shell.includes('sh')
          )

          if (isUnixShell) {
            window.api.terminal.write(ptyId, '\x1b[200~\n\x1b[201~')
          } else {
            window.api.terminal.write(ptyId, '\x1b[13;28;13;1;16;1_')
          }
        }
        return false
      }
      // Ctrl+C con selección → copiar al clipboard
      if (ev.ctrlKey && ev.key === 'c' && ev.type === 'keydown') {
        const selection = term.getSelection()
        if (selection) {
          navigator.clipboard.writeText(selection)
          term.clearSelection()
          return false
        }
        return true
      }

      // Ctrl+V → pegar desde clipboard
      if (ev.ctrlKey && ev.key === 'v' && ev.type === 'keydown') {
        navigator.clipboard.readText().then((text) => {
          if (text && ptyId && !disposed) {
            window.api.terminal.write(ptyId, text)
          }
        })
        return false
      }

      // Ctrl+Shift+C → copiar siempre
      if (ev.ctrlKey && ev.shiftKey && ev.key === 'C' && ev.type === 'keydown') {
        const selection = term.getSelection()
        if (selection) navigator.clipboard.writeText(selection)
        return false
      }

      // Ctrl+Shift+V → pegar siempre
      if (ev.ctrlKey && ev.shiftKey && ev.key === 'V' && ev.type === 'keydown') {
        navigator.clipboard.readText().then((text) => {
          if (text && ptyId && !disposed) {
            window.api.terminal.write(ptyId, text)
          }
        })
        return false
      }

      return true
    })

    term.open(container)

    // Fit inicial con un pequeño delay para que el contenedor tenga dimensiones
    requestAnimationFrame(() => {
      if (!disposed) {
        try { fitAddon.fit() } catch { /* contenedor sin tamaño aún */ }
      }
    })

    // Check if there's an existing session for this node (e.g., after workspace switch)
    const existingSession = getSession(nodeId)

    if (existingSession && existingSession.alive) {
      // Reattach to existing PTY session
      ptyId = existingSession.ptyId
      ptyIdRef.current = ptyId

      // Stop buffering listeners from the detached state
      existingSession.unsubData?.()
      existingSession.unsubExit?.()
      existingSession.unsubData = null
      existingSession.unsubExit = null

      // Replay buffered output
      for (const chunk of existingSession.buffer) {
        term.write(chunk)
      }
      existingSession.buffer = []
      existingSession.bufferSize = 0
      existingSession.detached = false

      setConnected(true)
      if (!currentCwd) setCurrentCwd(cwd || globalCwd || '')

      // PTY → xterm
      unsubData = window.api.terminal.onData(ptyId, (data: string) => {
        if (!disposed) term.write(data)
      })

      // xterm → PTY
      inputDisposable = term.onData((data) => {
        if (!disposed && ptyId) {
          window.api.terminal.write(ptyId, data)
        }
      })

      // Salida del proceso
      unsubExit = window.api.terminal.onExit(ptyId, () => {
        if (!disposed) {
          term.writeln('\r\n\x1b[33m[PROCESO TERMINADO]\x1b[0m')
          setConnected(false)
          existingSession.alive = false
        }
      })

      // Store listeners in session for cleanup
      existingSession.unsubData = unsubData
      existingSession.unsubExit = unsubExit

      // Sync size
      try { fitAddon.fit() } catch { /* ignore */ }
      window.api.terminal.resize(ptyId, term.cols, term.rows)
    } else if (existingSession && !existingSession.alive) {
      // Session exists but process died while detached
      for (const chunk of existingSession.buffer) {
        term.write(chunk)
      }
      term.writeln('\r\n\x1b[33m[PROCESO TERMINADO]\x1b[0m')
      setConnected(false)

      // Clean up stale session, create fresh one
      existingSession.unsubData?.()
      existingSession.unsubExit?.()
    } else {
      // No existing session - create new PTY
      window.api.terminal
        .create({
          shell,
          command,
          cwd: cwd || globalCwd || undefined,
          cols: term.cols,
          rows: term.rows
        })
        .then((id: string) => {
          if (disposed) {
            window.api.terminal.kill(id)
            return
          }

          ptyId = id
          ptyIdRef.current = id
          setConnected(true)
          if (!currentCwd) setCurrentCwd(cwd || globalCwd || '')

          // Register session in registry
          const session = registerSession(nodeId, id)

          // PTY → xterm
          unsubData = window.api.terminal.onData(id, (data: string) => {
            if (!disposed) term.write(data)
          })

          // xterm → PTY
          inputDisposable = term.onData((data) => {
            if (!disposed && ptyId) {
              window.api.terminal.write(ptyId, data)
            }
          })

          // Salida del proceso
          unsubExit = window.api.terminal.onExit(id, () => {
            if (!disposed) {
              term.writeln('\r\n\x1b[33m[PROCESO TERMINADO]\x1b[0m')
              setConnected(false)
              session.alive = false
            }
          })

          // Store listeners in session
          session.unsubData = unsubData
          session.unsubExit = unsubExit

          // Sincronizar tamaño tras la conexión
          try { fitAddon.fit() } catch { /* ignore */ }
          window.api.terminal.resize(id, term.cols, term.rows)
        })
    }

    // ResizeObserver para auto-fit
    observer = new ResizeObserver(() => {
      if (disposed) return
      try {
        fitAddon.fit()
        if (ptyId) {
          window.api.terminal.resize(ptyId, term.cols, term.rows)
        }
      } catch { /* ignore */ }
    })
    observer.observe(container)

    // Cleanup: detach session instead of killing PTY
    return () => {
      disposed = true
      ptyIdRef.current = null
      observer?.disconnect()
      inputDisposable?.dispose()

      // Detach instead of destroying - keeps PTY alive and buffers output
      if (ptyId) {
        detachSession(nodeId)
      }

      term.dispose()
    }
  }, [nodeId])

  const addRecentFolder = useServiceStore((s) => s.addRecentFolder)

  const handleChangeCwd = async () => {
    const dir = await window.api.dialog.selectDirectory()
    if (dir && ptyIdRef.current) {
      // Send cd command to the running terminal
      const cdCmd = shell && (shell.includes('powershell') || shell.includes('pwsh'))
        ? `Set-Location "${dir}"\r`
        : `cd "${dir}"\r`
      window.api.terminal.write(ptyIdRef.current, cdCmd)
      setCurrentCwd(dir)
      await addRecentFolder(dir)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TerminalToolbar
        serviceId={serviceId}
        connected={connected}
        shell={shell}
        cwd={currentCwd}
        onChangeCwd={handleChangeCwd}
      />
      <div ref={termRef} style={{ flex: 1, overflow: 'hidden' }} />
    </div>
  )
}
