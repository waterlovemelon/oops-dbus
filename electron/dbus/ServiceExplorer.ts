import { Message, MessageType, sessionBus, systemBus } from 'dbus-next'
import { readFileSync } from 'fs'
import type { BusType, DbusMemberInfo, DbusInterfaceInfo, DbusArgumentInfo, ServiceInfo } from './types'

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
   * Get detailed info about a service: unique name, PID, process command
   */
  async getServiceInfo(serviceName: string, busType: BusType): Promise<ServiceInfo> {
    const bus = this.getBus(busType)

    try {
      // Get unique name via GetNameOwner
      let uniqueName: string | null = null
      try {
        const nameOwnerReply = await bus.call(new Message({
          type: MessageType.METHOD_CALL,
          destination: 'org.freedesktop.DBus',
          path: '/org/freedesktop/DBus',
          interface: 'org.freedesktop.DBus',
          member: 'GetNameOwner',
          signature: 's',
          body: [serviceName],
        }))
        if (nameOwnerReply.type === MessageType.METHOD_RETURN) {
          uniqueName = nameOwnerReply.body[0]
        }
      } catch {
        // Service not active
      }

      if (!uniqueName) {
        return { serviceName, uniqueName: null, pid: null, processCmd: null, isActive: false }
      }

      // Get PID via GetConnectionUnixProcessID
      let pid: number | null = null
      try {
        const pidReply = await bus.call(new Message({
          type: MessageType.METHOD_CALL,
          destination: 'org.freedesktop.DBus',
          path: '/org/freedesktop/DBus',
          interface: 'org.freedesktop.DBus',
          member: 'GetConnectionUnixProcessID',
          signature: 's',
          body: [uniqueName],
        }))
        if (pidReply.type === MessageType.METHOD_RETURN) {
          pid = pidReply.body[0]
        }
      } catch {
        // PID not available
      }

      // Read process command from /proc/{pid}/cmdline
      let processCmd: string | null = null
      if (pid) {
        try {
          const cmdline = readFileSync(`/proc/${pid}/cmdline`, 'utf-8')
          // cmdline is null-separated, convert to space-separated
          processCmd = cmdline.split('\0').filter(Boolean).join(' ')
        } catch {
          // Process may have exited or /proc not available
        }
      }

      return { serviceName, uniqueName, pid, processCmd, isActive: true }
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
    try {
      const paths: string[] = [path]
      const xml = await this.getIntrospectionXML(bus, serviceName, path)
      const nodeMatches = xml.match(/<node\s+name="([^"]+)"/g)

      if (nodeMatches) {
        for (const match of nodeMatches) {
          const nameMatch = match.match(/name="([^"]+)"/)
          if (nameMatch && nameMatch[1]) {
            const nodeName = nameMatch[1]
            const childPath = path === '/' ? `/${nodeName}` : `${path}/${nodeName}`
            const childPaths = await this.explorePaths(bus, serviceName, childPath)
            paths.push(...childPaths)
          }
        }
      }

      return paths
    } catch (error) {
      const isUnknownObject = (error as { type?: string }).type === 'org.freedesktop.DBus.Error.UnknownObject'
      if (isUnknownObject && path !== '/') {
        return []
      }

      console.error(`Failed to introspect path ${path}:`, error)
      return [path]
    }
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
            const args = this.extractArguments(methodMatch, 'in')
            const inputArgs = args.filter((arg) => arg.direction === 'in')
            const outputArgs = args.filter((arg) => arg.direction === 'out')

            const method: DbusMemberInfo = {
              id: `${path}:${interfaceName}:${methodName}`,
              name: methodName,
              type: 'method',
              serviceName,
              interfaceName,
              path,
              signature: inputArgs.map((arg) => arg.type).join(''),
              returnType: outputArgs.map((arg) => arg.type).join(''),
              annotation: '',
              inputArgs,
              outputArgs,
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
            const outputArgs = this.extractArguments(signalMatch, 'out')

            const signal: DbusMemberInfo = {
              id: `${path}:${interfaceName}:${signalName}`,
              name: signalName,
              type: 'signal',
              serviceName,
              interfaceName,
              path,
              signature: outputArgs.map((arg) => arg.type).join(''),
              returnType: '',
              annotation: '',
              inputArgs: [],
              outputArgs,
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
              inputArgs: [],
              outputArgs: [],
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
   * Extract all argument nodes from XML as structured DbusArgumentInfo objects
   */
  private extractArguments(xml: string, defaultDirection: 'in' | 'out'): DbusArgumentInfo[] {
    const argMatches = xml.match(/<arg\b[^>]*\/?>/g)
    if (!argMatches) return []

    return argMatches.map((argXml) => ({
      name: this.extractAttribute(argXml, 'name'),
      type: this.extractAttribute(argXml, 'type'),
      direction: (this.extractAttribute(argXml, 'direction') || defaultDirection) as 'in' | 'out',
    }))
  }

  /**
   * Extract a single attribute value from an XML string
   */
  private extractAttribute(xml: string, name: string): string {
    const match = xml.match(new RegExp(`${name}="([^"]*)"`))
    return match?.[1] ?? ''
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
