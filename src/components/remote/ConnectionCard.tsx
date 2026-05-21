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
    ? 'bg-success'
    : status === 'error'
      ? 'bg-error'
      : 'bg-text-2'

  return (
    <div className="rounded-md border border-border bg-surface-2 p-3 transition-[border-color] hover:border-success">
      {/* Top: name + actions */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass}`} />
          <span className="text-[13px] font-semibold text-text-0">{connection.name}</span>
        </div>
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100">
          <button
            onClick={() => onEdit(connection)}
            className="flex items-center gap-1 rounded px-1.5 py-1 text-sm text-text-2 hover:bg-surface-3 hover:text-text-0"
          >
            <Edit3 className="h-3 w-3" />
            编辑
          </button>
          <button
            onClick={() => onDelete(connection.id)}
            className="flex items-center gap-1 rounded px-1.5 py-1 text-sm text-text-2 hover:bg-error/10 hover:text-error"
          >
            <Trash2 className="h-3 w-3" />
            删除
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="min-w-[48px] shrink-0 text-text-2">地址</span>
          <span className="font-mono text-text-1">{connection.host}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="min-w-[48px] shrink-0 text-text-2">端口</span>
          <span className="font-mono text-text-1">{connection.port}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="min-w-[48px] shrink-0 text-text-2">用户</span>
          <span className="font-mono text-text-1">{connection.user}</span>
        </div>
      </div>

      {/* Error message */}
      {status === 'error' && state?.error && (
        <div className="mt-2 rounded bg-error/10 px-2 py-1 text-sm text-error">
          {state.error}
        </div>
      )}

      {/* Bottom: type + connect button */}
      <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2">
        <span className="rounded bg-surface-0 px-2 py-0.5 text-[11px] uppercase tracking-wider text-text-2">
          {connection.type}
        </span>
        {isConnected ? (
          <button
            onClick={() => onDisconnect(connection.id)}
            className="flex items-center gap-1 rounded border border-success px-3 py-1 text-sm text-success hover:bg-success/10"
          >
            <Check className="h-3 w-3" />
            已连接
          </button>
        ) : (
          <button
            onClick={() => onConnect(connection.id)}
            disabled={isConnecting}
            className="flex items-center gap-1 rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <ArrowRight className="h-3 w-3" />
            {isConnecting ? '连接中...' : status === 'error' ? '重试' : '连接'}
          </button>
        )}
      </div>
    </div>
  )
}
