/**
 * AppShell Component
 * Main application layout with resizable panels
 */

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { BottomPanel } from './BottomPanel'
import { MethodPane } from '../workbench/MethodPane'
import { useAppStore } from '../../stores/appStore'

export function AppShell() {
  const { selectedNode, activeBus, clearSelectedMember } = useAppStore()

  const selectedMethod = selectedNode?.member?.type === 'method' ? selectedNode.member : null

  const handleBackFromMethod = () => {
    clearSelectedMember()
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <PanelGroup direction="vertical">
          {/* Top Panel: Sidebar + Content */}
          <Panel defaultSize={70} minSize={30}>
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
                  // Show MethodPane when a method is selected
                  <MethodPane
                    member={selectedMethod}
                    busType={activeBus}
                    onBack={handleBackFromMethod}
                  />
                ) : (
                  // Default placeholder
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
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Bottom Panel: Signal Monitor */}
          <Panel defaultSize={30} minSize={0} maxSize={50}>
            <BottomPanel />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
