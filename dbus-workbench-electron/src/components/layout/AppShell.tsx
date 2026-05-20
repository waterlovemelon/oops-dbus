/**
 * AppShell Component
 * Main application layout with resizable panels
 */

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { MethodPane } from '../workbench/MethodPane'
import { PropertyPane } from '../property/PropertyPane'
import { useAppStore } from '../../stores/appStore'

export function AppShell() {
  const { selectedNode, activeBus, clearSelectedMember } = useAppStore()

  const selectedMethod = selectedNode?.member?.type === 'method' ? selectedNode.member : null
  const selectedProperty = selectedNode?.member?.type === 'property' ? selectedNode.member : null

  const handleBackFromMember = () => {
    clearSelectedMember()
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden rounded-xl bg-background text-foreground">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Sidebar */}
          <Panel defaultSize={25} minSize={15} maxSize={40}>
            <Sidebar />
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Main Content Area */}
          <Panel defaultSize={75} minSize={30}>
            {selectedMethod ? (
              <MethodPane
                member={selectedMethod}
                busType={activeBus}
                onBack={handleBackFromMember}
              />
            ) : selectedProperty ? (
              <PropertyPane
                member={selectedProperty}
                busType={activeBus}
                onBack={handleBackFromMember}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted/30">
                {selectedNode ? (
                  <div className="text-center">
                    <h2 className="text-lg font-bold">{selectedNode.label}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedNode.type === 'member' && selectedNode.member
                        ? `${selectedNode.member.interfaceName} - ${selectedNode.member.type}`
                        : selectedNode.type}
                    </p>
                    {selectedNode.member && (
                      <div className="mt-4 rounded bg-background p-4 text-left">
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-medium">Path:</span>{' '}
                            {selectedNode.member.path}
                          </div>
                          <div>
                            <span className="font-medium">Interface:</span>{' '}
                            {selectedNode.member.interfaceName}
                          </div>
                          <div>
                            <span className="font-medium">Signature:</span>{' '}
                            {selectedNode.member.signature}
                          </div>
                          <div>
                            <span className="font-medium">Return:</span>{' '}
                            {selectedNode.member.returnType}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">D-Bus Workbench</h2>
                    <p className="mt-2 text-muted-foreground">
                      Select a service to explore
                    </p>
                  </div>
                )}
              </div>
            )}
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
