import { sessionBus, systemBus, Message, MessageType } from 'dbus-next'
import { EventEmitter } from 'events'
import type { BusType, SignalEvent } from './types'

/**
 * SignalMonitor - Subscribe to and receive D-Bus signals
 *
 * This class provides functionality to:
 * - Subscribe to D-Bus signals
 * - Unsubscribe from signals
 * - Emit events when signals are received
 * - Track active subscriptions
 */
export class SignalMonitor extends EventEmitter {
  private subscriptions: Map<string, { bus: any; rule: string }> = new Map()

  /**
   * Subscribe to a D-Bus signal
   */
  async subscribe(
    serviceName: string,
    path: string,
    interfaceName: string,
    signalName: string,
    busType: BusType
  ): Promise<boolean> {
    const subscriptionKey = this.getSubscriptionKey(
      serviceName,
      path,
      interfaceName,
      signalName,
      busType
    )

    // Check if already subscribed
    if (this.subscriptions.has(subscriptionKey)) {
      return true
    }

    const bus = this.getBus(busType)

    try {
      // Add signal match rule
      const rule = `type='signal',sender='${serviceName}',path='${path}',interface='${interfaceName}',member='${signalName}'`

      const method = new Message({
        type: MessageType.METHOD_CALL,
        destination: 'org.freedesktop.DBus',
        path: '/org/freedesktop/DBus',
        interface: 'org.freedesktop.DBus',
        member: 'AddMatch',
        signature: 's',
        body: [rule],
      })

      await bus.call(method)

      // Listen for signals
      bus.on('message', (message: Message) => {
        if (
          message.type === MessageType.SIGNAL &&
          message.path === path &&
          message.interface === interfaceName &&
          message.member === signalName
        ) {
          const event: SignalEvent = {
            timestamp: new Date(),
            serviceName: message.sender || serviceName,
            path,
            interfaceName,
            signalName,
            args: message.body || [],
          }

          this.emit('signalReceived', event)
        }
      })

      // Store subscription
      this.subscriptions.set(subscriptionKey, { bus, rule })

      return true
    } catch (error: any) {
      console.error('Failed to subscribe to signal:', error)
      bus.disconnect()
      return false
    }
  }

  /**
   * Unsubscribe from a D-Bus signal
   */
  async unsubscribe(
    serviceName: string,
    path: string,
    interfaceName: string,
    signalName: string,
    busType: BusType
  ): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey(
      serviceName,
      path,
      interfaceName,
      signalName,
      busType
    )

    const subscription = this.subscriptions.get(subscriptionKey)
    if (!subscription) {
      return
    }

    try {
      // Remove signal match rule
      const method = new Message({
        type: MessageType.METHOD_CALL,
        destination: 'org.freedesktop.DBus',
        path: '/org/freedesktop/DBus',
        interface: 'org.freedesktop.DBus',
        member: 'RemoveMatch',
        signature: 's',
        body: [subscription.rule],
      })

      await subscription.bus.call(method)
    } catch (error: any) {
      console.error('Failed to unsubscribe from signal:', error)
    } finally {
      subscription.bus.disconnect()
      this.subscriptions.delete(subscriptionKey)
    }
  }

  /**
   * Unsubscribe from all signals
   */
  async unsubscribeAll(): Promise<void> {
    const promises: Promise<void>[] = []

    for (const [key, subscription] of this.subscriptions) {
      try {
        const method = new Message({
          type: MessageType.METHOD_CALL,
          destination: 'org.freedesktop.DBus',
          path: '/org/freedesktop/DBus',
          interface: 'org.freedesktop.DBus',
          member: 'RemoveMatch',
          signature: 's',
          body: [subscription.rule],
        })

        promises.push(
          subscription.bus.call(method).finally(() => {
            subscription.bus.disconnect()
            this.subscriptions.delete(key)
          })
        )
      } catch (error: any) {
        console.error('Failed to unsubscribe from signal:', error)
      }
    }

    await Promise.all(promises)
  }

  /**
   * Get subscription key for tracking
   */
  private getSubscriptionKey(
    serviceName: string,
    path: string,
    interfaceName: string,
    signalName: string,
    busType: BusType
  ): string {
    return `${busType}:${serviceName}:${path}:${interfaceName}:${signalName}`
  }

  /**
   * Get D-Bus bus connection
   */
  private getBus(busType: BusType) {
    if (busType === 'system') {
      return systemBus()
    } else {
      return sessionBus()
    }
  }
}
