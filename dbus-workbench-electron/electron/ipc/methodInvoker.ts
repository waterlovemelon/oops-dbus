import { ipcMain } from 'electron'
import { MethodInvoker } from '../dbus/MethodInvoker'
import type { InvokeMethodParams } from './types'

const methodInvoker = new MethodInvoker()

/**
 * Register IPC handlers for MethodInvoker
 */
export function registerMethodInvokerHandlers() {
  // Invoke method
  ipcMain.handle('dbus:invokeMethod', async (_event, params: InvokeMethodParams) => {
    try {
      const result = await methodInvoker.invokeMethod(
        params.serviceName,
        params.path,
        params.interfaceName,
        params.methodName,
        params.args,
        params.busType
      )
      return result
    } catch (error: any) {
      console.error('Failed to invoke method:', error)
      return {
        success: false,
        error: error.message || 'Unknown error',
      }
    }
  })
}
