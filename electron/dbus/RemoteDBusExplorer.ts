import type { TunnelManager } from '../ssh/TunnelManager'
import type { DbusMemberInfo, DbusArgumentInfo, ServiceInfo } from './types'

export class RemoteDBusExplorer {
  constructor(private tunnelManager: TunnelManager) {}

  private parseGdbusStringArray(output: string): string[] {
    const match = output.match(/\[(.*)\]/s)
    if (!match) return []

    return match[1]
      .split(',')
      .map(s => s.trim().replace(/^'|'$/g, '').replace(/^"|"$/g, ''))
      .filter(Boolean)
  }

  private parseGdbusUint(output: string): number | null {
    const match = output.match(/\(\s*(?:uint\d+\s+)?(\d+),?\s*\)/)
    return match ? parseInt(match[1], 10) : null
  }

  private isNameHasNoOwnerError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error)
    return message.includes('org.freedesktop.DBus.Error.NameHasNoOwner')
      || message.includes('NameHasNoOwner')
      || message.includes('does not have an owner')
  }

  async listServices(connectionId: string, busType: 'session' | 'system'): Promise<string[]> {
    const busFlag = busType === 'system' ? '--system' : '--session'
    const names = new Set<string>()

    const namesCmd = `gdbus call ${busFlag} --dest org.freedesktop.DBus --object-path /org/freedesktop/DBus --method org.freedesktop.DBus.ListNames`
    const namesOutput = await this.tunnelManager.runCommand(connectionId, namesCmd)
    for (const name of this.parseGdbusStringArray(namesOutput)) {
      if (!name.startsWith(':')) {
        names.add(name)
      }
    }

    try {
      const activatableCmd = `gdbus call ${busFlag} --dest org.freedesktop.DBus --object-path /org/freedesktop/DBus --method org.freedesktop.DBus.ListActivatableNames`
      const activatableOutput = await this.tunnelManager.runCommand(connectionId, activatableCmd)
      for (const name of this.parseGdbusStringArray(activatableOutput)) {
        if (!name.startsWith(':')) {
          names.add(name)
        }
      }
    } catch {
      // Keep active services visible even if activatable listing is unavailable.
    }

    return Array.from(names).sort()
  }

  async getAllServiceInfo(connectionId: string, busType: 'session' | 'system'): Promise<Map<string, ServiceInfo>> {
    const result = new Map<string, ServiceInfo>()
    const services = await this.listServices(connectionId, busType)
    const concurrency = 8

    for (let i = 0; i < services.length; i += concurrency) {
      const batch = services.slice(i, i + concurrency)
      const infos = await Promise.all(batch.map(async (serviceName) => {
        try {
          return await this.getServiceInfo(connectionId, serviceName, busType)
        } catch {
          return null
        }
      }))

      for (const info of infos) {
        if (info) {
          result.set(info.serviceName, info)
        }
      }
    }

    return result
  }

  async getServiceInfo(connectionId: string, serviceName: string, busType: 'session' | 'system'): Promise<ServiceInfo> {
    const busFlag = busType === 'system' ? '--system' : '--session'
    let isActivatable = false

    try {
      const cmd = `gdbus call ${busFlag} --dest org.freedesktop.DBus --object-path /org/freedesktop/DBus --method org.freedesktop.DBus.ListActivatableNames`
      const output = await this.tunnelManager.runCommand(connectionId, cmd)
      isActivatable = this.parseGdbusStringArray(output).includes(serviceName)
    } catch {
      // ignore
    }

    // Get unique name
    let uniqueName: string | null = null
    try {
      const cmd = `gdbus call ${busFlag} --dest org.freedesktop.DBus --object-path /org/freedesktop/DBus --method org.freedesktop.DBus.GetNameOwner '${serviceName}'`
      const output = await this.tunnelManager.runCommand(connectionId, cmd)
      const match = output.match(/\('([^']+)'/)
      if (match) uniqueName = match[1]
    } catch (error) {
      if (!this.isNameHasNoOwnerError(error)) {
        throw error
      }
    }

    if (!uniqueName) {
      return { serviceName, uniqueName: null, pid: null, processCmd: null, startTime: null, isActive: false, isActivatable }
    }

    // Get PID
    let pid: number | null = null
    try {
      const cmd = `gdbus call ${busFlag} --dest org.freedesktop.DBus --object-path /org/freedesktop/DBus --method org.freedesktop.DBus.GetConnectionUnixProcessID '${uniqueName}'`
      const output = await this.tunnelManager.runCommand(connectionId, cmd)
      pid = this.parseGdbusUint(output)
    } catch {
      // PID not available
    }

    // Read process command and start time
    let processCmd: string | null = null
    let startTime: string | null = null
    if (pid) {
      try {
        const cmd = `cat /proc/${pid}/cmdline | tr '\\0' ' '`
        processCmd = (await this.tunnelManager.runCommand(connectionId, cmd)).trim()
      } catch {
        // Process may have exited
      }
      try {
        const cmd = `stat -c %Y /proc/${pid}`
        const epochSec = (await this.tunnelManager.runCommand(connectionId, cmd)).trim()
        startTime = new Date(parseInt(epochSec, 10) * 1000).toISOString()
      } catch {
        // Process may have exited
      }
    }

    return { serviceName, uniqueName, pid, processCmd, startTime, isActive: true, isActivatable }
  }

  async activateService(connectionId: string, serviceName: string, busType: 'session' | 'system'): Promise<void> {
    const busFlag = busType === 'system' ? '--system' : '--session'
    const cmd = `gdbus call ${busFlag} --dest org.freedesktop.DBus --object-path /org/freedesktop/DBus --method org.freedesktop.DBus.StartServiceByName '${serviceName}' 0`
    await this.tunnelManager.runCommand(connectionId, cmd)
  }

  async introspectServiceMembers(connectionId: string, serviceName: string, busType: 'session' | 'system'): Promise<DbusMemberInfo[]> {
    return await this.exploreAndCollect(connectionId, serviceName, busType, '/')
  }

  private async exploreAndCollect(connectionId: string, serviceName: string, busType: 'session' | 'system', path: string, visited = new Set<string>()): Promise<DbusMemberInfo[]> {
    if (visited.has(path)) return []
    visited.add(path)

    const busFlag = busType === 'system' ? '--system' : '--session'
    const cmd = `gdbus call ${busFlag} --dest ${serviceName} --object-path ${path} --method org.freedesktop.DBus.Introspectable.Introspect`

    let output: string
    try {
      output = await this.tunnelManager.runCommand(connectionId, cmd)
    } catch {
      return []
    }
    const xmlMatch = output.match(/\('(<\?xml[\s\S]*?<\/node>)',?\)/)
      || output.match(/\('(<\!DOCTYPE[\s\S]*?<\/node>)',?\)/)
      || output.match(/\('(<node[\s\S]*?<\/node>)',?\)/)
    if (!xmlMatch) {
      return []
    }

    const xml = xmlMatch[1].replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"')

    const members = this.parseIntrospectionXML(xml, serviceName, path)

    const childMatches = xml.match(/<node\s+name="([^"]+)"\s*\/>/g)
    if (childMatches) {
      for (const childMatch of childMatches) {
        const nameMatch = childMatch.match(/name="([^"]+)"/)
        if (!nameMatch) continue
        const childPath = path === '/' ? `/${nameMatch[1]}` : `${path}/${nameMatch[1]}`
        const childMembers = await this.exploreAndCollect(connectionId, serviceName, busType, childPath, visited)
        members.push(...childMembers)
      }
    }

    return members
  }

  private parseIntrospectionXML(xml: string, serviceName: string, path: string): DbusMemberInfo[] {
    const members: DbusMemberInfo[] = []

    const interfaceMatches = xml.match(/<interface\s+name="([^"]+)">([\s\S]*?)<\/interface>/g)
    if (!interfaceMatches) return members

    for (const interfaceMatch of interfaceMatches) {
      const nameMatch = interfaceMatch.match(/name="([^"]+)"/)
      if (!nameMatch) continue
      const interfaceName = nameMatch[1]

      const methodMatches = interfaceMatch.match(/<method\s+name="([^"]+)">([\s\S]*?)<\/method>/g)
      if (methodMatches) {
        for (const methodMatch of methodMatches) {
          const methodNameMatch = methodMatch.match(/name="([^"]+)"/)
          if (!methodNameMatch) continue
          const methodName = methodNameMatch[1]
          const args = this.extractArguments(methodMatch, 'in')
          const inputArgs = args.filter(a => a.direction === 'in')
          const outputArgs = args.filter(a => a.direction === 'out')
          members.push({
            id: `${path}:${interfaceName}:${methodName}`,
            name: methodName, type: 'method', serviceName, interfaceName, path,
            signature: inputArgs.map(a => a.type).join(''),
            returnType: outputArgs.map(a => a.type).join(''),
            annotation: '', inputArgs, outputArgs,
          })
        }
      }

      const signalMatches = interfaceMatch.match(/<signal\s+name="([^"]+)">([\s\S]*?)<\/signal>/g)
      if (signalMatches) {
        for (const signalMatch of signalMatches) {
          const signalNameMatch = signalMatch.match(/name="([^"]+)"/)
          if (!signalNameMatch) continue
          const signalName = signalNameMatch[1]
          const outputArgs = this.extractArguments(signalMatch, 'out')
          members.push({
            id: `${path}:${interfaceName}:${signalName}`,
            name: signalName, type: 'signal', serviceName, interfaceName, path,
            signature: outputArgs.map(a => a.type).join(''),
            returnType: '', annotation: '', inputArgs: [], outputArgs,
          })
        }
      }

      const propertyMatches = interfaceMatch.match(/<property\s+name="([^"]+)"\s+type="([^"]+)"[^>]*(?:\/>|>)/g)
      if (propertyMatches) {
        for (const propertyMatch of propertyMatches) {
          const propNameMatch = propertyMatch.match(/name="([^"]+)"/)
          const propTypeMatch = propertyMatch.match(/type="([^"]+)"/)
          if (!propNameMatch || !propTypeMatch) continue
          const accessMatch = propertyMatch.match(/access="([^"]+)"/)
          members.push({
            id: `${path}:${interfaceName}:${propNameMatch[1]}`,
            name: propNameMatch[1], type: 'property', serviceName, interfaceName, path,
            signature: propTypeMatch[1], returnType: propTypeMatch[1],
            annotation: accessMatch ? accessMatch[1] : '', inputArgs: [], outputArgs: [],
          })
        }
      }
    }

    return members
  }

  private extractArguments(xml: string, defaultDirection: 'in' | 'out'): DbusArgumentInfo[] {
    const argMatches = xml.match(/<arg\b[^>]*\/?>/g)
    if (!argMatches) return []
    return argMatches.map(argXml => ({
      name: this.extractAttribute(argXml, 'name'),
      type: this.extractAttribute(argXml, 'type'),
      direction: (this.extractAttribute(argXml, 'direction') || defaultDirection) as 'in' | 'out',
    }))
  }

  private extractAttribute(xml: string, name: string): string {
    const match = xml.match(new RegExp(`${name}="([^"]*)"`))
    return match?.[1] ?? ''
  }
}
