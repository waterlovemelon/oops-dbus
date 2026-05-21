import { useEffect, useRef, useState } from 'react'
import type { DbusMethodResult } from '../../types/electron-api'
import { Check, CheckCircle2, Copy, Loader2, XCircle } from 'lucide-react'

interface ResultViewProps {
  result: DbusMethodResult | null
  isInvoking: boolean
}

export function ResultView({ result, isInvoking }: ResultViewProps) {
  const [copied, setCopied] = useState(false)
  const resetCopiedTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (resetCopiedTimerRef.current !== null) {
        window.clearTimeout(resetCopiedTimerRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    if (!result) return

    await navigator.clipboard.writeText(formatResult(result.value))
    setCopied(true)

    if (resetCopiedTimerRef.current !== null) {
      window.clearTimeout(resetCopiedTimerRef.current)
    }

    resetCopiedTimerRef.current = window.setTimeout(() => {
      setCopied(false)
      resetCopiedTimerRef.current = null
    }, 2000)
  }

  if (isInvoking) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-surface-0">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-info" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-1">
              Invoking Method...
            </h3>
          </div>
        </div>
        <div className="px-5 py-8 text-center">
          <div className="inline-flex items-center gap-3 rounded-lg bg-surface-1 px-4 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-info" />
            <span className="font-mono text-sm text-text-2">Waiting for D-Bus response...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-surface-0">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-1">Result</h3>
        </div>
        <div className="px-5 py-8 text-center text-sm text-text-2">
          No result yet. Click "Invoke Method" to execute.
        </div>
      </div>
    )
  }

  if (!result.success) {
    return (
      <div className="overflow-hidden rounded-lg border border-error/30 bg-surface-0">
        <div className="border-b border-error/30 px-5 py-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-error" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-error">Error</h3>
          </div>
        </div>
        <div className="px-5 py-5">
          <div className="rounded-md border border-error/20 bg-surface-1 px-4 py-3">
            <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm text-error">
              {result.error || 'Unknown error'}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-success/30 bg-surface-0">
      <div className="border-b border-success/30 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-success">Success</h3>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-md border border-border bg-surface-1 px-3 py-1.5 text-sm text-text-1 transition-all hover:border-info hover:bg-surface-2 hover:text-info"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="px-5 py-5">
        <div className="rounded-md border border-success/10 bg-surface-1 px-4 py-3">
          <pre className="max-h-[400px] overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words font-mono text-sm text-text-0">
            {formatResult(result.value)}
          </pre>
        </div>

        {typeof result.value !== 'undefined' && (
          <div className="mt-3 font-mono text-sm text-text-2">
            Value type:{' '}
            <span className="text-info">{Array.isArray(result.value) ? 'array' : typeof result.value}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function formatResult(value: unknown): string {
  if (value === null) {
    return 'null'
  }
  if (typeof value === 'undefined') {
    return 'undefined'
  }
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }
  if (Array.isArray(value) || typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}
