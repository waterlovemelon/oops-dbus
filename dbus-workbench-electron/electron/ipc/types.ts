import type { BusType, DbusMemberInfo, DbusMethodResult, SignalEvent } from '../dbus/types'

export interface ListServicesParams {
  busType: BusType
}

export interface IntrospectServiceParams {
  serviceName: string
  busType: BusType
}

export interface InvokeMethodParams {
  serviceName: string
  path: string
  interfaceName: string
  methodName: string
  args: any[]
  busType: BusType
}

export interface SubscribeSignalParams {
  serviceName: string
  path: string
  interfaceName: string
  signalName: string
  busType: BusType
}

export interface UnsubscribeSignalParams {
  serviceName: string
  path: string
  interfaceName: string
  signalName: string
  busType: BusType
}

export type {
  BusType,
  DbusMemberInfo,
  DbusMethodResult,
  SignalEvent,
}
