import React, { useEffect, useRef, useState, useCallback } from 'react'
import { WebToolbar } from './WebToolbar'

interface WebPanelProps {
  nodeId: string
  url?: string
  partition?: string
  serviceId?: string
}

export function WebPanel({ nodeId, url, partition, serviceId }: WebPanelProps) {
  const ghostRef = useRef<HTMLDivElement>(null)
  const viewIdRef = useRef<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState(url || '')
  const [title, setTitle] = useState('')
  const [authBanner, setAuthBanner] = useState(false)
  const [importBanner, setImportBanner] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [importing, setImporting] = useState(false)
  const rafRef = useRef<number>(0)

  const syncBounds = useCallback(() => {
    if (!ghostRef.current || !viewIdRef.current) return

    const rect = ghostRef.current.getBoundingClientRect()
    window.api.webview.setBounds(viewIdRef.current, {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    })
  }, [])

  useEffect(() => {
    if (!url) return

    window.api.webview
      .create({ url, partition: partition || `persist:${serviceId || nodeId}` })
      .then((id: string) => {
        viewIdRef.current = id

        // Sync bounds initially
        setTimeout(syncBounds, 100)

        // Listen for title/URL changes
        const unsubTitle = window.api.webview.onTitleChanged(id, (t: string) => {
          setTitle(t)
        })
        const unsubUrl = window.api.webview.onUrlChanged(id, (u: string) => {
          setCurrentUrl(u)
        })
        // Listen for external auth (Google opens in system browser)
        const unsubAuth = window.api.webview.onExternalAuth(id, () => {
          setAuthBanner(true)
          // Auto-hide after 12 seconds
          setTimeout(() => setAuthBanner(false), 12000)
        })

        return () => {
          unsubTitle()
          unsubUrl()
          unsubAuth()
        }
      })

    // ResizeObserver for bounds sync
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(syncBounds)
    })
    if (ghostRef.current) {
      observer.observe(ghostRef.current)
    }

    // Also sync on scroll/resize events
    const handleResize = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(syncBounds)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(rafRef.current)
      if (viewIdRef.current) {
        window.api.webview.destroy(viewIdRef.current)
      }
    }
  }, [url])

  // Sync bounds whenever the panel might have moved (tab selection, split)
  useEffect(() => {
    const interval = setInterval(syncBounds, 500)
    return () => clearInterval(interval)
  }, [syncBounds])

  const handleNavigate = (newUrl: string) => {
    if (viewIdRef.current) {
      window.api.webview.navigate(viewIdRef.current, newUrl)
    }
  }

  const handleBack = () => {
    if (viewIdRef.current) window.api.webview.goBack(viewIdRef.current)
  }

  const handleForward = () => {
    if (viewIdRef.current) window.api.webview.goForward(viewIdRef.current)
  }

  const handleReload = () => {
    if (viewIdRef.current) window.api.webview.reload(viewIdRef.current)
    setAuthBanner(false)
    setImportBanner(null)
  }

  const handleOpenExternal = () => {
    if (currentUrl) {
      window.api.browser.openExternal(currentUrl)
    }
  }

  const handleImportSession = async () => {
    if (!viewIdRef.current) return
    setImporting(true)
    setImportBanner(null)

    try {
      const result = await window.api.browser.importSession(viewIdRef.current)
      setImportBanner({
        type: 'success',
        message: `${result.imported} cookies importadas desde ${result.browser}. Recargando...`
      })
      // Auto-reload after importing
      setTimeout(() => {
        if (viewIdRef.current) {
          window.api.webview.reload(viewIdRef.current)
        }
        setTimeout(() => setImportBanner(null), 3000)
      }, 500)
    } catch (err: any) {
      setImportBanner({
        type: 'error',
        message: err?.message || 'Error al importar sesion'
      })
      setTimeout(() => setImportBanner(null), 6000)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WebToolbar
        url={currentUrl}
        title={title}
        serviceId={serviceId}
        onNavigate={handleNavigate}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onOpenExternal={handleOpenExternal}
        onImportSession={handleImportSession}
        importing={importing}
      />
      {authBanner && (
        <div style={{
          background: 'rgba(204, 119, 34, 0.15)',
          borderBottom: '1px solid var(--accent-amber)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--accent-amber)',
          zIndex: 10
        }}>
          <span style={{ fontWeight: 700, letterSpacing: 1 }}>ACCESO EXTERNO</span>
          <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
            Se abrio una ventana de login. Cuando termines, pulsa Recargar.
          </span>
          <button
            onClick={handleReload}
            style={{
              background: 'var(--accent-amber)',
              color: '#000',
              border: 'none',
              padding: '4px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Recargar
          </button>
          <button
            onClick={() => setAuthBanner(false)}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              padding: '4px 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              cursor: 'pointer'
            }}
          >
            X
          </button>
        </div>
      )}
      {importBanner && (
        <div style={{
          background: importBanner.type === 'success'
            ? 'rgba(51, 255, 51, 0.1)'
            : 'rgba(255, 34, 0, 0.1)',
          borderBottom: `1px solid ${importBanner.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: importBanner.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
          zIndex: 10
        }}>
          <span style={{ fontWeight: 700, letterSpacing: 1 }}>
            {importBanner.type === 'success' ? 'SESION IMPORTADA' : 'ERROR'}
          </span>
          <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
            {importBanner.message}
          </span>
          <button
            onClick={() => setImportBanner(null)}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              padding: '4px 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              cursor: 'pointer'
            }}
          >
            X
          </button>
        </div>
      )}
      <div
        ref={ghostRef}
        style={{
          flex: 1,
          background: 'var(--bg-primary)',
          position: 'relative'
        }}
      >
        {/* Ghost div - WebContentsView is overlaid on top by main process */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 12
          }}
        >
          {!viewIdRef.current && 'Cargando...'}
        </div>
      </div>
    </div>
  )
}
