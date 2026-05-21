declare module 'ssh2' {
  import { EventEmitter } from 'events'
  import { Socket } from 'net'

  interface ClientConfig {
    host?: string
    port?: number
    username?: string
    password?: string
    privateKey?: Buffer | string
    readyTimeout?: number
  }

  interface Channel {
    on(event: 'data', listener: (data: Buffer) => void): this
    on(event: 'close', listener: () => void): this
    stderr: EventEmitter
  }

  class Client extends EventEmitter {
    connect(config: ClientConfig): void
    exec(command: string, callback: (err: Error | undefined, stream: Channel) => void): void
    forwardOut(
      srcIP: string,
      srcPort: number,
      dstIP: string,
      dstPort: number,
      callback: (err: Error | undefined, stream: Socket) => void
    ): void
    end(): void
    on(event: 'ready', listener: () => void): this
    on(event: 'error', listener: (err: Error) => void): this
    on(event: 'close', listener: () => void): this
  }
}
