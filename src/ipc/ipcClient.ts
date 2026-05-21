/**
 * IPC Client
 * Type-safe wrapper for all Electron IPC communication
 */

import type {
  BusType,
  ConnectionState,
  DbusMemberInfo,
  DbusMethodResult,
  GetAllPropertiesParams,
  GetPropertyParams,
  InvokeMethodParams,
  RemoteConnection,
  SetPropertyParams,
  SignalEvent,
  SignalSubscriptionParams,
} from '../types/electron-api'

/**
 * IPC Client provides type-safe methods for communicating with the main process
 */
export const ipcClient = {
  // Window controls
  minimizeWindow: (): void => {
    window.electronAPI.minimizeWindow()
  },

  maximizeWindow: (): void => {
    window.electronAPI.maximizeWindow()
  },

  closeWindow: (): void => {
    window.electronAPI.closeWindow()
  },

  isMaximized: (): boolean => {
    return window.electronAPI.isMaximized()
  },

  // ServiceExplorer
  listServices: async (busType: BusType, connectionId?: string): Promise<string[]> => {
    try {
      const services = await window.electronAPI.listServices(busType, connectionId)
      return services
    } catch (error) {
      console.error('Failed to list services:', error)
      throw new Error(`Failed to list D-Bus services: ${error instanceof Error ? error.message : String(error)}`)
    }
  },

  introspectServiceMembers: async (serviceName: string, busType: BusType, connectionId?: string): Promise<DbusMemberInfo[]> => {
    try {
      const members = await window.electronAPI.introspectServiceMembers(serviceName, busType, connectionId)
      return members
    } catch (error) {
      console.error('Failed to introspect service:', error)
      throw new Error(`Failed to introspect service ${serviceName}: ${error instanceof Error ? error.message : String(error)}`)
    }
  },

  // MethodInvoker
  invokeMethod: async (params: InvokeMethodParams): Promise<DbusMethodResult> => {
    try {
      const result = await window.electronAPI.invokeMethod(params)
      return result
    } catch (error) {
      console.error('Failed to invoke method:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },

  // SignalMonitor
  subscribeSignal: async (params: SignalSubscriptionParams): Promise<void> => {
    try {
      await window.electronAPI.subscribeSignal(params)
    } catch (error) {
      console.error('Failed to subscribe signal:', error)
      throw new Error(`Failed to subscribe to signal ${params.signalName}: ${error instanceof Error ? error.message : String(error)}`)
    }
  },

  unsubscribeSignal: async (params: SignalSubscriptionParams): Promise<void> => {
    try {
      await window.electronAPI.unsubscribeSignal(params)
    } catch (error) {
      console.error('Failed to unsubscribe signal:', error)
      throw new Error(`Failed to unsubscribe from signal ${params.signalName}: ${error instanceof Error ? error.message : String(error)}`)
    }
  },

  // Signal event listener
  onSignalReceived: (callback: (event: SignalEvent) => void): void => {
    window.electronAPI.onSignalReceived(callback)
  },

  removeSignalListener: (): void => {
    window.electronAPI.removeSignalListener()
  },

  // PropertyAccessor
  getProperty: async (params: GetPropertyParams): Promise<DbusMethodResult> => {
    try {
      const result = await window.electronAPI.getProperty(params)
      return result
    } catch (error) {
      console.error('Failed to get property:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },

  setProperty: async (params: SetPropertyParams): Promise<DbusMethodResult> => {
    try {
      const result = await window.electronAPI.setProperty(params)
      return result
    } catch (error) {
      console.error('Failed to set property:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },

  getAllProperties: async (params: GetAllPropertiesParams): Promise<DbusMethodResult> => {
    try {
      const result = await window.electronAPI.getAllProperties(params)
      return result
    } catch (error) {
      console.error('Failed to get all properties:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },

  // SSH Remote Connection
  sshListConnections: async (): Promise<RemoteConnection[]> => {
    return window.electronAPI.sshListConnections()
  },

  sshCreateConnection: async (conn: RemoteConnection): Promise<RemoteConnection[]> => {
    return window.electronAPI.sshCreateConnection(conn)
  },

  sshUpdateConnection: async (conn: RemoteConnection): Promise<RemoteConnection[]> => {
    return window.electronAPI.sshUpdateConnection(conn)
  },

  sshDeleteConnection: async (id: string): Promise<RemoteConnection[]> => {
    return window.electronAPI.sshDeleteConnection(id)
  },

  sshConnect: async (id: string): Promise<ConnectionState> => {
    return window.electronAPI.sshConnect(id)
  },

  sshDisconnect: async (id: string): Promise<ConnectionState> => {
    return window.electronAPI.sshDisconnect(id)
  },

  sshGetAllConnectionStates: async (): Promise<ConnectionState[]> => {
    return window.electronAPI.sshGetAllConnectionStates()
  },

  onSSHConnectionStatus: (callback: (state: ConnectionState) => void): void => {
    window.electronAPI.onSSHConnectionStatus(callback)
  },

  removeSSHStatusListener: (): void => {
    window.electronAPI.removeSSHStatusListener()
  },
}
