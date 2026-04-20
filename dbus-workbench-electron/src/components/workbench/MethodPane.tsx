import { useEffect, useState } from 'react'
import type { DbusArgumentInfo, DbusMemberInfo } from '../../types/electron-api'
import { formatDbusTypeLabel } from '../../lib/memberLabel'
import { ArgumentForm } from './ArgumentForm'
import { ResultView } from './ResultView'
import { useMethodInvoker } from '../../hooks/useMethodInvoker'
import { ChevronLeft, Play, RotateCcw } from 'lucide-react'

interface MethodPaneProps {
  member: DbusMemberInfo
  busType: 'session' | 'system'
  onBack: () => void
}

function renderArgumentSummary(args: DbusArgumentInfo[]): string {
  if (args.length === 0) {
    return 'None'
  }
  return args
    .map((arg) => {
      const typeLabel = formatDbusTypeLabel(arg.type)
      return arg.name ? `${arg.name}: ${typeLabel}` : typeLabel
    })
    .join(', ')
}

export function MethodPane({ member, busType, onBack }: MethodPaneProps) {
  const [args, setArgs] = useState<any[]>([])
  const { invoke, result, isInvoking, clearResult } = useMethodInvoker()

  // Initialize arguments array based on inputArgs
  useEffect(() => {
    setArgs(new Array(member.inputArgs.length).fill(null))
  }, [member.inputArgs])

  const handleInvoke = async () => {
    await invoke({
      busType,
      serviceName: member.serviceName,
      path: member.path,
      interfaceName: member.interfaceName,
      methodName: member.name,
      args: args,
    })
  }

  const handleReset = () => {
    setArgs(new Array(args.length).fill(null))
    clearResult()
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] text-[#e5e7eb]">
      {/* Header */}
      <div className="border-b border-[#1e2028] px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#1a1a24] rounded-lg transition-colors group"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-[#8b8d94] group-hover:text-[#e5e7eb] transition-colors" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#00d4ff] font-mono tracking-tight">
              {member.name}
            </h2>
            <div className="mt-2 space-y-1">
              <div className="text-sm text-[#8b8d94] font-mono">
                <span className="text-[#6b7280]">interface:</span>{' '}
                <span className="text-[#c5c7ce]">{member.interfaceName}</span>
              </div>
              <div className="text-sm text-[#8b8d94] font-mono">
                <span className="text-[#6b7280]">path:</span>{' '}
                <span className="text-[#c5c7ce]">{member.path}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Parameter summaries */}
        <div className="mt-4 flex gap-6">
          <div className="flex-1 bg-[#0f0f15] rounded-lg px-4 py-3 border border-[#1e2028]">
            <div className="text-xs text-[#6b7280] uppercase tracking-wider mb-1">
              Input Parameters
            </div>
            <div className="font-mono text-sm text-[#00d4ff]">
              {renderArgumentSummary(member.inputArgs)}
            </div>
          </div>
          <div className="flex-1 bg-[#0f0f15] rounded-lg px-4 py-3 border border-[#1e2028]">
            <div className="text-xs text-[#6b7280] uppercase tracking-wider mb-1">
              Output Parameters
            </div>
            <div className="font-mono text-sm text-[#00d4ff]">
              {renderArgumentSummary(member.outputArgs)}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Arguments Section */}
        {member.inputArgs.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#c5c7ce] uppercase tracking-wider mb-4">
              Arguments
            </h3>
            <ArgumentForm
              args={member.inputArgs}
              values={args}
              onChange={setArgs}
              disabled={isInvoking}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleInvoke}
            disabled={isInvoking}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#00d4ff] to-[#0099cc] text-[#0a0a0f] font-semibold rounded-lg hover:from-[#00e5ff] hover:to-[#00aadd] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#00d4ff]/20 font-mono"
          >
            <Play className="w-4 h-4" />
            {isInvoking ? 'Invoking...' : 'Invoke Method'}
          </button>
          <button
            onClick={handleReset}
            disabled={isInvoking}
            className="flex items-center gap-2 px-4 py-3 bg-[#1a1a24] text-[#c5c7ce] rounded-lg hover:bg-[#252530] disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-[#2a2a35]"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Results */}
        <ResultView result={result} isInvoking={isInvoking} />
      </div>
    </div>
  )
}

