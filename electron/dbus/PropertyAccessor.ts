import { Message, MessageType, sessionBus, systemBus } from 'dbus-next'
import type { BusType, DbusMethodResult } from './types'

/**
 * PropertyAccessor - Read and write D-Bus properties
 *
 * This class provides functionality to:
 * - Get a single property value via org.freedesktop.DBus.Properties.Get
 * - Set a single property value via org.freedesktop.DBus.Properties.Set
 * - Get all properties on an interface via org.freedesktop.DBus.Properties.GetAll
 * - Handle errors and timeouts gracefully
 */
export class PropertyAccessor {
  /**
   * Get a single D-Bus property
   */
  async getProperty(
    serviceName: string,
    path: string,
    interfaceName: string,
    propertyName: string,
    busType: BusType
  ): Promise<DbusMethodResult> {
    const bus = this.getBus(busType)

    try {
      const method = new Message({
        type: MessageType.METHOD_CALL,
        destination: serviceName,
        path,
        interface: 'org.freedesktop.DBus.Properties',
        member: 'Get',
      })

      method.body = [interfaceName, propertyName]
      method.signature = 'ss'

      const reply = await bus.call(method)

      if (!reply) {
        return { success: false, error: 'No response received' }
      }

      if (reply.type === MessageType.ERROR) {
        return { success: false, error: reply.errorName || 'Unknown error' }
      }

      if (reply.type === MessageType.METHOD_RETURN) {
        return { success: true, value: this.parseReturnValue(reply.body) }
      }

      return { success: false, error: 'Unexpected response type' }
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error occurred' }
    } finally {
      bus.disconnect()
    }
  }

  /**
   * Set a single D-Bus property
   */
  async setProperty(
    serviceName: string,
    path: string,
    interfaceName: string,
    propertyName: string,
    value: any,
    busType: BusType
  ): Promise<DbusMethodResult> {
    const bus = this.getBus(busType)

    try {
      const method = new Message({
        type: MessageType.METHOD_CALL,
        destination: serviceName,
        path,
        interface: 'org.freedesktop.DBus.Properties',
        member: 'Set',
      })

      method.body = [interfaceName, propertyName, value]
      method.signature = 'ssv'

      const reply = await bus.call(method)

      if (!reply) {
        return { success: false, error: 'No response received' }
      }

      if (reply.type === MessageType.ERROR) {
        return { success: false, error: reply.errorName || 'Unknown error' }
      }

      if (reply.type === MessageType.METHOD_RETURN) {
        return { success: true, value: undefined }
      }

      return { success: false, error: 'Unexpected response type' }
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error occurred' }
    } finally {
      bus.disconnect()
    }
  }

  /**
   * Get all properties on a D-Bus interface
   */
  async getAllProperties(
    serviceName: string,
    path: string,
    interfaceName: string,
    busType: BusType
  ): Promise<DbusMethodResult> {
    const bus = this.getBus(busType)

    try {
      const method = new Message({
        type: MessageType.METHOD_CALL,
        destination: serviceName,
        path,
        interface: 'org.freedesktop.DBus.Properties',
        member: 'GetAll',
      })

      method.body = [interfaceName]
      method.signature = 's'

      const reply = await bus.call(method)

      if (!reply) {
        return { success: false, error: 'No response received' }
      }

      if (reply.type === MessageType.ERROR) {
        return { success: false, error: reply.errorName || 'Unknown error' }
      }

      if (reply.type === MessageType.METHOD_RETURN) {
        return { success: true, value: this.parseReturnValue(reply.body) }
      }

      return { success: false, error: 'Unexpected response type' }
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error occurred' }
    } finally {
      bus.disconnect()
    }
  }

  /**
   * Parse return value from D-Bus format to JavaScript
   */
  private parseReturnValue(body: any[]): any {
    if (!body || body.length === 0) {
      return undefined
    }

    if (body.length === 1) {
      return this.convertDbusValue(body[0])
    }

    return body.map(value => this.convertDbusValue(value))
  }

  /**
   * Convert D-Bus value to JavaScript value
   */
  private convertDbusValue(value: any): any {
    if (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value
    }

    if (Array.isArray(value)) {
      return value.map(v => this.convertDbusValue(v))
    }

    if (typeof value === 'object') {
      const converted: any = {}
      for (const key in value) {
        converted[key] = this.convertDbusValue(value[key])
      }
      return converted
    }

    return value
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
