import { useEffect, useRef, useState } from 'react'
import type { DbusMemberInfo } from '../../types/electron-api'
import { usePropertyAccessor } from '../../hooks/usePropertyAccessor'
import { formatDbusTypeLabel } from '../../lib/memberLabel'
import {
  ChevronLeft,
  Copy,
  Check,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
  XCircle,
} from 'lucide-react'

interface PropertyPaneProps {
  member: DbusMemberInfo
  busType: 'session' | 'system'
  onBack: () => void
}

export function PropertyPane({ member, busType, onBack }: PropertyPaneProps) {
  const { getProperty, setProperty, value, isLoading, error } =
    usePropertyAccessor()
  const [setValue, setSetValue] = useState('')
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)
  const resetTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const access = member.annotation || 'read'
  const canRead = access === 'read' || access === 'readwrite'
  const canWrite = access === 'write' || access === 'readwrite'
  const typeLabel = formatDbusTypeLabel(member.signature)

  const handleGet = async () => {
    await getProperty({
      busType,
      serviceName: member.serviceName,
      path: member.path,
      interfaceName: member.interfaceName,
      propertyName: member.name,
    })
  }

  const handleSet = async () => {
    let parsedValue: any = setValue
    if (
      member.signature !== 's' &&
      member.signature !== 'o' &&
      member.signature !== 'g'
    ) {
      try {
        parsedValue = JSON.parse(setValue)
      } catch {
        // Use raw string if parse fails
      }
    }
    await setProperty({
      busType,
      serviceName: member.serviceName,
      path: member.path,
      interfaceName: member.interfaceName,
      propertyName: member.name,
      value: parsedValue,
    })
  }

  const buildDbusSendCmd = (method: 'Get' | 'Set') => {
    const parts = [
      'dbus-send',
      `--${busType}`,
      `--dest=${member.serviceName}`,
      `--type=method_call`,
      `--print-reply`,
      member.path,
      `org.freedesktop.DBus.Properties.${method}:`,
    ]
    if (method === 'Get') {
      parts.push(`string:"${member.interfaceName}"`)
      parts.push(`string:"${member.name}"`)
    } else {
      parts.push(`string:"${member.interfaceName}"`)
      parts.push(`string:"${member.name}"`)
      parts.push(`variant:string:"${setValue}"`)
    }
    return parts.join(' ')
  }

  const handleCopyCommand = async (method: 'Get' | 'Set') => {
    const cmd = buildDbusSendCmd(method)
    await navigator.clipboard.writeText(cmd)
    setCopiedCmd(method)
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current)
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopiedCmd(null)
      resetTimerRef.current = null
    }, 2000)
  }

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return 'null'
    if (typeof val === 'string') {
      try {
        return JSON.stringify(JSON.parse(val), null, 2)
      } catch {
        return val
      }
    }
    if (typeof val === 'object') return JSON.stringify(val, null, 2)
    return String(val)
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] text-[#e5e7eb]">
      {/* Header */}
      <div className="border-b border-[#1e2028] px-6 py-5">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#1a1a24] rounded-lg transition-colors group"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-[#8b8d94] group-hover:text-[#e5e7eb] transition-colors" />
          </button>
          <div className="flex-1">
            <div className="text-[11px] text-[#8b8d94] font-mono">
              {member.interfaceName}
            </div>
            <h2 className="text-xl font-medium text-[#e5e7eb] font-mono tracking-tight">
              {member.name}
            </h2>
          </div>
        </div>

        {/* Metadata chips */}
        <div className="flex flex-wrap gap-2 ml-12">
          <span className="inline-flex items-center rounded-md bg-[#1a1a24] border border-[#2a2a35] px-2.5 py-1 text-xs font-mono text-[#c5c7ce]">
            <span className="text-[#6b7280] mr-1.5">type:</span>
            {typeLabel}
          </span>
          <span className="inline-flex items-center rounded-md bg-[#1a1a24] border border-[#2a2a35] px-2.5 py-1 text-xs font-mono text-[#c5c7ce]">
            <span className="text-[#6b7280] mr-1.5">access:</span>
            {access}
          </span>
          <span className="inline-flex items-center rounded-md bg-[#1a1a24] border border-[#2a2a35] px-2.5 py-1 text-xs font-mono text-[#c5c7ce]">
            <span className="text-[#6b7280] mr-1.5">path:</span>
            {member.path}
          </span>
          <span className="inline-flex items-center rounded-md bg-[#1a1a24] border border-[#2a2a35] px-2.5 py-1 text-xs font-mono text-[#c5c7ce]">
            <span className="text-[#6b7280] mr-1.5">interface:</span>
            {member.interfaceName}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Get section */}
        {canRead && (
          <section>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={handleGet}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#4ec9b0] text-[#1e1e1e] font-medium rounded hover:bg-[#5fd4bc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowDownToLine className="w-4 h-4" />
                )}
                Get
              </button>
              <button
                onClick={() => handleCopyCommand('Get')}
                className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] text-[#858585] rounded hover:bg-[#383838] hover:text-[#d4d4d4] transition-colors border border-[#3e3e3e] text-xs"
              >
                {copiedCmd === 'Get' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copy Get
              </button>
            </div>

            {/* Get Command Box */}
            <div className="bg-[#2d2d2d] border border-[#3e3e3e] rounded p-3 mb-4">
              <code className="font-mono text-xs text-[#4ec9b0] break-all leading-relaxed">
                {buildDbusSendCmd('Get')}
              </code>
            </div>

            {/* Value display */}
            {value && (
              <div
                className={`overflow-hidden rounded-lg border ${
                  value.success
                    ? 'border-[#4ec9b0]/30'
                    : 'border-[#f44747]/30'
                } bg-[#0f0f15]`}
              >
                {value.success ? (
                  <div className="px-4 py-3">
                    <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-words font-mono text-sm text-[#e5e7eb]">
                      {formatValue(value.value)}
                    </pre>
                    {typeof value.value !== 'undefined' && (
                      <div className="mt-2 font-mono text-xs text-[#6b7280]">
                        Value type:{' '}
                        <span className="text-[#4ec9b0]">
                          {Array.isArray(value.value)
                            ? 'array'
                            : typeof value.value}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3">
                    <XCircle className="h-4 w-4 shrink-0 text-[#f44747]" />
                    <span className="font-mono text-sm text-[#f44747]">
                      {value.error || 'Unknown error'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Set section */}
        {canWrite && (
          <section>
            <div className="mb-3">
              <label className="block text-xs text-[#6b7280] uppercase tracking-wider mb-2">
                New Value
              </label>
              <input
                type="text"
                value={setValue}
                onChange={(e) => setSetValue(e.target.value)}
                placeholder={`Enter value (${typeLabel})`}
                disabled={isLoading}
                className="w-full rounded-md border border-[#2a2a35] bg-[#0f0f15] px-3 py-2 font-mono text-sm text-[#e5e7eb] placeholder:text-[#4b4d54] focus:border-[#4ec9b0] focus:outline-none focus:ring-1 focus:ring-[#4ec9b0]/30 disabled:opacity-50"
              />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={handleSet}
                disabled={isLoading || !setValue}
                className="flex items-center gap-2 px-4 py-2 bg-[#4ec9b0] text-[#1e1e1e] font-medium rounded hover:bg-[#5fd4bc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUpFromLine className="w-4 h-4" />
                )}
                Set
              </button>
              <button
                onClick={() => handleCopyCommand('Set')}
                disabled={!setValue}
                className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] text-[#858585] rounded hover:bg-[#383838] hover:text-[#d4d4d4] transition-colors border border-[#3e3e3e] text-xs disabled:opacity-50"
              >
                {copiedCmd === 'Set' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copy Set
              </button>
            </div>

            {/* Set Command Box */}
            <div className="bg-[#2d2d2d] border border-[#3e3e3e] rounded p-3 mb-4">
              <code className="font-mono text-xs text-[#4ec9b0] break-all leading-relaxed">
                {buildDbusSendCmd('Set')}
              </code>
            </div>

            {/* Set result */}
            {value && !value.success && (
              <div className="mt-3 overflow-hidden rounded-lg border border-[#f44747]/30 bg-[#0f0f15]">
                <div className="flex items-center gap-2 px-4 py-3">
                  <XCircle className="h-4 w-4 shrink-0 text-[#f44747]" />
                  <span className="font-mono text-sm text-[#f44747]">
                    {value.error || 'Unknown error'}
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* General error */}
        {error && !value && (
          <div className="overflow-hidden rounded-lg border border-[#f44747]/30 bg-[#0f0f15]">
            <div className="flex items-center gap-2 px-4 py-3">
              <XCircle className="h-4 w-4 shrink-0 text-[#f44747]" />
              <span className="font-mono text-sm text-[#f44747]">{error}</span>
            </div>
          </div>
        )}

        {/* Access info notice */}
        {!canRead && !canWrite && (
          <div className="rounded-lg border border-[#2a2a35] bg-[#0f0f15] px-4 py-6 text-center text-sm text-[#6b7280]">
            Property access mode &quot;{access}&quot; is not recognized.
          </div>
        )}
      </div>
    </div>
  )
}
