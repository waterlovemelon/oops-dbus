import test from 'node:test'
import assert from 'node:assert/strict'
import { ServiceExplorer } from './ServiceExplorer.ts'

async function captureConsoleError(run: () => Promise<void>) {
  const originalConsoleError = console.error
  const consoleErrors: unknown[][] = []
  console.error = (...args: unknown[]) => {
    consoleErrors.push(args)
  }

  try {
    await run()
    return consoleErrors
  } finally {
    console.error = originalConsoleError
  }
}

test('introspectPath preserves method input and output argument metadata', async () => {
  const explorer = new ServiceExplorer() as any

  explorer.getIntrospectionXML = async () => `
    <node>
      <interface name="com.example.Interface">
        <method name="SetDefaultEntry">
          <arg name="id" direction="in" type="s"/>
          <arg name="flags" direction="in" type="u"/>
          <arg name="success" direction="out" type="b"/>
        </method>
      </interface>
    </node>
  `

  const interfaces = await explorer.introspectPath({}, 'com.example.Service', '/com/example/Object')
  const method = interfaces[0]?.methods[0]

  assert.deepEqual(method?.inputArgs, [
    { name: 'id', type: 's', direction: 'in' },
    { name: 'flags', type: 'u', direction: 'in' },
  ])
  assert.deepEqual(method?.outputArgs, [
    { name: 'success', type: 'b', direction: 'out' },
  ])
})

test('explorePaths skips child nodes that cannot be introspected', async () => {
  const explorer = new ServiceExplorer() as any

  explorer.getIntrospectionXML = async (_bus: unknown, _serviceName: string, path: string) => {
    if (path === '/') {
      return '<node><node name="ok"/><node name="ghost"/></node>'
    }

    if (path === '/ok') {
      return '<node></node>'
    }

    if (path === '/ghost') {
      const error = new Error('No such object path') as Error & { type?: string }
      error.type = 'org.freedesktop.DBus.Error.UnknownObject'
      throw error
    }

    throw new Error(`Unexpected path: ${path}`)
  }

  const consoleErrors = await captureConsoleError(async () => {
    const paths = await explorer.explorePaths({}, 'com.example.Service', '/')
    assert.deepEqual(paths, ['/', '/ok'])
  })

  assert.deepEqual(consoleErrors, [])
})

test('explorePaths logs and keeps failure visible when root path cannot be introspected', async () => {
  const explorer = new ServiceExplorer() as any

  explorer.getIntrospectionXML = async () => {
    const error = new Error('Root path is missing') as Error & { type?: string }
    error.type = 'org.freedesktop.DBus.Error.UnknownObject'
    throw error
  }

  const consoleErrors = await captureConsoleError(async () => {
    const paths = await explorer.explorePaths({}, 'com.example.Service', '/')
    assert.deepEqual(paths, ['/'])
  })

  assert.equal(consoleErrors.length, 1)
  assert.match(String(consoleErrors[0]?.[0]), /Failed to introspect path \//)
})

test('explorePaths keeps current path when introspection fails for reasons other than unknown object', async () => {
  const explorer = new ServiceExplorer() as any

  explorer.getIntrospectionXML = async () => {
    throw new Error('org.freedesktop.DBus.Error.TimedOut')
  }

  const consoleErrors = await captureConsoleError(async () => {
    const paths = await explorer.explorePaths({}, 'com.example.Service', '/slow')
    assert.deepEqual(paths, ['/slow'])
  })

  assert.equal(consoleErrors.length, 1)
  assert.match(String(consoleErrors[0]?.[0]), /Failed to introspect path \/slow/)
})

test('introspectPath preserves signal argument metadata as output-style args', async () => {
  const explorer = new ServiceExplorer() as any

  explorer.getIntrospectionXML = async () => `
    <node>
      <interface name="com.example.Interface">
        <signal name="PropertiesChanged">
          <arg name="interface_name" type="s"/>
          <arg name="changed_properties" type="a{sv}"/>
          <arg name="invalidated_properties" type="as"/>
        </signal>
      </interface>
    </node>
  `

  const interfaces = await explorer.introspectPath({}, 'com.example.Service', '/com/example/Object')
  const signal = interfaces[0]?.signalMembers[0]

  assert.deepEqual(signal?.inputArgs, [])
  assert.deepEqual(signal?.outputArgs, [
    { name: 'interface_name', type: 's', direction: 'out' },
    { name: 'changed_properties', type: 'a{sv}', direction: 'out' },
    { name: 'invalidated_properties', type: 'as', direction: 'out' },
  ])
})

test('introspectPath keeps empty names for unnamed args', async () => {
  const explorer = new ServiceExplorer() as any

  explorer.getIntrospectionXML = async () => `
    <node>
      <interface name="com.example.Interface">
        <method name="Ping">
          <arg direction="in" type="s"/>
        </method>
      </interface>
    </node>
  `

  const interfaces = await explorer.introspectPath({}, 'com.example.Service', '/com/example/Object')
  const method = interfaces[0]?.methods[0]

  assert.deepEqual(method?.inputArgs, [
    { name: '', type: 's', direction: 'in' },
  ])
})

test('introspectPath parses self-closing property tags', async () => {
  const explorer = new ServiceExplorer() as any

  explorer.getIntrospectionXML = async () => `
    <node>
      <interface name="com.example.Interface">
        <property name="Version" type="s" access="read"/>
        <property name="Enabled" type="b" access="readwrite"/>
      </interface>
    </node>
  `

  const interfaces = await explorer.introspectPath({}, 'com.example.Service', '/com/example/Object')
  const properties = interfaces[0]?.properties

  assert.equal(properties?.length, 2)
  assert.equal(properties?.[0]?.name, 'Version')
  assert.equal(properties?.[0]?.type, 'property')
  assert.equal(properties?.[0]?.annotation, 'read')
  assert.equal(properties?.[0]?.signature, 's')
  assert.equal(properties?.[1]?.name, 'Enabled')
  assert.equal(properties?.[1]?.annotation, 'readwrite')
  assert.equal(properties?.[1]?.signature, 'b')
})

test('introspectPath parses property tags with annotation children', async () => {
  const explorer = new ServiceExplorer() as any

  explorer.getIntrospectionXML = async () => `
    <node>
      <interface name="com.example.Interface">
        <property name="State" type="s" access="read">
          <annotation name="org.freedesktop.DBus.Property.EmitsChangedSignal" value="true"/>
        </property>
        <property name="Name" type="s" access="read"/>
      </interface>
    </node>
  `

  const interfaces = await explorer.introspectPath({}, 'com.example.Service', '/com/example/Object')
  const properties = interfaces[0]?.properties

  assert.equal(properties?.length, 2)
  assert.equal(properties?.[0]?.name, 'State')
  assert.equal(properties?.[0]?.type, 'property')
  assert.equal(properties?.[0]?.annotation, 'read')
  assert.equal(properties?.[0]?.signature, 's')
  assert.equal(properties?.[1]?.name, 'Name')
  assert.equal(properties?.[1]?.annotation, 'read')
})
