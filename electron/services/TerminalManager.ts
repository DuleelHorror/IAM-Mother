import * as pty from 'node-pty'
import { EventEmitter } from 'events'
import os from 'os'

interface PtyInstance {
  process: pty.IPty
  id: string
}

export class TerminalManager extends EventEmitter {
  private terminals = new Map<string, PtyInstance>()
  private nextId = 0

  getDefaultShell(): string {
    if (process.platform === 'win32') {
      return 'powershell.exe'
    }
    return process.env.SHELL || '/bin/bash'
  }

  resolveShell(shell?: string): string {
    if (!shell) return this.getDefaultShell()

    const shellMap: Record<string, string> = {
      powershell: 'powershell.exe',
      pwsh: 'pwsh.exe',
      cmd: 'cmd.exe',
      bash: 'bash.exe',
      wsl: 'wsl.exe',
      'git-bash': 'C:\\Program Files\\Git\\bin\\bash.exe'
    }

    return shellMap[shell] || shell
  }

  create(opts: {
    shell?: string
    command?: string
    cwd?: string
    env?: Record<string, string>
    cols?: number
    rows?: number
  }): string {
    const id = `term-${++this.nextId}`
    const shell = this.resolveShell(opts.shell)
    const args: string[] = []

    // If a command is specified, run it in the shell
    if (opts.command) {
      if (shell.includes('powershell') || shell.includes('pwsh')) {
        args.push('-NoExit', '-Command', opts.command)
      } else if (shell.includes('cmd')) {
        args.push('/K', opts.command)
      } else {
        args.push('-c', opts.command)
      }
    }

    // Limpiar variables que bloquean sesiones anidadas (Claude Code, etc.)
    const cleanEnv = { ...process.env, ...opts.env } as Record<string, string>
    delete cleanEnv.CLAUDECODE
    delete cleanEnv.CLAUDE_CODE_ENTRYPOINT

    const ptyProcess = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols: opts.cols || 80,
      rows: opts.rows || 24,
      cwd: opts.cwd || os.homedir(),
      env: cleanEnv
    })

    const instance: PtyInstance = { process: ptyProcess, id }
    this.terminals.set(id, instance)

    ptyProcess.onData((data) => {
      this.emit('data', id, data)
    })

    ptyProcess.onExit(({ exitCode }) => {
      this.emit('exit', id, exitCode)
      this.terminals.delete(id)
    })

    return id
  }

  write(id: string, data: string): void {
    this.terminals.get(id)?.process.write(data)
  }

  resize(id: string, cols: number, rows: number): void {
    const term = this.terminals.get(id)
    if (term && cols > 0 && rows > 0) {
      try {
        term.process.resize(cols, rows)
      } catch {
        // resize can throw if terminal already exited
      }
    }
  }

  kill(id: string): void {
    const term = this.terminals.get(id)
    if (term) {
      term.process.kill()
      this.terminals.delete(id)
    }
  }

  killAll(): void {
    for (const [id, term] of this.terminals) {
      term.process.kill()
    }
    this.terminals.clear()
  }

  getIds(): string[] {
    return Array.from(this.terminals.keys())
  }
}
