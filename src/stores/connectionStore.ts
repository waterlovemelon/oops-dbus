import { create } from 'zustand'
import type { ConnectionState, ConnectionStatus, RemoteConnection } from '../types/electron-api'
import { ipcClient } from '../ipc/ipcClient'

interface ConnectionStore {
  connections: RemoteConnection[]
  connectionStates: Record<string, ConnectionState>

  loadConnections: () => Promise<void>
  addConnection: (conn: RemoteConnection) => Promise<void>
  updateConnection: (conn: RemoteConnection) => Promise<void>
  removeConnection: (id: string) => Promise<void>
  connect: (id: string) => Promise<void>
  disconnect: (id: string) => Promise<void>
  updateConnectionState: (state: ConnectionState) => void
  initStatusListener: () => void
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  connections: [],
  connectionStates: {},

  loadConnections: async () => {
    const connections = await ipcClient.sshListConnections()
    set({ connections })
  },

  addConnection: async (conn) => {
    const connections = await ipcClient.sshCreateConnection(conn)
    set({ connections })
  },

  updateConnection: async (conn) => {
    const connections = await ipcClient.sshUpdateConnection(conn)
    set({ connections })
  },

  removeConnection: async (id) => {
    await ipcClient.sshDeleteConnection(id)
    set((state) => {
      const { [id]: _, ...rest } = state.connectionStates
      return {
        connections: state.connections.filter((c) => c.id !== id),
        connectionStates: rest,
      }
    })
  },

  connect: async (id) => {
    set((state) => ({
      connectionStates: {
        ...state.connectionStates,
        [id]: { id, status: 'connecting' as ConnectionStatus },
      },
    }))
    const result = await ipcClient.sshConnect(id)
    set((state) => ({
      connectionStates: {
        ...state.connectionStates,
        [id]: result,
      },
    }))
  },

  disconnect: async (id) => {
    await ipcClient.sshDisconnect(id)
    set((state) => ({
      connectionStates: {
        ...state.connectionStates,
        [id]: { id, status: 'disconnected' as ConnectionStatus },
      },
    }))
  },

  updateConnectionState: (connState) => {
    set((state) => ({
      connectionStates: {
        ...state.connectionStates,
        [connState.id]: connState,
      },
    }))
  },

  initStatusListener: () => {
    ipcClient.onSSHConnectionStatus((state) => {
      get().updateConnectionState(state)
    })
  },
}))
