import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { RemoteConnection } from '../../types/electron-api'

interface ConnectionDialogProps {
  open: boolean
  onClose: () => void
  onSave: (conn: RemoteConnection) => void
  editingConnection?: RemoteConnection | null
}

export function ConnectionDialog({ open, onClose, onSave, editingConnection }: ConnectionDialogProps) {
  const [name, setName] = useState('')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('22')
  const [user, setUser] = useState('')
  const [authType, setAuthType] = useState<'key' | 'password'>('key')
  const [keyPath, setKeyPath] = useState('')
  const [password, setPassword] = useState('')
  const [dbusSocketPath, setDbusSocketPath] = useState('')

  useEffect(() => {
    if (open) {
      if (editingConnection) {
        setName(editingConnection.name)
        setHost(editingConnection.host)
        setPort(String(editingConnection.port))
        setUser(editingConnection.user)
        setAuthType(editingConnection.authType)
        setKeyPath(editingConnection.keyPath || '')
        setPassword(editingConnection.password || '')
        setDbusSocketPath(editingConnection.dbusSocketPath || '')
      } else {
        setName('')
        setHost('')
        setPort('22')
        setUser('')
        setAuthType('key')
        setKeyPath('')
        setPassword('')
        setDbusSocketPath('')
      }
    }
  }, [open, editingConnection])

  const handleSave = () => {
    const conn: RemoteConnection = {
      id: editingConnection?.id || crypto.randomUUID(),
      name: name || `${user}@${host}`,
      type: 'ssh',
      host,
      port: parseInt(port, 10) || 22,
      user,
      authType,
      keyPath: authType === 'key' ? keyPath : undefined,
      password: authType === 'password' ? password : undefined,
      dbusSocketPath: dbusSocketPath || undefined,
    }
    onSave(conn)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-[380px] rounded-lg border border-border bg-surface-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-0">
            {editingConnection ? '编辑远程连接' : '新增远程连接'}
          </h3>
          <button onClick={onClose} className="rounded p-1 text-text-2 hover:bg-surface-2 hover:text-text-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3.5 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm uppercase tracking-wider text-text-2">连接名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：生产环境 - 应用服务器"
              className="rounded border border-border bg-surface-0 px-2.5 py-2 font-mono text-sm text-text-0 outline-none focus:border-info"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm uppercase tracking-wider text-text-2">连接类型</label>
            <select
              value="ssh"
              disabled
              className="cursor-pointer rounded border border-border bg-surface-0 px-2.5 py-2 font-mono text-sm text-text-0 outline-none focus:border-info"
            >
              <option value="ssh">SSH</option>
            </select>
          </div>

          <div className="flex gap-2.5">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm uppercase tracking-wider text-text-2">主机地址</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="192.168.1.100"
                className="rounded border border-border bg-surface-0 px-2.5 py-2 font-mono text-sm text-text-0 outline-none focus:border-info"
              />
            </div>
            <div className="flex w-20 flex-col gap-1">
              <label className="text-sm uppercase tracking-wider text-text-2">端口</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="22"
                className="rounded border border-border bg-surface-0 px-2.5 py-2 font-mono text-sm text-text-0 outline-none focus:border-info"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm uppercase tracking-wider text-text-2">用户名</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="root"
              className="rounded border border-border bg-surface-0 px-2.5 py-2 font-mono text-sm text-text-0 outline-none focus:border-info"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm uppercase tracking-wider text-text-2">认证方式</label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as 'key' | 'password')}
              className="cursor-pointer rounded border border-border bg-surface-0 px-2.5 py-2 font-mono text-sm text-text-0 outline-none focus:border-info"
            >
              <option value="key">SSH 密钥</option>
              <option value="password">密码</option>
            </select>
          </div>

          {authType === 'key' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm uppercase tracking-wider text-text-2">密钥路径</label>
              <input
                type="text"
                value={keyPath}
                onChange={(e) => setKeyPath(e.target.value)}
                placeholder="~/.ssh/id_rsa"
                className="rounded border border-border bg-surface-0 px-2.5 py-2 font-mono text-sm text-text-0 outline-none focus:border-info"
              />
              <span className="text-[11px] text-text-2">留空则使用默认密钥</span>
            </div>
          )}

          {authType === 'password' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm uppercase tracking-wider text-text-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                className="rounded border border-border bg-surface-0 px-2.5 py-2 font-mono text-sm text-text-0 outline-none focus:border-info"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm uppercase tracking-wider text-text-2">D-Bus Socket 路径 (可选)</label>
            <input
              type="text"
              value={dbusSocketPath}
              onChange={(e) => setDbusSocketPath(e.target.value)}
              placeholder="自动检测"
              className="rounded border border-border bg-surface-0 px-2.5 py-2 font-mono text-sm text-text-0 outline-none focus:border-info"
            />
            <span className="text-[11px] text-text-2">留空则自动检测远程 D-Bus socket</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button
            onClick={onClose}
            className="rounded bg-surface-2 px-4 py-1.5 text-sm text-text-0 hover:bg-surface-3"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!host || !user}
            className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
