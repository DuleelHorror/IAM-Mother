import React, { useEffect } from 'react'
import { TilingContainer } from './components/layout/TilingContainer'
import { WorkspaceBar } from './components/layout/WorkspaceBar'
import { StatusBar } from './components/layout/StatusBar'
import { ServiceList } from './components/sidebar/ServiceList'
import { TitleBar } from './components/layout/TitleBar'
import { useLayoutStore } from './stores/layoutStore'
import { useServiceStore } from './stores/serviceStore'
import { useTrackingStore } from './stores/trackingStore'

export default function App() {
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen)
  const addPanel = useLayoutStore((s) => s.addPanel)
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar)
  const loadServices = useServiceStore((s) => s.loadServices)
  const loadAllUsage = useTrackingStore((s) => s.loadAllUsage)
  const listenForUpdates = useTrackingStore((s) => s.listenForUpdates)

  useEffect(() => {
    loadServices()
    loadAllUsage()
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
      }
    })

    return () => {
      unsubTracking()
      unsubShortcuts()
    }
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
    </div>
  )
}
