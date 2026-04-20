/**
 * IPC Client
 * Type-safe wrapper for all Electron IPC communication
 */

import type {
  BusType,
  DbusMemberInfo,
  DbusMethodResult,
  InvokeMethodParams,
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
  listServices: async (busType: BusType): Promise<string[]> => {
    try {
      const services = await window.electronAPI.listServices(busType)
      return services
    } catch (error) {
      console.error('Failed to list services:', error)
      throw new Error(`Failed to list D-Bus services: ${error instanceof Error ? error.message : String(error)}`)
    }
  },

  introspectServiceMembers: async (serviceName: string, busType: BusType): Promise<DbusMemberInfo[]> => {
    try {
      const members = await window.electronAPI.introspectServiceMembers(serviceName, busType)
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
}
