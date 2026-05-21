import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.sendSync('window:isMaximized'),

  // D-Bus operations
  // ServiceExplorer
  listServices: (busType: 'session' | 'system', connectionId?: string) =>
    ipcRenderer.invoke('dbus:listServices', busType, connectionId),

  introspectServiceMembers: (serviceName: string, busType: 'session' | 'system', connectionId?: string) =>
    ipcRenderer.invoke('dbus:introspectServiceMembers', serviceName, busType, connectionId),

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

  // SSH Remote Connection
  sshListConnections: () => ipcRenderer.invoke('ssh:listConnections'),
  sshCreateConnection: (conn: any) => ipcRenderer.invoke('ssh:createConnection', conn),
  sshUpdateConnection: (conn: any) => ipcRenderer.invoke('ssh:updateConnection', conn),
  sshDeleteConnection: (id: string) => ipcRenderer.invoke('ssh:deleteConnection', id),
  sshConnect: (id: string) => ipcRenderer.invoke('ssh:connect', id),
  sshDisconnect: (id: string) => ipcRenderer.invoke('ssh:disconnect', id),
  sshGetConnectionState: (id: string) => ipcRenderer.invoke('ssh:getConnectionState', id),
  sshGetAllConnectionStates: () => ipcRenderer.invoke('ssh:getAllConnectionStates'),
  onSSHConnectionStatus: (callback: (state: any) => void) => {
    ipcRenderer.on('ssh:connectionStatus', (_event, data) => callback(data))
  },
  removeSSHStatusListener: () => {
    ipcRenderer.removeAllListeners('ssh:connectionStatus')
  },
})
