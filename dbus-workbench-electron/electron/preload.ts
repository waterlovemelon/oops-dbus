import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.sendSync('window:isMaximized'),

  // D-Bus operations (will be implemented in next phase)
  // ServiceExplorer
  listServices: (busType: 'session' | 'system') =>
    ipcRenderer.invoke('dbus:listServices', busType),

  introspectServiceMembers: (serviceName: string, busType: 'session' | 'system') =>
    ipcRenderer.invoke('dbus:introspectServiceMembers', serviceName, busType),

  // MethodInvoker
  invokeMethod: (params: {
    serviceName: string
    path: string
    interfaceName: string
    methodName: string
    args: any[]
    busType: 'session' | 'system'
  }) => ipcRenderer.invoke('dbus:invokeMethod', params),

  // SignalMonitor
  subscribeSignal: (params: {
    serviceName: string
    path: string
    interfaceName: string
    signalName: string
    busType: 'session' | 'system'
  }) => ipcRenderer.invoke('dbus:subscribeSignal', params),

  unsubscribeSignal: (params: {
    serviceName: string
    path: string
    interfaceName: string
    signalName: string
    busType: 'session' | 'system'
  }) => ipcRenderer.invoke('dbus:unsubscribeSignal', params),

  // PropertyAccessor
  getProperty: (params: {
    serviceName: string
    path: string
    interfaceName: string
    propertyName: string
    busType: 'session' | 'system'
  }) => ipcRenderer.invoke('dbus:getProperty', params),

  setProperty: (params: {
    serviceName: string
    path: string
    interfaceName: string
    propertyName: string
    value: any
    busType: 'session' | 'system'
  }) => ipcRenderer.invoke('dbus:setProperty', params),

  getAllProperties: (params: {
    serviceName: string
    path: string
    interfaceName: string
    busType: 'session' | 'system'
  }) => ipcRenderer.invoke('dbus:getAllProperties', params),

  // Signal event listener
  onSignalReceived: (callback: (event: any) => void) => {
    ipcRenderer.on('dbus:signalReceived', (_event, data) => callback(data))
  },

  removeSignalListener: () => {
    ipcRenderer.removeAllListeners('dbus:signalReceived')
  },
})
