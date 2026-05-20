/**
 * D-Bus type utilities for converting between JavaScript and D-Bus types
 *
 * This module provides utilities for:
 * - Parsing D-Bus signatures
 * - Converting JavaScript values to D-Bus types
 * - Converting D-Bus values to JavaScript
 */

/**
 * Parse D-Bus signature to extract type information
 */
export function parseSignature(signature: string): string[] {
  const types: string[] = []
  let i = 0

  while (i < signature.length) {
    const char = signature[i]

    // Basic types
    if (['y', 'b', 'n', 'q', 'i', 'u', 'x', 't', 'd', 's', 'o', 'g'].includes(char)) {
      types.push(char)
      i++
    }
    // Array
    else if (char === 'a') {
      if (signature[i + 1] === '{') {
        // Dictionary
        let depth = 1
        let j = i + 2
        while (j < signature.length && depth > 0) {
          if (signature[j] === '{') depth++
          if (signature[j] === '}') depth--
          j++
        }
        types.push(signature.substring(i, j))
        i = j
      } else {
        // Array
        const elementType = parseSignature(signature.substring(i + 1))
        types.push('a' + elementType[0])
        i += 1 + elementType[0].length
      }
    }
    // Struct
    else if (char === '(') {
      let depth = 1
      let j = i + 1
      while (j < signature.length && depth > 0) {
        if (signature[j] === '(') depth++
        if (signature[j] === ')') depth--
        j++
      }
      types.push(signature.substring(i, j))
      i = j
    }
    // Variant
    else if (char === 'v') {
      types.push('v')
      i++
    }
    else {
      i++
    }
  }

  return types
}

/**
 * Get human-readable type name from D-Bus signature
 */
export function getTypeName(signature: string): string {
  const typeMap: Record<string, string> = {
    'y': 'byte',
    'b': 'boolean',
    'n': 'int16',
    'q': 'uint16',
    'i': 'int32',
    'u': 'uint32',
    'x': 'int64',
    't': 'uint64',
    'd': 'double',
    's': 'string',
    'o': 'object_path',
    'g': 'signature',
    'v': 'variant',
  }

  if (signature.startsWith('a{')) {
    return 'dict'
  } else if (signature.startsWith('a(')) {
    return 'array of struct'
  } else if (signature.startsWith('a')) {
    return 'array'
  } else if (signature.startsWith('(')) {
    return 'struct'
  }

  return typeMap[signature] || signature
}

/**
 * Format D-Bus value for display
 */
export function formatValue(value: any, _signature?: string): string {
  if (value === null || value === undefined) {
    return 'null'
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (typeof value === 'number') {
    return value.toString()
  }

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]'
    }
    return JSON.stringify(value, null, 2)
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}
