// @ts-nocheck
import { Client } from 'ssh2'
import fs from 'fs'
import os from 'os'
import type { RemoteConnection, ConnectionState } from './types'

export class TunnelManager {
  private connections = new Map<string, { client: Client; state: ConnectionState }>()
  private statusCallback?: (state: ConnectionState) => void

  onStatusChange(callback: (state: ConnectionState) => void): void {
    this.statusCallback = callback
  }

  private emitState(state: ConnectionState): void {
    const existing = this.connections.get(state.id)
    if (existing) {
      existing.state = state
    }
    this.statusCallback?.(state)
  }

  async connect(config: RemoteConnection): Promise<ConnectionState> {
    const existing = this.connections.get(config.id)
    if (existing?.state.status === 'connected') {
      return existing.state
    }

    const initialState: ConnectionState = { id: config.id, status: 'connecting' }
    this.connections.set(config.id, { client: new Client(), state: initialState })
    this.emitState(initialState)

    return new Promise((resolve) => {
      const client = new Client()
      let resolved = false

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          const errorState: ConnectionState = { id: config.id, status: 'error', error: '连接超时 (15秒)' }
          this.emitState(errorState)
          client.end()
          resolve(errorState)
        }
      }, 15000)

      client.on('ready', () => {
        clearTimeout(timeout)
        if (!resolved) {
          resolved = true
          // Verify gdbus is available
          client.exec('which gdbus', (err, stream) => {
            if (err) {
              const errorState: ConnectionState = { id: config.id, status: 'error', error: '远程机器未安装 gdbus' }
              this.emitState(errorState)
              client.end()
              resolve(errorState)
              return
            }
            let output = ''
            stream.on('data', (d) => { output += d.toString() })
            stream.on('close', () => {
              if (!output.trim()) {
                const errorState: ConnectionState = { id: config.id, status: 'error', error: '远程机器未安装 gdbus' }
                this.emitState(errorState)
                client.end()
                resolve(errorState)
              } else {
                const connectedState: ConnectionState = { id: config.id, status: 'connected' }
                const conn = this.connections.get(config.id)
                if (conn) { conn.client = client; conn.state = connectedState }
                this.emitState(connectedState)
                resolve(connectedState)
              }
            })
          })
        }
      })

      client.on('error', (err) => {
        clearTimeout(timeout)
        if (!resolved) {
          resolved = true
          let errorMsg = err.message
          if (errorMsg.includes('ECONNREFUSED')) errorMsg = '连接被拒绝，请检查主机和端口'
          else if (errorMsg.includes('ENOTFOUND')) errorMsg = '主机不存在，请检查地址'
          else if (errorMsg.includes('Authentication') || errorMsg.includes('All configured')) errorMsg = 'SSH 认证失败，请检查凭据'
          const errorState: ConnectionState = { id: config.id, status: 'error', error: errorMsg }
          this.emitState(errorState)
          resolve(errorState)
        }
      })

      client.on('close', () => {
        const conn = this.connections.get(config.id)
        if (conn?.state.status === 'connected') {
          this.emitState({ id: config.id, status: 'disconnected' })
        }
      })

      const sshConfig = {
        host: config.host,
        port: config.port || 22,
        username: config.user,
        readyTimeout: 15000,
        password: config.authType === 'password' ? config.password : undefined,
        privateKey: config.authType === 'key' ? this.loadKey(config.keyPath) : undefined,
      }

      client.connect(sshConfig)
    })
  }

  private loadKey(keyPath?: string): Buffer | undefined {
    const resolved = keyPath?.replace('~', os.homedir()) || `${os.homedir()}/.ssh/id_rsa`
    try { return fs.readFileSync(resolved) } catch { return undefined }
  }

  runCommand(id: string, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const conn = this.connections.get(id)
      if (!conn || conn.state.status !== 'connected') {
        reject(new Error('Not connected'))
        return
      }
      conn.client.exec(command, (err, stream) => {
        if (err) { reject(err); return }
        let stdout = ''
        let stderr = ''
        stream.on('data', (d) => { stdout += d.toString() })
        stream.stderr.on('data', (d) => { stderr += d.toString() })
        stream.on('close', () => {
          if (stderr && !stdout) reject(new Error(stderr.trim()))
          else resolve(stdout.trim())
        })
      })
    })
  }

  async disconnect(id: string): Promise<void> {
    const conn = this.connections.get(id)
    if (!conn) return
    conn.client.end()
    this.connections.delete(id)
    this.statusCallback?.({ id, status: 'disconnected' })
  }

  isConnected(id: string): boolean {
    return this.connections.get(id)?.state.status === 'connected'
  }

  getClient(id: string): Client | undefined {
    return this.connections.get(id)?.client
  }

  getState(id: string): ConnectionState | undefined {
    return this.connections.get(id)?.state
  }

  getAllStates(): ConnectionState[] {
    return Array.from(this.connections.values()).map(c => c.state)
  }

  async disconnectAll(): Promise<void> {
    for (const id of this.connections.keys()) {
      await this.disconnect(id)
    }
  }
}
