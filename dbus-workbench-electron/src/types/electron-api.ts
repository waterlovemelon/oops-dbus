export type BusType = 'session' | 'system'

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

export interface ElectronAPI {
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  isMaximized: () => boolean

  listServices: (busType: BusType) => Promise<string[]>
  introspectServiceMembers: (serviceName: string, busType: BusType) => Promise<DbusMemberInfo[]>
  invokeMethod: (params: InvokeMethodParams) => Promise<DbusMethodResult>
  subscribeSignal: (params: SignalSubscriptionParams) => Promise<boolean>
  unsubscribeSignal: (params: SignalSubscriptionParams) => Promise<void>
  onSignalReceived: (callback: (event: SignalEvent) => void) => void
  removeSignalListener: () => void
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
