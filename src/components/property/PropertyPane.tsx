import { useEffect, useRef, useState } from 'react'
import type { DbusMemberInfo } from '../../types/electron-api'
import { usePropertyAccessor } from '../../hooks/usePropertyAccessor'
import { formatDbusTypeLabel } from '../../lib/memberLabel'
import { MonitoringCommands } from '../common/MonitoringCommands'
import {
  ChevronLeft,
  Copy,
  Check,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
  XCircle,
} from 'lucide-react'
import { useTranslation } from '../../i18n'

interface PropertyPaneProps {
  member: DbusMemberInfo
  busType: 'session' | 'system'
  connectionId?: string | null
  onBack: () => void
}

export function PropertyPane({ member, busType, connectionId, onBack }: PropertyPaneProps) {
  const { t } = useTranslation()
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
      connectionId: connectionId || undefined,
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
      connectionId: connectionId || undefined,
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

  const buildMonitorCmd = () => {
    return `dbus-monitor --${busType} "type='signal',sender='${member.serviceName}',path='${member.path}',interface='org.freedesktop.DBus.Properties',member='PropertiesChanged'"`
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
    <div className="h-full flex flex-col bg-background text-text-0">
      {/* Header */}
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-surface-0 rounded-lg transition-colors group"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-text-2 group-hover:text-text-0 transition-colors" />
          </button>
          <div className="flex-1">
            <div className="text-sm text-text-2 font-mono">
              {member.interfaceName}
            </div>
            <h2 className="text-lg font-medium text-text-0 font-mono tracking-tight">
              {member.name}
            </h2>
          </div>
        </div>

        {/* Metadata chips */}
        <div className="flex flex-wrap gap-2 ml-12">
          <span className="inline-flex items-center rounded-md bg-surface-1 border border-border px-2.5 py-1 text-sm font-mono text-text-1">
            <span className="text-text-2 mr-1.5">type:</span>
            {typeLabel}
          </span>
          <span className="inline-flex items-center rounded-md bg-surface-1 border border-border px-2.5 py-1 text-sm font-mono text-text-1">
            <span className="text-text-2 mr-1.5">access:</span>
            {access}
          </span>
          <span className="inline-flex items-center rounded-md bg-surface-1 border border-border px-2.5 py-1 text-sm font-mono text-text-1">
            <span className="text-text-2 mr-1.5">path:</span>
            {member.path}
          </span>
          <span className="inline-flex items-center rounded-md bg-surface-1 border border-border px-2.5 py-1 text-sm font-mono text-text-1">
            <span className="text-text-2 mr-1.5">interface:</span>
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
                className="flex items-center gap-2 px-4 py-2 bg-success text-success-foreground font-medium rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowDownToLine className="w-4 h-4" />
                )}
                {t('property.get')}
              </button>
              <button
                onClick={() => handleCopyCommand('Get')}
                className="flex items-center gap-2 px-4 py-2 bg-surface-2 text-text-2 rounded hover:bg-surface-3 hover:text-text-0 transition-colors border border-border text-sm"
              >
                {copiedCmd === 'Get' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {t('property.copyGet')}
              </button>
            </div>

            {/* Get Command Box */}
            <div className="bg-code-bg border border-border rounded p-3 mb-4">
              <code className="font-mono text-sm text-code-text break-all leading-relaxed">
                {buildDbusSendCmd('Get')}
              </code>
            </div>

            {/* Value display */}
            {value && (
              <div
                className={`overflow-hidden rounded-lg border ${
                  value.success
                    ? 'border-success/30'
                    : 'border-error/30'
                } bg-surface-0`}
              >
                {value.success ? (
                  <div className="px-4 py-3">
                    <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-words font-mono text-sm text-text-0">
                      {formatValue(value.value)}
                    </pre>
                    {typeof value.value !== 'undefined' && (
                      <div className="mt-2 font-mono text-sm text-text-2">
                        {t('property.valueType')}{' '}
                        <span className="text-success">
                          {Array.isArray(value.value)
                            ? 'array'
                            : typeof value.value}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 px-4 py-3">
                    <XCircle className="h-4 w-4 shrink-0 text-error mt-0.5" />
                    <pre className="max-h-[300px] overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words font-mono text-sm text-error cursor-text"
                      onClick={(e) => {
                        const sel = window.getSelection()
                        if (sel && sel.toString().length > 0) return
                        const range = document.createRange()
                        range.selectNodeContents(e.currentTarget)
                        sel?.removeAllRanges()
                        sel?.addRange(range)
                      }}
                    >
                      {value.error || t('property.unknownError')}
                    </pre>
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
              <label className="block text-sm text-text-2 uppercase tracking-wider mb-2">
                {t('property.newValue')}
              </label>
              <input
                type="text"
                value={setValue}
                onChange={(e) => setSetValue(e.target.value)}
                placeholder={`${t('property.enterValue')} (${typeLabel})`}
                disabled={isLoading}
                className="w-full rounded-md border border-border bg-surface-0 px-3 py-2 font-mono text-sm text-text-0 placeholder:text-text-3 focus:border-success focus:outline-none focus:ring-1 focus:ring-success/30 disabled:opacity-50"
              />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={handleSet}
                disabled={isLoading || !setValue}
                className="flex items-center gap-2 px-4 py-2 bg-success text-success-foreground font-medium rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUpFromLine className="w-4 h-4" />
                )}
                {t('property.set')}
              </button>
              <button
                onClick={() => handleCopyCommand('Set')}
                disabled={!setValue}
                className="flex items-center gap-2 px-4 py-2 bg-surface-2 text-text-2 rounded hover:bg-surface-3 hover:text-text-0 transition-colors border border-border text-sm disabled:opacity-50"
              >
                {copiedCmd === 'Set' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {t('property.copySet')}
              </button>
            </div>

            {/* Set Command Box */}
            <div className="bg-code-bg border border-border rounded p-3 mb-4">
              <code className="font-mono text-sm text-code-text break-all leading-relaxed">
                {buildDbusSendCmd('Set')}
              </code>
            </div>

            {/* Set result */}
            {value && !value.success && (
              <div className="mt-3 overflow-hidden rounded-lg border border-error/30 bg-surface-0">
                <div className="flex items-start gap-2 px-4 py-3">
                  <XCircle className="h-4 w-4 shrink-0 text-error mt-0.5" />
                  <pre className="max-h-[300px] overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words font-mono text-sm text-error cursor-text"
                    onClick={(e) => {
                      const sel = window.getSelection()
                      if (sel && sel.toString().length > 0) return
                      const range = document.createRange()
                      range.selectNodeContents(e.currentTarget)
                      sel?.removeAllRanges()
                      sel?.addRange(range)
                    }}
                  >
                    {value.error || 'Unknown error'}
                  </pre>
                </div>
              </div>
            )}
          </section>
        )}

        {/* General error */}
        {error && !value && (
          <div className="overflow-hidden rounded-lg border border-error/30 bg-surface-0">
            <div className="flex items-start gap-2 px-4 py-3">
              <XCircle className="h-4 w-4 shrink-0 text-error mt-0.5" />
              <pre className="max-h-[300px] overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words font-mono text-sm text-error cursor-text"
                onClick={(e) => {
                  const sel = window.getSelection()
                  if (sel && sel.toString().length > 0) return
                  const range = document.createRange()
                  range.selectNodeContents(e.currentTarget)
                  sel?.removeAllRanges()
                  sel?.addRange(range)
                }}
              >
                {error}
              </pre>
            </div>
          </div>
        )}

        {/* Access info notice */}
        {!canRead && !canWrite && (
          <div className="rounded-lg border border-border bg-surface-0 px-4 py-6 text-center text-sm text-text-2">
            {t('property.accessNotRecognized', { access })}
          </div>
        )}

        <MonitoringCommands
          title={t('property.monitorProperty')}
          command={buildMonitorCmd()}
        />
      </div>
    </div>
  )
}
