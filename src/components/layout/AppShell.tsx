/**
 * AppShell Component
 * Main application layout with resizable panels
 */

import { useEffect, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { MethodPane } from '../workbench/MethodPane'
import { PropertyPane } from '../property/PropertyPane'
import { SignalPane } from '../signal/SignalPane'
import { ServiceOverviewPane } from '../service/ServiceOverviewPane'
import { PathPane } from '../service/PathPane'
import { InterfacePane } from '../service/InterfacePane'
import { RemoteDrawer } from '../remote/RemoteDrawer'
import { useAppStore } from '../../stores/appStore'
import { useSettingsStore } from '../../stores/settingsStore'

export function AppShell() {
  const {
    selectedNode,
    selectedServiceName,
    activeBus,
    activeConnectionId,
    clearSelectedMember,
  } = useAppStore()
  const theme = useSettingsStore((s) => s.theme)
  const [remoteDrawerOpen, setRemoteDrawerOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const handleBack = () => {
    clearSelectedMember()
  }

  // Determine which pane to render
  const renderContent = () => {
    // A member is selected
    if (selectedNode?.type === 'member' && selectedNode.member) {
      const member = selectedNode.member

      switch (member.type) {
        case 'method':
          return (
            <MethodPane
              member={member}
              busType={activeBus}
              connectionId={activeConnectionId}
              onBack={handleBack}
            />
          )
        case 'signal':
          return (
            <SignalPane
              member={member}
              busType={activeBus}
              connectionId={activeConnectionId}
              onBack={handleBack}
            />
          )
        case 'property':
          return (
            <PropertyPane
              member={member}
              busType={activeBus}
              connectionId={activeConnectionId}
              onBack={handleBack}
            />
          )
      }
    }

    // A path node is selected
    if (selectedNode?.type === 'path') {
      return (
        <PathPane
          path={selectedNode.label}
          serviceName={selectedServiceName ?? ''}
          busType={activeBus}
          onBack={handleBack}
        />
      )
    }

    // An interface node is selected
    if (selectedNode?.type === 'interface') {
      return (
        <InterfacePane
          interfaceName={selectedNode.label}
          path={selectedNode.path ?? '/'}
          serviceName={selectedServiceName ?? ''}
          busType={activeBus}
          onBack={handleBack}
        />
      )
    }

    // A service is selected (but no specific member)
    if (selectedServiceName) {
      return (
        <ServiceOverviewPane
          serviceName={selectedServiceName}
          busType={activeBus}
          connectionId={activeConnectionId}
        />
      )
    }

    // Nothing selected
    return (
      <div className="flex h-full items-center justify-center bg-muted/30">
        <div className="text-center">
          <h2 className="text-xl font-bold">D-Bus Workbench</h2>
          <p className="mt-2 text-muted-foreground">Select a service to explore</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden rounded-xl bg-background text-foreground">
      {/* Top Bar */}
      <TopBar onOpenRemoteDrawer={() => setRemoteDrawerOpen(true)} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Sidebar */}
          <Panel defaultSize={40} minSize={20} maxSize={55}>
            <Sidebar />
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Main Content Area */}
          <Panel defaultSize={60} minSize={30}>
            {renderContent()}
          </Panel>
        </PanelGroup>
      </div>

      {/* Remote Connection Drawer */}
      <RemoteDrawer open={remoteDrawerOpen} onClose={() => setRemoteDrawerOpen(false)} />
    </div>
  )
}
