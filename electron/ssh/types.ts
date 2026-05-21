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
  busType: 'session' | 'system'
  dbusSocketPath?: string
}

export interface ConnectionState {
  id: string
  status: ConnectionStatus
  error?: string
}
