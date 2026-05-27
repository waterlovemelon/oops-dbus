import test from 'node:test'
import assert from 'node:assert/strict'
import { RemoteDBusExplorer } from './RemoteDBusExplorer.ts'

test('getServiceInfo parses typed gdbus PID replies for active remote services', async () => {
  const commands: string[] = []
  const tunnelManager = {
    async runCommand(_connectionId: string, command: string) {
      commands.push(command)

      if (command.includes('ListActivatableNames')) {
        return "(['org.example.Service'],)"
      }

      if (command.includes('GetNameOwner')) {
        return "(':1.42',)"
      }

      if (command.includes('GetConnectionUnixProcessID')) {
        return '(uint32 4242,)'
      }

      if (command.includes('/proc/4242/cmdline')) {
        return '/usr/bin/example-service '
      }

      if (command.includes('/proc/4242')) {
        return '1710000000'
      }

      throw new Error(`Unexpected command: ${command}`)
    },
  }

  const explorer = new RemoteDBusExplorer(tunnelManager as any)
  const info = await explorer.getServiceInfo('remote-1', 'org.example.Service', 'system')

  assert.equal(info.isActive, true)
  assert.equal(info.uniqueName, ':1.42')
  assert.equal(info.pid, 4242)
  assert.equal(info.processCmd, '/usr/bin/example-service')
  assert.equal(info.startTime, '2024-03-09T16:00:00.000Z')
  assert.ok(commands.some((command) => command.includes('/proc/4242/cmdline')))
})

test('getAllServiceInfo fetches remote active state with bounded concurrency', async () => {
  let inFlightOwnerLookups = 0
  let maxOwnerLookups = 0
  const names = Array.from({ length: 20 }, (_, index) => `org.example.Service${index}`)
  const tunnelManager = {
    async runCommand(_connectionId: string, command: string) {
      if (command.includes('ListNames')) {
        return `([${names.map((name) => `'${name}'`).join(', ')}],)`
      }

      if (command.includes('ListActivatableNames')) {
        return "(['org.example.Inactive'],)"
      }

      if (command.includes('GetNameOwner')) {
        inFlightOwnerLookups += 1
        maxOwnerLookups = Math.max(maxOwnerLookups, inFlightOwnerLookups)
        await new Promise((resolve) => setTimeout(resolve, 1))
        inFlightOwnerLookups -= 1
        const serviceName = command.match(/'([^']+)'$/)?.[1]
        if (serviceName === 'org.example.Inactive') {
          throw new Error('org.freedesktop.DBus.Error.NameHasNoOwner')
        }
        return `(':1.${names.indexOf(serviceName ?? '')}',)`
      }

      if (command.includes('GetConnectionUnixProcessID')) {
        return '(uint32 1000,)'
      }

      if (command.includes('/proc/1000/cmdline')) {
        return '/usr/bin/example-service '
      }

      if (command.includes('/proc/1000')) {
        return '1710000000'
      }

      throw new Error(`Unexpected command: ${command}`)
    },
  }

  const explorer = new RemoteDBusExplorer(tunnelManager as any)
  const infoMap = await explorer.getAllServiceInfo('remote-1', 'system')

  assert.equal(infoMap.size, names.length + 1)
  assert.equal(infoMap.get('org.example.Service0')?.isActive, true)
  assert.equal(infoMap.get('org.example.Inactive')?.isActive, false)
  assert.ok(maxOwnerLookups <= 8)
})
