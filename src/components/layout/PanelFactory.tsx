import React from 'react'
import { TabNode } from 'flexlayout-react'
import { TerminalPanel } from '../terminal/TerminalPanel'
import { WebPanel } from '../webview/WebPanel'
import { AIDashboard } from '../dashboard/AIDashboard'
import { SubscriptionPanel } from '../dashboard/SubscriptionPanel'
import { WelcomePanel } from './WelcomePanel'

interface PanelFactoryProps {
  node: TabNode
}

export function PanelFactory({ node }: PanelFactoryProps) {
  const component = node.getComponent()
  const config = node.getConfig() || {}

  switch (component) {
    case 'terminal':
      return (
        <TerminalPanel
          nodeId={node.getId()}
          shell={config.shell}
          command={config.command}
          serviceId={config.serviceId}
        />
      )
    case 'web':
      return (
        <WebPanel
          nodeId={node.getId()}
          url={config.url}
          partition={config.partition}
          serviceId={config.serviceId}
        />
      )
    case 'dashboard':
      return <AIDashboard serviceId={config.serviceId} />
    case 'welcome':
      return <WelcomePanel />
    case 'subscriptions':
      return <SubscriptionPanel />
    default:
      return (
        <div style={{ padding: 16, color: 'var(--text-secondary)' }}>
          Unknown panel type: {component}
        </div>
      )
  }
}
