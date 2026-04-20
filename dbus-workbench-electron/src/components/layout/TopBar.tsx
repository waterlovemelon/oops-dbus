/**
 * TopBar Component
 * Custom title bar with window controls and bus selector
 */

import { RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { useAppStore } from '../../stores/appStore'

export function TopBar() {
  const { activeBus, setActiveBus } = useAppStore()

  return (
    <div className="flex h-8 items-center justify-between bg-secondary px-2">
      {/* Left: App title */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium">D-Bus Workbench</span>
      </div>

      {/* Center: Bus selector */}
      <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
        <button
          onClick={() => setActiveBus('session')}
          className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
            activeBus === 'session'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted-foreground/10'
          }`}
        >
          Session Bus
        </button>
        <button
          onClick={() => setActiveBus('system')}
          className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
            activeBus === 'system'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted-foreground/10'
          }`}
        >
          System Bus
        </button>
      </div>

      {/* Right: Window controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
        <button
          onClick={() => window.electronAPI.minimizeWindow()}
          className="h-6 w-6 rounded text-xs hover:bg-muted"
        >
          ─
        </button>
        <button
          onClick={() => window.electronAPI.maximizeWindow()}
          className="h-6 w-6 rounded text-xs hover:bg-muted"
        >
          □
        </button>
        <button
          onClick={() => window.electronAPI.closeWindow()}
          className="h-6 w-6 rounded text-xs hover:bg-destructive"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
