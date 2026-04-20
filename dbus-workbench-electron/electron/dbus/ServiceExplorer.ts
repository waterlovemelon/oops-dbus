import { Message, MessageType, sessionBus, systemBus } from 'dbus-next'
import type { BusType, DbusMemberInfo, DbusInterfaceInfo } from './types'

/**
 * ServiceExplorer - Discover and introspect D-Bus services
 *
 * This class provides functionality to:
 * - List all services on a D-Bus bus
 * - Introspect services to discover interfaces, methods, signals, and properties
 * - Parse introspection XML into structured TypeScript objects
 */
export class ServiceExplorer {
  /**
   * List all services on the specified bus
   */
  async listServices(busType: BusType): Promise<string[]> {
    const bus = this.getBus(busType)

    try {
      // Call org.freedesktop.DBus.ListNames
      const method = new Message({
        type: MessageType.METHOD_CALL,
        destination: 'org.freedesktop.DBus',
        path: '/org/freedesktop/DBus',
        interface: 'org.freedesktop.DBus',
        member: 'ListNames',
      })

      const reply = await bus.call(method)

      if (reply.type !== MessageType.METHOD_RETURN) {
        throw new Error('Failed to list services')
      }

      const names: string[] = reply.body[0]

      // Filter out unique names (starting with ':') and sort
      const services = names
        .filter(name => !name.startsWith(':'))
        .sort()

      return services
    } finally {
      bus.disconnect()
    }
  }

  /**
   * Introspect a service and return flat member list
   * This matches the Qt ServiceExplorer::introspectServiceMembers API
   */
  async introspectServiceMembers(
    serviceName: string,
    busType: BusType
  ): Promise<DbusMemberInfo[]> {
    const bus = this.getBus(busType)
    const members: DbusMemberInfo[] = []

    try {
      // Start with root path
      const paths = await this.explorePaths(bus, serviceName, '/')

      // Introspect each path
      for (const path of paths) {
        const interfaces = await this.introspectPath(bus, serviceName, path)

        // Flatten all members into a single list
        for (const iface of interfaces) {
          // Add methods
          for (const method of iface.methods) {
            members.push(method)
          }

          // Add signals
          for (const signal of iface.signalMembers) {
            members.push(signal)
          }

          // Add properties
          for (const property of iface.properties) {
            members.push(property)
          }
        }
      }

      return members
    } finally {
      bus.disconnect()
    }
  }

  /**
   * Recursively explore paths in a service
   */
  private async explorePaths(
    bus: any,
    serviceName: string,
    path: string
  ): Promise<string[]> {
    const paths: string[] = [path]

    try {
      // Introspect current path to find child nodes
      const xml = await this.getIntrospectionXML(bus, serviceName, path)
      // Simple XML parsing - find all <node name="..."/> elements
      const nodeMatches = xml.match(/<node\s+name="([^"]+)"/g)
      if (nodeMatches) {
        for (const match of nodeMatches) {
          const nameMatch = match.match(/name="([^"]+)"/)
          if (nameMatch && nameMatch[1]) {
            const nodeName = nameMatch[1]
            const childPath = path === '/' ? `/${nodeName}` : `${path}/${nodeName}`
            // Recursively explore child paths
            const childPaths = await this.explorePaths(bus, serviceName, childPath)
            paths.push(...childPaths)
          }
        }
      }
    } catch (error) {
      // If introspection fails, just return the current path
      console.error(`Failed to introspect path ${path}:`, error)
    }

    return paths
  }

  /**
   * Introspect a specific path in a service
   */
  private async introspectPath(
    bus: any,
    serviceName: string,
    path: string
  ): Promise<DbusInterfaceInfo[]> {
    const interfaces: DbusInterfaceInfo[] = []

    try {
      const xml = await this.getIntrospectionXML(bus, serviceName, path)

      // Parse interfaces using simple regex
      const interfaceMatches = xml.match(/<interface\s+name="([^"]+)">([\s\S]*?)<\/interface>/g)
      if (!interfaceMatches) return interfaces

      for (const interfaceMatch of interfaceMatches) {
        const nameMatch = interfaceMatch.match(/name="([^"]+)"/)
        if (!nameMatch) continue

        const interfaceName = nameMatch[1]
        const iface: DbusInterfaceInfo = {
          name: interfaceName,
          path,
          methods: [],
          signalMembers: [],
          properties: [],
        }

        // Parse methods
        const methodMatches = interfaceMatch.match(/<method\s+name="([^"]+)">([\s\S]*?)<\/method>/g)
        if (methodMatches) {
          for (const methodMatch of methodMatches) {
            const methodNameMatch = methodMatch.match(/name="([^"]+)"/)
            if (!methodNameMatch) continue

            const methodName = methodNameMatch[1]
            const method: DbusMemberInfo = {
              id: `${path}:${interfaceName}:${methodName}`,
              name: methodName,
              type: 'method',
              serviceName,
              interfaceName,
              path,
              signature: this.extractMethodSignature(methodMatch),
              returnType: this.extractMethodReturnType(methodMatch),
              annotation: '',
            }

            iface.methods.push(method)
          }
        }

        // Parse signals
        const signalMatches = interfaceMatch.match(/<signal\s+name="([^"]+)">([\s\S]*?)<\/signal>/g)
        if (signalMatches) {
          for (const signalMatch of signalMatches) {
            const signalNameMatch = signalMatch.match(/name="([^"]+)"/)
            if (!signalNameMatch) continue

            const signalName = signalNameMatch[1]
            const signal: DbusMemberInfo = {
              id: `${path}:${interfaceName}:${signalName}`,
              name: signalName,
              type: 'signal',
              serviceName,
              interfaceName,
              path,
              signature: this.extractSignalSignature(signalMatch),
              returnType: '',
              annotation: '',
            }

            iface.signalMembers.push(signal)
          }
        }

        // Parse properties
        const propertyMatches = interfaceMatch.match(/<property\s+name="([^"]+)"\s+type="([^"]+)"[^/]*\/>/g)
        if (propertyMatches) {
          for (const propertyMatch of propertyMatches) {
            const propertyNameMatch = propertyMatch.match(/name="([^"]+)"/)
            const propertyTypeMatch = propertyMatch.match(/type="([^"]+)"/)
            if (!propertyNameMatch || !propertyTypeMatch) continue

            const propertyName = propertyNameMatch[1]
            const propertyType = propertyTypeMatch[1]
            const accessMatch = propertyMatch.match(/access="([^"]+)"/)

            const property: DbusMemberInfo = {
              id: `${path}:${interfaceName}:${propertyName}`,
              name: propertyName,
              type: 'property',
              serviceName,
              interfaceName,
              path,
              signature: propertyType,
              returnType: propertyType,
              annotation: accessMatch ? accessMatch[1] : '',
            }

            iface.properties.push(property)
          }
        }

        interfaces.push(iface)
      }
    } catch (error) {
      console.error(`Failed to introspect path ${path}:`, error)
    }

    return interfaces
  }

  /**
   * Get introspection XML for a path
   */
  private async getIntrospectionXML(
    bus: any,
    serviceName: string,
    path: string
  ): Promise<string> {
    const method = new Message({
      type: MessageType.METHOD_CALL,
      destination: serviceName,
      path,
      interface: 'org.freedesktop.DBus.Introspectable',
      member: 'Introspect',
    })

    const reply = await bus.call(method)

    if (reply.type !== MessageType.METHOD_RETURN) {
      throw new Error(`Failed to introspect ${serviceName} at ${path}`)
    }

    return reply.body[0]
  }

  /**
   * Extract method signature from XML string
   */
  private extractMethodSignature(methodXml: string): string {
    const argMatches = methodXml.match(/<arg[^>]*direction="in"[^>]*type="([^"]+)"/g)
    if (!argMatches) return ''

    return argMatches.map(match => {
      const typeMatch = match.match(/type="([^"]+)"/)
      return typeMatch ? typeMatch[1] : ''
    }).join('')
  }

  /**
   * Extract method return type from XML string
   */
  private extractMethodReturnType(methodXml: string): string {
    const argMatches = methodXml.match(/<arg[^>]*direction="out"[^>]*type="([^"]+)"/g)
    if (!argMatches) return ''

    return argMatches.map(match => {
      const typeMatch = match.match(/type="([^"]+)"/)
      return typeMatch ? typeMatch[1] : ''
    }).join('')
  }

  /**
   * Extract signal signature from XML string
   */
  private extractSignalSignature(signalXml: string): string {
    const argMatches = signalXml.match(/<arg[^>]*type="([^"]+)"/g)
    if (!argMatches) return ''

    return argMatches.map(match => {
      const typeMatch = match.match(/type="([^"]+)"/)
      return typeMatch ? typeMatch[1] : ''
    }).join('')
  }

  /**
   * Get D-Bus bus connection
   */
  private getBus(busType: BusType): any {
    if (busType === 'system') {
      return systemBus()
    } else {
      return sessionBus()
    }
  }
}
