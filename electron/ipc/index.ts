import { registerServiceExplorerHandlers } from './serviceExplorer'
import { registerMethodInvokerHandlers } from './methodInvoker'
import { registerSignalMonitorHandlers, cleanupSignalMonitor } from './signalMonitor'
import { registerPropertyAccessorHandlers } from './propertyAccessor'
import { registerSSHHandlers, cleanupSSH } from './ssh'

/**
 * Register all IPC handlers
 */
export function registerAllIPCHandlers() {
  registerServiceExplorerHandlers()
  registerMethodInvokerHandlers()
  registerSignalMonitorHandlers()
  registerPropertyAccessorHandlers()
  registerSSHHandlers()
}

/**
 * Cleanup all IPC handlers
 */
export async function cleanupAllIPCHandlers() {
  await cleanupSignalMonitor()
  await cleanupSSH()
}

export { cleanupSignalMonitor, cleanupSSH }
