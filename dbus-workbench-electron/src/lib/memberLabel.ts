import type { DbusArgumentInfo, DbusMemberInfo } from '../types/electron-api'

export function formatMemberLabel(member: DbusMemberInfo): string {
  if (member.type !== 'method') {
    return member.name
  }

  const parts = member.inputArgs.map(formatArgumentLabel)
  return `${member.name}(${parts.join(', ')})`
}

function formatArgumentLabel(arg: DbusArgumentInfo): string {
  const typeLabel = formatDbusTypeLabel(arg.type)
  return arg.name ? `${arg.name}: ${typeLabel}` : typeLabel
}

export function formatDbusTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    y: 'byte',
    b: 'boolean',
    n: 'int16',
    q: 'uint16',
    i: 'int32',
    u: 'uint32',
    x: 'int64',
    t: 'uint64',
    d: 'double',
    s: 'string',
    o: 'object path',
    g: 'signature',
    as: 'array of string',
    'a{sv}': 'dict of string to variant',
  }

  return labels[type] ?? type
}
