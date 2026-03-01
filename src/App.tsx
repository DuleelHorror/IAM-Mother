import React, { useEffect, useState } from 'react'
import { TilingContainer } from './components/layout/TilingContainer'
import { WorkspaceBar } from './components/layout/WorkspaceBar'
import { StatusBar } from './components/layout/StatusBar'
import { ServiceList } from './components/sidebar/ServiceList'
import { TitleBar } from './components/layout/TitleBar'
import { ShortcutsModal } from './components/layout/ShortcutsModal'
import { TokenAlert } from './components/layout/TokenAlert'
import { useLayoutStore } from './stores/layoutStore'
import { useServiceStore } from './stores/serviceStore'
import { useTrackingStore } from './stores/trackingStore'
import { useSettingsStore } from './stores/settingsStore'

export default function App() {
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen)
  const addPanel = useLayoutStore((s) => s.addPanel)
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar)
  const loadServices = useServiceStore((s) => s.loadServices)
  const loadAllUsage = useTrackingStore((s) => s.loadAllUsage)
  const listenForUpdates = useTrackingStore((s) => s.listenForUpdates)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const loadPresets = useLayoutStore((s) => s.loadPresets)

  const [showShortcuts, setShowShortcuts] = useState(false)
  const [tokenAlert, setTokenAlert] = useState<{
    serviceId: string
    serviceName: string
    percentage: number
  } | null>(null)
  const [dismissedAlerts] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    loadSettings()
    loadServices()
    loadAllUsage()
    loadPresets()
    const unsubTracking = listenForUpdates()

    // Load saved layout (workspaces)
    window.api.persistence.getLayout().then((saved: any) => {
      if (saved) {
        const store = useLayoutStore.getState()
        // Nuevo formato con workspaces
        if (saved.workspaces) {
          store.loadAllWorkspacesJson(saved)
        } else {
          // Formato antiguo (solo un layout) - migrar
          store.loadModelJson(saved)
        }
      }
    })

    // Listen for keyboard shortcuts from main process
    const unsubShortcuts = (window.api as any).app.onShortcut((action: string) => {
      const store = useLayoutStore.getState()
      switch (action) {
        case 'new-terminal':
          store.addPanel('Terminal', 'terminal', {})
          break
        case 'close-tab':
          // Handled by FlexLayout's built-in close
          break
        case 'toggle-sidebar':
          store.toggleSidebar()
          break
        case 'new-web-panel':
          store.addPanel('Web', 'web', { url: 'https://chat.openai.com' })
          break
        case 'show-shortcuts':
          setShowShortcuts((prev) => !prev)
          break
      }
    })

    return () => {
      unsubTracking()
      unsubShortcuts()
    }
  }, [])

  // Token alert subscription
  useEffect(() => {
    const unsub = useTrackingStore.subscribe((state) => {
      const services = useServiceStore.getState().services
      for (const [serviceId, data] of Object.entries(state.usage)) {
        if (data.contextWindowMax <= 0) continue
        const pct = (data.contextWindowUsed / data.contextWindowMax) * 100
        if (pct > 80 && !dismissedAlerts.has(serviceId)) {
          const svc = services.find((s) => s.id === serviceId)
          setTokenAlert({
            serviceId,
            serviceName: svc?.name || serviceId,
            percentage: pct
          })
          break
        }
      }
    })
    return unsub
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TitleBar />
      <WorkspaceBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {sidebarOpen && <ServiceList />}
        <TilingContainer />
      </div>
      <StatusBar />

      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {tokenAlert && (
        <TokenAlert
          serviceId={tokenAlert.serviceId}
          serviceName={tokenAlert.serviceName}
          percentage={tokenAlert.percentage}
          onDismiss={() => {
            dismissedAlerts.add(tokenAlert.serviceId)
            setTokenAlert(null)
          }}
        />
      )}
    </div>
  )
}
