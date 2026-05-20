import { Message, MessageType, sessionBus, systemBus } from 'dbus-next'
import type { BusType, DbusMethodResult } from './types'

/**
 * MethodInvoker - Execute D-Bus method calls
 *
 * This class provides functionality to:
 * - Invoke methods on D-Bus services
 * - Convert JavaScript arguments to D-Bus types
 * - Parse return values from D-Bus format
 * - Handle errors and timeouts gracefully
 */
export class MethodInvoker {
  /**
   * Invoke a D-Bus method asynchronously
   */
  async invokeMethod(
    serviceName: string,
    path: string,
    interfaceName: string,
    methodName: string,
    args: any[],
    busType: BusType
  ): Promise<DbusMethodResult> {
    const bus = this.getBus(busType)

    try {
      // Create method call message
      const method = new Message({
        type: MessageType.METHOD_CALL,
        destination: serviceName,
        path,
        interface: interfaceName,
        member: methodName,
      })

      // Convert arguments to D-Bus types
      // For now, we'll pass them as-is and let dbus-next handle conversion
      // In a production implementation, we'd need proper type conversion based on signature
      method.body = args

      // Send method call and await response
      const reply = await bus.call(method)

      if (!reply) {
        return {
          success: false,
          error: 'No response received',
        }
      }

      if (reply.type === MessageType.ERROR) {
        return {
          success: false,
          error: reply.errorName || 'Unknown error',
        }
      }

      if (reply.type === MessageType.METHOD_RETURN) {
        return {
          success: true,
          value: this.parseReturnValue(reply.body),
        }
      }

      return {
        success: false,
        error: 'Unexpected response type',
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      }
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

    // Multiple return values
    return body.map(value => this.convertDbusValue(value))
  }

  /**
   * Convert D-Bus value to JavaScript value
   */
  private convertDbusValue(value: any): any {
    // Handle basic types
    if (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(v => this.convertDbusValue(v))
    }

    // Handle objects (dicts, structs)
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
