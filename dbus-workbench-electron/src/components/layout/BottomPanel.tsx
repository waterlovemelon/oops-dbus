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
    <div className="flex flex-col border-t border-[#3e3e3e]">
      {/* Panel Header */}
      <div className="flex h-7 items-center justify-between bg-[#252526] border-b border-[#3e3e3e] px-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#858585]">Signal Monitor</span>
          {!bottomPanelCollapsed && events.length > 0 && (
            <span className="rounded bg-[#2d2d2d] px-1.5 py-0.5 text-[11px] text-[#858585]">
              {events.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {!bottomPanelCollapsed && events.length > 0 && (
            <button
              onClick={clearEvents}
              className="h-5 px-1.5 rounded text-[11px] text-[#858585] hover:bg-[#383838]"
            >
              Clear
            </button>
          )}
          <button
            onClick={toggleBottomPanel}
            className="h-5 w-5 flex items-center justify-center rounded text-[11px] text-[#858585] hover:bg-[#383838]"
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
        <div className="flex-1 overflow-y-auto p-1.5 bg-[#1e1e1e]">
          {events.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-[#858585]">
              No signal events received
            </div>
          ) : (
            <div className="space-y-1">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="rounded bg-[#2d2d2d] p-2 text-[11px]"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-[#4ec9b0] font-mono text-[11px]">
                      {event.signalName}
                    </span>
                    <span className="text-[#858585] font-mono text-[11px]">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[#858585] text-[11px]">
                    {event.interfaceName}
                  </div>
                  {event.args.length > 0 && (
                    <div className="mt-0.5 font-mono text-[11px] text-[#cccccc]">
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
