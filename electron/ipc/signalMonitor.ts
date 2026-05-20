import { ipcMain, BrowserWindow } from 'electron'
import { SignalMonitor } from '../dbus/SignalMonitor'
import type { SubscribeSignalParams, UnsubscribeSignalParams } from './types'

const signalMonitor = new SignalMonitor()

/**
 * Register IPC handlers for SignalMonitor
 */
export function registerSignalMonitorHandlers() {
  // Subscribe to signal
  ipcMain.handle('dbus:subscribeSignal', async (_event, params: SubscribeSignalParams) => {
    try {
      const success = await signalMonitor.subscribe(
        params.serviceName,
        params.path,
        params.interfaceName,
        params.signalName,
        params.busType
      )
      return success
    } catch (error: any) {
      console.error('Failed to subscribe to signal:', error)
      return false
    }
  })

  // Unsubscribe from signal
  ipcMain.handle('dbus:unsubscribeSignal', async (_event, params: UnsubscribeSignalParams) => {
    try {
      await signalMonitor.unsubscribe(
        params.serviceName,
        params.path,
        params.interfaceName,
        params.signalName,
        params.busType
      )
    } catch (error: any) {
      console.error('Failed to unsubscribe from signal:', error)
    }
  })

  // Listen for signal events and forward to renderer
  signalMonitor.on('signalReceived', (event: any) => {
    const windows = BrowserWindow.getAllWindows()
    for (const window of windows) {
      window.webContents.send('dbus:signalReceived', event)
    }
  })
}

/**
 * Cleanup signal subscriptions
 */
export async function cleanupSignalMonitor() {
  await signalMonitor.unsubscribeAll()
}
