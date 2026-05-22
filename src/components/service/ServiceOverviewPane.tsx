import { useQuery } from '@tanstack/react-query'
import { Copy, Check, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { ipcClient } from '../../ipc/ipcClient'
import { MonitoringCommands } from '../common/MonitoringCommands'
import type { BusType, ServiceInfo } from '../../types/electron-api'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface ServiceOverviewPaneProps {
  serviceName: string
  busType: BusType
  connectionId?: string | null
  onBack?: () => void
}

export function ServiceOverviewPane({
  serviceName,
  busType,
  connectionId,
  onBack,
}: ServiceOverviewPaneProps) {
  const [copiedCmd, setCopiedCmd] = useState(false)

  const { data: info, isLoading } = useQuery<ServiceInfo>({
    queryKey: ['serviceInfo', serviceName, busType, connectionId],
    queryFn: () => ipcClient.getServiceInfo(serviceName, busType, connectionId ?? undefined),
    staleTime: 30000,
  })

  const isActive = info?.isActive !== false
  const uniqueName = info?.uniqueName ?? '-'
  const pid = info?.pid
  const processCmd = info?.processCmd
  const processName = processCmd?.split('/').pop()?.split(' ')[0] ?? '-'

  const handleCopyCmd = async () => {
    if (!processCmd) return
    await navigator.clipboard.writeText(processCmd)
    setCopiedCmd(true)
    setTimeout(() => setCopiedCmd(false), 1500)
  }

  // Build monitoring commands
  const serviceMonitorCmds = [
    { tool: 'dbus-monitor' as const, command: `dbus-monitor "destination='${serviceName}',type='method_call'"` },
    { tool: 'busctl' as const, command: `busctl monitor ${serviceName}` },
    { tool: 'gdbus' as const, command: `gdbus monitor --${busType} --dest ${serviceName}` },
  ]

  const processMonitorCmds = isActive && uniqueName !== '-'
    ? [
        { tool: 'dbus-monitor' as const, command: `dbus-monitor "sender='${uniqueName}' OR destination='${uniqueName}'"` },
        { tool: 'busctl' as const, command: `busctl monitor --unique-name=${uniqueName}` },
      ]
    : []

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-muted/30 p-6">
      <div className="mx-auto w-full max-w-[780px] space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-lg font-semibold">{serviceName}</h1>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {busType === 'system' ? 'System Bus' : 'Session Bus'}
          </span>
          {isActive ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Active
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Inactive
            </span>
          )}
        </div>

        {/* Service Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Service Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="grid grid-cols-2 gap-0">
                <InfoItem label="Service Name" value={serviceName} />
                <InfoItem label="Unique Name" value={uniqueName} mono />
                <InfoItem label="Owning Process" value={isActive ? `${processName} (PID ${pid ?? '?'})` : 'Not running'} />
                <InfoItem label="Bus Type" value={busType} />
                <InfoItem label="Start Time" value={info?.startTime ? new Date(info.startTime).toLocaleString() : '-'} />
              </div>
            )}

            {/* Startup Command */}
            {isActive && processCmd && (
              <div className="mt-3 border-t border-border pt-3">
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Startup Command
                </div>
                <div className="group flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-xs hover:bg-muted">
                  <span className="flex-1 break-all">{processCmd}</span>
                  <button
                    onClick={handleCopyCmd}
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
                    title="Copy"
                  >
                    {copiedCmd ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monitoring Commands */}
        <MonitoringCommands
          title="Monitor Service"
          scope="service-level"
          commands={serviceMonitorCmds}
        />

        {processMonitorCmds.length > 0 && (
          <MonitoringCommands
            title="Monitor Process"
            scope="process-level"
            commands={processMonitorCmds}
          />
        )}
      </div>
    </div>
  )
}

function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border-b border-r border-border px-4 py-2.5 last:border-r-0 [&:nth-child(2n)]:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  )
}
