export interface ParsedDbusArgument {
  type: string
  description: string
  complexType?: 'array' | 'dict' | 'struct'
  elementType?: string
}

export function parseDbusSignature(signature: string): ParsedDbusArgument[] {
  const args: ParsedDbusArgument[] = []
  let i = 0

  while (i < signature.length) {
    const start = i
    const char = signature[i]

    if ('ybnqiuxtdsog'.includes(char)) {
      args.push({
        type: char,
        description: getTypeDescription(char),
      })
      i++
      continue
    }

    if (char === 'a') {
      i++

      if (signature[i] === '{') {
        i = consumeContainer(signature, i, '{', '}')
        args.push({
          type: signature.substring(start, i),
          description: 'Dictionary (key-value map)',
          complexType: 'dict',
        })
        continue
      }

      if (signature[i] === '(') {
        i = consumeContainer(signature, i, '(', ')')
        args.push({
          type: signature.substring(start, i),
          description: 'Array of structs',
          complexType: 'array',
        })
        continue
      }

      const elementType = signature[i]
      if (elementType) {
        i++
        args.push({
          type: signature.substring(start, i),
          description: `Array of ${getTypeDescription(elementType)}`,
          complexType: 'array',
          elementType,
        })
      }
      continue
    }

    if (char === '(') {
      i = consumeContainer(signature, i, '(', ')')
      args.push({
        type: signature.substring(start, i),
        description: 'Structure',
        complexType: 'struct',
      })
      continue
    }

    if (char === '{') {
      i = consumeContainer(signature, i, '{', '}')
      continue
    }

    i++
  }

  return args
}

export function countDbusArguments(signature: string): number {
  return parseDbusSignature(signature).length
}

function consumeContainer(signature: string, start: number, open: string, close: string): number {
  let i = start + 1
  let depth = 1

  while (i < signature.length && depth > 0) {
    if (signature[i] === open) depth++
    if (signature[i] === close) depth--
    i++
  }

  return i
}

function getTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    y: 'Byte (uint8)',
    b: 'Boolean',
    n: 'Int16',
    q: 'UInt16',
    i: 'Int32',
    u: 'UInt32',
    x: 'Int64',
    t: 'UInt64',
    d: 'Double (float64)',
    s: 'String',
    o: 'Object Path',
    g: 'Signature',
  }

  return descriptions[type] || 'Unknown type'
}
