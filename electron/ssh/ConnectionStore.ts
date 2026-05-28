import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { RemoteConnection } from './types'

const CONFIG_DIR = path.join(app.getPath('home'), '.config', 'oops-dbus')
const CONNECTIONS_FILE = path.join(CONFIG_DIR, 'connections.json')

export class ConnectionStore {
  private connections: RemoteConnection[] = []

  load(): RemoteConnection[] {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true })
      }
      if (fs.existsSync(CONNECTIONS_FILE)) {
        const data = fs.readFileSync(CONNECTIONS_FILE, 'utf-8')
        this.connections = JSON.parse(data)
      }
    } catch (err) {
      console.error('Failed to load connections:', err)
      this.connections = []
    }
    return this.connections
  }

  save(connections: RemoteConnection[]): void {
    this.connections = connections
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true })
      }
      fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(connections, null, 2), 'utf-8')
    } catch (err) {
      console.error('Failed to save connections:', err)
    }
  }

  add(conn: RemoteConnection): RemoteConnection[] {
    this.connections.push(conn)
    this.save(this.connections)
    return this.connections
  }

  update(conn: RemoteConnection): RemoteConnection[] {
    const idx = this.connections.findIndex((c) => c.id === conn.id)
    if (idx >= 0) {
      this.connections[idx] = conn
      this.save(this.connections)
    }
    return this.connections
  }

  remove(id: string): RemoteConnection[] {
    this.connections = this.connections.filter((c) => c.id !== id)
    this.save(this.connections)
    return this.connections
  }

  getAll(): RemoteConnection[] {
    return this.connections
  }
}
