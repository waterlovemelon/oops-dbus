import { Edit3, Trash2, ArrowRight, Check } from 'lucide-react'
import type { RemoteConnection, ConnectionState } from '../../types/electron-api'

interface ConnectionCardProps {
  connection: RemoteConnection
  state?: ConnectionState
  onEdit: (conn: RemoteConnection) => void
  onDelete: (id: string) => void
  onConnect: (id: string) => void
  onDisconnect: (id: string) => void
}

export function ConnectionCard({ connection, state, onEdit, onDelete, onConnect, onDisconnect }: ConnectionCardProps) {
  const status = state?.status || 'disconnected'
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  const statusDotClass = isConnected
    ? 'bg-[#4ec9b0]'
    : status === 'error'
      ? 'bg-[#f44747]'
      : 'bg-[#858585]'

  return (
    <div className="rounded-md border border-[#3e3e3e] bg-[#2d2d2d] p-3 transition-[border-color] hover:border-[#4ec9b0]">
      {/* Top: name + actions */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass}`} />
          <span className="text-[13px] font-semibold text-[#e5e7eb]">{connection.name}</span>
        </div>
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100">
          <button
            onClick={() => onEdit(connection)}
            className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-[#858585] hover:bg-[#383838] hover:text-[#cccccc]"
          >
            <Edit3 className="h-3 w-3" />
            编辑
          </button>
          <button
            onClick={() => onDelete(connection.id)}
            className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-[#858585] hover:bg-[#5a1d1d] hover:text-[#f44747]"
          >
            <Trash2 className="h-3 w-3" />
            删除
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="min-w-[48px] shrink-0 text-[#858585]">地址</span>
          <span className="font-mono text-[#b5b5b5]">{connection.host}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="min-w-[48px] shrink-0 text-[#858585]">端口</span>
          <span className="font-mono text-[#b5b5b5]">{connection.port}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="min-w-[48px] shrink-0 text-[#858585]">用户</span>
          <span className="font-mono text-[#b5b5b5]">{connection.user}</span>
        </div>
      </div>

      {/* Error message */}
      {status === 'error' && state?.error && (
        <div className="mt-2 rounded bg-[#5a1d1d]/30 px-2 py-1 text-[11px] text-[#f44747]">
          {state.error}
        </div>
      )}

      {/* Bottom: type + connect button */}
      <div className="mt-2.5 flex items-center justify-between border-t border-[#3e3e3e] pt-2">
        <span className="rounded bg-[#1e1e1e] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#858585]">
          {connection.type}
        </span>
        {isConnected ? (
          <button
            onClick={() => onDisconnect(connection.id)}
            className="flex items-center gap-1 rounded border border-[#4ec9b0] px-3 py-1 text-[11px] text-[#4ec9b0] hover:bg-[#4ec9b0]/10"
          >
            <Check className="h-3 w-3" />
            已连接
          </button>
        ) : (
          <button
            onClick={() => onConnect(connection.id)}
            disabled={isConnecting}
            className="flex items-center gap-1 rounded bg-[#0e639c] px-3 py-1 text-[11px] text-white hover:bg-[#1177bb] disabled:opacity-50"
          >
            <ArrowRight className="h-3 w-3" />
            {isConnecting ? '连接中...' : status === 'error' ? '重试' : '连接'}
          </button>
        )}
      </div>
    </div>
  )
}
