// D-Bus data structures (matching Qt backend)

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

export type BusType = 'session' | 'system'
