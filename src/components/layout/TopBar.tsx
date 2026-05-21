/**
 * TopBar Component
 * Custom title bar with window controls and bus selector
 */

import { useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'

interface TopBarProps {
  onOpenRemoteDrawer?: () => void
}

export function TopBar({ onOpenRemoteDrawer }: TopBarProps) {
  const { activeBus, setActiveBus } = useAppStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const menuItems = [
    { label: '设置', action: () => {} },
    { label: '远程连接', action: () => onOpenRemoteDrawer?.() },
    { label: '主题', action: () => {} },
    { label: '关于', action: () => {} },
  ]

  return (
    <div
      className="flex h-[36px] items-center justify-between bg-[#252526] border-b border-[#3e3e3e] px-2"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: App title */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#858585]">D-Bus Workbench</span>
      </div>

      {/* Center: Bus selector */}
      <div
        className="flex items-center gap-0.5 rounded bg-[#2d2d2d] p-0.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => setActiveBus('session')}
          className={`rounded px-2.5 py-0.5 text-[11px] transition-colors ${
            activeBus === 'session'
              ? 'bg-[#4ec9b0] text-[#1e1e1e]'
              : 'text-[#858585] hover:bg-[#383838]'
          }`}
        >
          Session
        </button>
        <button
          onClick={() => setActiveBus('system')}
          className={`rounded px-2.5 py-0.5 text-[11px] transition-colors ${
            activeBus === 'system'
              ? 'bg-[#4ec9b0] text-[#1e1e1e]'
              : 'text-[#858585] hover:bg-[#383838]'
          }`}
        >
          System
        </button>
      </div>

      {/* Right: Menu + Window controls */}
      <div
        className="flex items-center gap-0.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Settings menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="h-7 w-7 flex items-center justify-center rounded text-[#858585] hover:bg-[#383838] transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 rounded-md border border-[#3e3e3e] bg-[#2d2d2d] py-1 shadow-lg z-50">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.action()
                    setMenuOpen(false)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                    item.label === '远程连接'
                      ? 'text-[#4ec9b0] hover:bg-[#383838]'
                      : 'text-[#cccccc] hover:bg-[#383838]'
                  }`}
                >
                  {item.label === '远程连接' ? `▶ ${item.label}` : item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Window controls */}
        <button
          onClick={() => window.electronAPI.minimizeWindow()}
          className="h-7 w-7 flex items-center justify-center rounded text-[11px] text-[#858585] hover:bg-[#383838]"
        >
          _
        </button>
        <button
          onClick={() => window.electronAPI.maximizeWindow()}
          className="h-7 w-7 flex items-center justify-center rounded text-[11px] text-[#858585] hover:bg-[#383838]"
        >
          □
        </button>
        <button
          onClick={() => window.electronAPI.closeWindow()}
          className="h-7 w-7 flex items-center justify-center rounded text-[11px] text-[#858585] hover:bg-[#f44747] hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  )
}
