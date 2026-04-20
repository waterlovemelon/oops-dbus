import { registerServiceExplorerHandlers } from './serviceExplorer'
import { registerMethodInvokerHandlers } from './methodInvoker'
import { registerSignalMonitorHandlers, cleanupSignalMonitor } from './signalMonitor'

/**
 * Register all IPC handlers
 */
export function registerAllIPCHandlers() {
  registerServiceExplorerHandlers()
  registerMethodInvokerHandlers()
  registerSignalMonitorHandlers()
}

/**
 * Cleanup all IPC handlers
 */
export async function cleanupAllIPCHandlers() {
  await cleanupSignalMonitor()
}

export { cleanupSignalMonitor }
