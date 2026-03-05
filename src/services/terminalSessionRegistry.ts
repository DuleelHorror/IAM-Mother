/**
 * Terminal Session Registry
 *
 * Keeps PTY processes alive across component unmounts (e.g., workspace switches).
 * Buffers output while the terminal UI is detached so it can be replayed on reattach.
 */

const MAX_BUFFER_SIZE = 100_000 // max chars to buffer while detached

interface TerminalSession {
  ptyId: string
  buffer: string[]
  bufferSize: number
  alive: boolean
  detached: boolean
  unsubData: (() => void) | null
  unsubExit: (() => void) | null
}

const sessions = new Map<string, TerminalSession>()

/** Get an existing session for a node */
export function getSession(nodeId: string): TerminalSession | undefined {
  return sessions.get(nodeId)
}

/** Register a new session after creating a PTY */
export function registerSession(nodeId: string, ptyId: string): TerminalSession {
  // Clean up any stale session for this node
  const existing = sessions.get(nodeId)
  if (existing) {
    existing.unsubData?.()
    existing.unsubExit?.()
    if (existing.alive) {
      window.api.terminal.kill(existing.ptyId)
    }
  }

  const session: TerminalSession = {
    ptyId,
    buffer: [],
    bufferSize: 0,
    alive: true,
    detached: false,
    unsubData: null,
    unsubExit: null
  }
  sessions.set(nodeId, session)
  return session
}

/**
 * Detach a session (component unmounting but PTY stays alive).
 * Starts buffering output for later replay.
 */
export function detachSession(nodeId: string): void {
  const session = sessions.get(nodeId)
  if (!session) return

  // Remove the xterm-bound listeners
  session.unsubData?.()
  session.unsubExit?.()
  session.unsubData = null
  session.unsubExit = null

  session.detached = true
  session.buffer = []
  session.bufferSize = 0

  if (session.alive) {
    // Start buffering PTY output
    const unsub = window.api.terminal.onData(session.ptyId, (data: string) => {
      if (session.bufferSize + data.length > MAX_BUFFER_SIZE) {
        // Trim old data to make room
        while (session.buffer.length > 0 && session.bufferSize + data.length > MAX_BUFFER_SIZE) {
          const removed = session.buffer.shift()!
          session.bufferSize -= removed.length
        }
      }
      session.buffer.push(data)
      session.bufferSize += data.length
    })

    const unsubExit = window.api.terminal.onExit(session.ptyId, () => {
      session.alive = false
    })

    // Store these so they can be cleaned up on reattach
    session.unsubData = unsub
    session.unsubExit = unsubExit
  }
}

/**
 * Destroy a session completely (tab closed).
 * Kills the PTY process and removes from registry.
 */
export function destroySession(nodeId: string): void {
  const session = sessions.get(nodeId)
  if (!session) return

  session.unsubData?.()
  session.unsubExit?.()
  if (session.alive) {
    window.api.terminal.kill(session.ptyId)
  }
  sessions.delete(nodeId)
}

/** Destroy all sessions (app closing) */
export function destroyAllSessions(): void {
  for (const [nodeId] of sessions) {
    destroySession(nodeId)
  }
}
