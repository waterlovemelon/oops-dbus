export type BusType = 'session' | 'system'

// SSH Remote Connection types
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface RemoteConnection {
  id: string
  name: string
  type: 'ssh'
  host: string
  port: number
  user: string
  authType: 'key' | 'password'
  keyPath?: string
  password?: string
  dbusSocketPath?: string
}

export interface ConnectionState {
  id: string
  status: ConnectionStatus
  error?: string
}

export interface InvokeMethodParams {
  serviceName: string
  path: string
  interfaceName: string
  methodName: string
  args: any[]
  busType: BusType
}

export interface SignalSubscriptionParams {
  serviceName: string
  path: string
  interfaceName: string
  signalName: string
  busType: BusType
}

export interface GetPropertyParams {
  serviceName: string
  path: string
  interfaceName: string
  propertyName: string
  busType: BusType
}

export interface SetPropertyParams {
  serviceName: string
  path: string
  interfaceName: string
  propertyName: string
  value: any
  busType: BusType
}

export interface GetAllPropertiesParams {
  serviceName: string
  path: string
  interfaceName: string
  busType: BusType
}

export interface ElectronAPI {
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  isMaximized: () => boolean

  listServices: (busType: BusType, connectionId?: string) => Promise<string[]>
  introspectServiceMembers: (serviceName: string, busType: BusType, connectionId?: string) => Promise<DbusMemberInfo[]>
  invokeMethod: (params: InvokeMethodParams) => Promise<DbusMethodResult>
  subscribeSignal: (params: SignalSubscriptionParams) => Promise<boolean>
  unsubscribeSignal: (params: SignalSubscriptionParams) => Promise<void>
  onSignalReceived: (callback: (event: SignalEvent) => void) => void
  removeSignalListener: () => void

  getProperty: (params: GetPropertyParams) => Promise<DbusMethodResult>
  setProperty: (params: SetPropertyParams) => Promise<DbusMethodResult>
  getAllProperties: (params: GetAllPropertiesParams) => Promise<DbusMethodResult>

  // SSH Remote Connection
  sshListConnections: () => Promise<RemoteConnection[]>
  sshCreateConnection: (conn: RemoteConnection) => Promise<RemoteConnection[]>
  sshUpdateConnection: (conn: RemoteConnection) => Promise<RemoteConnection[]>
  sshDeleteConnection: (id: string) => Promise<RemoteConnection[]>
  sshConnect: (id: string) => Promise<ConnectionState>
  sshDisconnect: (id: string) => Promise<ConnectionState>
  sshGetConnectionState: (id: string) => Promise<ConnectionState | undefined>
  sshGetAllConnectionStates: () => Promise<ConnectionState[]>
  onSSHConnectionStatus: (callback: (state: ConnectionState) => void) => void
  removeSSHStatusListener: () => void
}

export interface DbusArgumentInfo {
  name: string
  type: string
  direction: 'in' | 'out'
}

export interface DbusMemberInfo {
  id: string
  name: string
  type: 'method' | 'signal' | 'property'
  serviceName: string
  interfaceName: string
  path: string
  signature: string
  returnType: string
  annotation: string
  inputArgs: DbusArgumentInfo[]
  outputArgs: DbusArgumentInfo[]
}

export interface DbusInterfaceInfo {
  name: string
  path: string
  methods: DbusMemberInfo[]
  signalMembers: DbusMemberInfo[]
  properties: DbusMemberInfo[]
}

export interface DbusMethodResult {
  success: boolean
  value?: any
  error?: string
}

export interface SignalEvent {
  timestamp: Date
  serviceName: string
  path: string
  interfaceName: string
  signalName: string
  args: any[]
}
