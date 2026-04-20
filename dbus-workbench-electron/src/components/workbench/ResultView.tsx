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
      <div className="overflow-hidden rounded-lg border border-[#1e2028] bg-[#0f0f15]">
        <div className="bg-gradient-to-r from-[#0f0f15] to-[#151520] px-5 py-4 border-b border-[#1e2028]">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#00d4ff]" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#c5c7ce]">
              Invoking Method...
            </h3>
          </div>
        </div>
        <div className="px-5 py-8 text-center">
          <div className="inline-flex items-center gap-3 rounded-lg bg-[#1a1a24] px-4 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#00d4ff]" />
            <span className="font-mono text-sm text-[#8b8d94]">Waiting for D-Bus response...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="overflow-hidden rounded-lg border border-[#1e2028] bg-[#0f0f15]">
        <div className="border-b border-[#1e2028] px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#c5c7ce]">Result</h3>
        </div>
        <div className="px-5 py-8 text-center text-sm text-[#6b7280]">
          No result yet. Click "Invoke Method" to execute.
        </div>
      </div>
    )
  }

  if (!result.success) {
    return (
      <div className="overflow-hidden rounded-lg border border-[#ff4d6a]/30 bg-[#0f0f15] shadow-lg shadow-[#ff4d6a]/5">
        <div className="border-b border-[#ff4d6a]/30 bg-gradient-to-r from-[#ff4d6a]/5 to-transparent px-5 py-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-[#ff4d6a]" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#ff4d6a]">Error</h3>
          </div>
        </div>
        <div className="px-5 py-5">
          <div className="rounded-md border border-[#ff4d6a]/20 bg-[#1a1a24] px-4 py-3">
            <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm text-[#ff8fa3]">
              {result.error || 'Unknown error'}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#00ff88]/30 bg-[#0f0f15] shadow-lg shadow-[#00ff88]/5">
      <div className="border-b border-[#00ff88]/30 bg-gradient-to-r from-[#00ff88]/5 to-transparent px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#00ff88]" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#00ff88]">Success</h3>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-md border border-[#2a2a35] bg-[#1a1a24] px-3 py-1.5 text-xs text-[#c5c7ce] transition-all hover:border-[#00d4ff] hover:bg-[#252530] hover:text-[#00d4ff]"
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
        <div className="rounded-md border border-[#00ff88]/10 bg-[#1a1a24] px-4 py-3">
          <pre className="max-h-[400px] overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words font-mono text-sm text-[#e5e7eb]">
            {formatResult(result.value)}
          </pre>
        </div>

        {typeof result.value !== 'undefined' && (
          <div className="mt-3 font-mono text-xs text-[#6b7280]">
            Value type:{' '}
            <span className="text-[#00d4ff]">{Array.isArray(result.value) ? 'array' : typeof result.value}</span>
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
