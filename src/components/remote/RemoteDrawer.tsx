import { useState } from 'react'
import { X, Plus, Zap } from 'lucide-react'
import { useConnectionStore } from '../../stores/connectionStore'
import { ConnectionCard } from './ConnectionCard'
import { ConnectionDialog } from './ConnectionDialog'
import type { RemoteConnection } from '../../types/electron-api'

interface RemoteDrawerProps {
  open: boolean
  onClose: () => void
}

export function RemoteDrawer({ open, onClose }: RemoteDrawerProps) {
  const {
    connections,
    connectionStates,
    addConnection,
    updateConnection,
    removeConnection,
    connect,
    disconnect,
  } = useConnectionStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<RemoteConnection | null>(null)

  const handleEdit = (conn: RemoteConnection) => {
    setEditingConnection(conn)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    removeConnection(id)
  }

  const handleSave = (conn: RemoteConnection) => {
    if (editingConnection) {
      updateConnection(conn)
    } else {
      addConnection(conn)
    }
    setEditingConnection(null)
  }

  const handleAddNew = () => {
    setEditingConnection(null)
    setDialogOpen(true)
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[300] bg-black/40 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed bottom-0 right-0 top-[36px] z-[301] flex w-[420px] flex-col border-l border-border bg-surface-1 shadow-[-8px_0_32px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text-0">
            <Zap className="h-4 w-4 text-success" />
            远程连接
          </h2>
          <button onClick={onClose} className="rounded p-1 text-text-2 hover:bg-surface-2 hover:text-text-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-2">
            {connections.map((conn) => (
              <ConnectionCard
                key={conn.id}
                connection={conn}
                state={connectionStates[conn.id]}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onConnect={connect}
                onDisconnect={disconnect}
              />
            ))}

            {/* Add button */}
            <button
              onClick={handleAddNew}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-2.5 text-sm text-text-2 transition-all hover:border-success hover:text-success hover:bg-success/5"
            >
              <Plus className="h-3.5 w-3.5" />
              新增远程连接
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <ConnectionDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingConnection(null)
        }}
        onSave={handleSave}
        editingConnection={editingConnection}
      />
    </>
  )
}
