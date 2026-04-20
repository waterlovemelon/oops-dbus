import test from 'node:test'
import assert from 'node:assert/strict'
import { formatMemberLabel } from './memberLabel.ts'
import type { DbusArgumentInfo, DbusMemberInfo } from '../types/electron-api'

function createMember(overrides: Partial<DbusMemberInfo>): DbusMemberInfo {
  return {
    id: 'member-1',
    name: 'SetDefaultEntry',
    type: 'method',
    serviceName: 'com.example.Service',
    interfaceName: 'com.example.Interface',
    path: '/com/example/Object',
    signature: 'su',
    returnType: 'b',
    annotation: '',
    inputArgs: [
      { name: 'id', type: 's', direction: 'in' },
      { name: 'flags', type: 'u', direction: 'in' },
    ],
    outputArgs: [
      { name: 'success', type: 'b', direction: 'out' },
    ],
    ...overrides,
  }
}

test('formatMemberLabel shows full argument names and type names for methods', () => {
  const label = formatMemberLabel(createMember({}))
  assert.equal(label, 'SetDefaultEntry(id: string, flags: uint32)')
})

test('formatMemberLabel omits empty names but keeps full type names', () => {
  const label = formatMemberLabel(
    createMember({
      inputArgs: [{ name: '', type: 's', direction: 'in' }],
      signature: 's',
    })
  )
  assert.equal(label, 'SetDefaultEntry(string)')
})

test('formatMemberLabel shows empty parentheses for methods without parameters', () => {
  const label = formatMemberLabel(createMember({ inputArgs: [], signature: '' }))
  assert.equal(label, 'SetDefaultEntry()')
})

test('formatMemberLabel keeps non-method members unchanged', () => {
  const label = formatMemberLabel(
    createMember({
      name: 'PropertiesChanged',
      type: 'signal',
      inputArgs: [],
      outputArgs: [],
    })
  )
  assert.equal(label, 'PropertiesChanged')
})
