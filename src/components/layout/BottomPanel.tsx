/**
 * BottomPanel Component
 * Collapsible panel for displaying signal events
 */

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useSignalMonitor } from '../../hooks/useSignalMonitor'

export function BottomPanel() {
  const { bottomPanelCollapsed, toggleBottomPanel } = useSettingsStore()
  const { events, clearEvents } = useSignalMonitor()

  return (
    <div className="flex flex-col border-t border-border">
      {/* Panel Header */}
      <div className="flex h-7 items-center justify-between bg-surface-1 border-b border-border px-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-text-2">Signal Monitor</span>
          {!bottomPanelCollapsed && events.length > 0 && (
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-sm text-text-2">
              {events.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {!bottomPanelCollapsed && events.length > 0 && (
            <button
              onClick={clearEvents}
              className="h-5 px-1.5 rounded text-sm text-text-2 hover:bg-surface-2"
            >
              Clear
            </button>
          )}
          <button
            onClick={toggleBottomPanel}
            className="h-5 w-5 flex items-center justify-center rounded text-sm text-text-2 hover:bg-surface-2"
          >
            {bottomPanelCollapsed ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Panel Content */}
      {!bottomPanelCollapsed && (
        <div className="flex-1 overflow-y-auto p-1.5 bg-background">
          {events.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-text-2">
              No signal events received
            </div>
          ) : (
            <div className="space-y-1">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="rounded bg-surface-2 p-2 text-sm"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-success font-mono text-sm">
                      {event.signalName}
                    </span>
                    <span className="text-text-2 font-mono text-sm">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-text-2 text-sm">
                    {event.interfaceName}
                  </div>
                  {event.args.length > 0 && (
                    <div className="mt-0.5 font-mono text-sm text-text-0">
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
