/**
 * BottomPanel Component
 * Collapsible panel for displaying signal events
 */

import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { useSettingsStore } from '../../stores/settingsStore'
import { useSignalMonitor } from '../../hooks/useSignalMonitor'

export function BottomPanel() {
  const { bottomPanelCollapsed, toggleBottomPanel } = useSettingsStore()
  const { events, clearEvents } = useSignalMonitor()

  return (
    <div className="flex flex-col border-t border-border">
      {/* Panel Header */}
      <div className="flex h-8 items-center justify-between bg-secondary px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Signal Monitor</span>
          {!bottomPanelCollapsed && events.length > 0 && (
            <span className="rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
              {events.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!bottomPanelCollapsed && events.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={clearEvents}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={toggleBottomPanel}
          >
            {bottomPanelCollapsed ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Panel Content */}
      {!bottomPanelCollapsed && (
        <div className="h-48 overflow-y-auto bg-muted/30 p-2">
          {events.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No signal events received
            </div>
          ) : (
            <div className="space-y-1">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="rounded bg-background p-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-primary">
                      {event.signalName}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    {event.interfaceName}
                  </div>
                  {event.args.length > 0 && (
                    <div className="mt-1 font-mono text-xs">
                      {JSON.stringify(event.args)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
