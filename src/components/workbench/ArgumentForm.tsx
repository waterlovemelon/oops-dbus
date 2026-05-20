import { useEffect, useMemo, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import type { DbusArgumentInfo } from '../../types/electron-api'
import { parseDbusSignature } from '../../lib/dbusSignature'
import { formatDbusTypeLabel } from '../../lib/memberLabel'

interface ArgumentFormProps {
  args: DbusArgumentInfo[]
  values: any[]
  onChange: (values: any[]) => void
  disabled?: boolean
}

export function ArgumentForm({ args, values, onChange, disabled }: ArgumentFormProps) {
  const parsedArgs = useMemo(
    () =>
      args.map((arg) => ({
        ...parseDbusSignature(arg.type)[0],
        name: arg.name,
        rawType: arg.type,
      })),
    [args]
  )
  const [complexInputTexts, setComplexInputTexts] = useState<Record<number, string>>({})
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({})

  useEffect(() => {
    setComplexInputTexts(
      Object.fromEntries(
        parsedArgs
          .map((arg, index) =>
            arg.complexType
              ? [index, typeof values[index] === 'string' ? values[index] : serializeComplexValue(values[index])]
              : null
          )
          .filter((entry): entry is [number, string] => entry !== null)
      )
    )
  }, [parsedArgs, values])

  const handleValueChange = (index: number, value: unknown) => {
    const newValues = [...values]
    newValues[index] = value
    onChange(newValues)

    const arg = parsedArgs[index]
    if (!arg) {
      return
    }

    const error = validateValue(value, arg.type)
    setValidationErrors((prev) => ({
      ...prev,
      [index]: error || '',
    }))
  }

  const handleComplexValueChange = (index: number, text: string) => {
    setComplexInputTexts((prev) => ({
      ...prev,
      [index]: text,
    }))

    try {
      handleValueChange(index, JSON.parse(text))
    } catch {
      handleValueChange(index, text)
    }
  }

  if (parsedArgs.length === 0) {
    return (
      <div className="rounded-lg border border-[#1e2028] bg-[#0f0f15] px-4 py-4 text-sm italic text-[#6b7280]">
        No arguments required
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {parsedArgs.map((arg, index) => (
        <div
          key={`${arg.type}-${index}`}
          className="rounded-lg border border-[#1e2028] bg-[#0f0f15] p-4 transition-all"
          style={{
            animation: 'slideIn 0.3s ease-out forwards',
            animationDelay: `${index * 50}ms`,
          }}
        >
          <div className="flex items-start gap-4">
            <div className="w-40 flex-shrink-0">
              <div className="font-mono text-xs font-medium text-[#00d4ff]">
                {arg.name || `Argument ${index + 1}`}
              </div>
              <div className="mt-1 font-mono text-xs text-[#6b7280]">
                {formatDbusTypeLabel(arg.rawType)}
              </div>
            </div>

            <div className="flex-1">
              <label className="mb-2 block text-xs text-[#c5c7ce]">{arg.description}</label>

              {arg.complexType ? (
                <div>
                  <textarea
                    value={complexInputTexts[index] ?? ''}
                    onChange={(event) => handleComplexValueChange(index, event.target.value)}
                    disabled={disabled}
                    className="min-h-[80px] w-full resize-y rounded-md border border-[#2a2a35] bg-[#1a1a24] px-3 py-2 font-mono text-xs text-[#e5e7eb] transition-all focus:border-[#00d4ff] focus:outline-none focus:ring-1 focus:ring-[#00d4ff] disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={getPlaceholderForType(arg.type)}
                    rows={3}
                  />
                  <div className="mt-2 text-xs text-[#6b7280]">
                    Enter as JSON (e.g., {getExampleForType(arg.type)})
                  </div>
                </div>
              ) : (
                <input
                  type={getInputType(arg.type)}
                  value={values[index] ?? ''}
                  onChange={(event) => handleValueChange(index, parseScalarValue(event.target.value, arg.type))}
                  disabled={disabled}
                  className="w-full rounded-md border border-[#2a2a35] bg-[#1a1a24] px-3 py-2 font-mono text-xs text-[#e5e7eb] transition-all focus:border-[#00d4ff] focus:outline-none focus:ring-1 focus:ring-[#00d4ff] disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={getPlaceholderForType(arg.type)}
                />
              )}

              {validationErrors[index] && (
                <div className="mt-2 flex items-start gap-2 text-xs text-[#ff4d6a]">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{validationErrors[index]}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

function parseScalarValue(value: string, type: string): unknown {
  switch (type) {
    case 'y':
    case 'n':
    case 'q':
    case 'i':
    case 'u':
    case 'x':
    case 't':
      return parseInt(value, 10)
    case 'd':
      return parseFloat(value)
    case 'b':
      return value.toLowerCase() === 'true' || value === '1'
    default:
      return value
  }
}

function serializeComplexValue(value: unknown): string {
  if (typeof value === 'undefined') {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value, null, 2)
}

function getInputType(type: string): string {
  switch (type) {
    case 'y':
    case 'n':
    case 'q':
    case 'i':
    case 'u':
    case 'x':
    case 't':
    case 'd':
      return 'number'
    default:
      return 'text'
  }
}

function getPlaceholderForType(type: string): string {
  if (type.startsWith('a{')) {
    return '{"key1": "value1", "key2": "value2"}'
  }
  if (type.startsWith('a(')) {
    return '[{"field1": "value1", "field2": "value2"}]'
  }
  if (type.startsWith('a')) {
    return '["item1", "item2", "item3"]'
  }
  if (type.startsWith('(')) {
    return '{"field1": "value1", "field2": "value2"}'
  }

  switch (type) {
    case 'y':
      return '0-255'
    case 'b':
      return 'true or false'
    case 'n':
      return '-32768 to 32767'
    case 'q':
      return '0 to 65535'
    case 'i':
      return '-2147483648 to 2147483647'
    case 'u':
      return '0 to 4294967295'
    case 'd':
      return '3.14159'
    case 's':
      return 'text string'
    case 'o':
      return '/org/example/Object'
    case 'g':
      return 'sii'
    default:
      return 'value'
  }
}

function getExampleForType(type: string): string {
  if (type.startsWith('a{')) {
    return '{"name": "John", "age": 30}'
  }
  if (type.startsWith('a(')) {
    return '[{"x": 1, "y": 2}]'
  }
  if (type.startsWith('a')) {
    return '["a", "b", "c"]'
  }
  if (type.startsWith('(')) {
    return '{"x": 10, "y": 20}'
  }
  return 'value'
}

function validateValue(value: unknown, type: string): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  switch (type) {
    case 'y':
      if (typeof value !== 'number' || value < 0 || value > 255) {
        return 'Byte must be between 0 and 255'
      }
      break
    case 'b':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return 'Must be true or false'
      }
      break
    case 'i':
      if (typeof value !== 'number' || value < -2147483648 || value > 2147483647) {
        return 'Int32 must be between -2147483648 and 2147483647'
      }
      break
  }

  return null
}
