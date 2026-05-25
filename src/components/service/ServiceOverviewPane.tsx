import { useQuery } from '@tanstack/react-query'
import { Copy, Check, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { ipcClient } from '../../ipc/ipcClient'
import { MonitoringCommands } from '../common/MonitoringCommands'
import type { BusType, ServiceInfo } from '../../types/electron-api'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { KVRow } from '../common/KVRow'
import { useTranslation } from '../../i18n'

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
  const { t } = useTranslation()
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
    { tool: 'dbus-monitor' as const, command: `dbus-monitor --${busType} "destination='${serviceName}',type='method_call'"` },
    { tool: 'busctl' as const, command: `busctl --${busType} monitor ${serviceName}` },
    { tool: 'gdbus' as const, command: `gdbus monitor --${busType} --dest ${serviceName}` },
  ]

  const processMonitorCmds = isActive && uniqueName !== '-'
    ? [
        { tool: 'dbus-monitor' as const, command: `dbus-monitor --${busType} "sender='${uniqueName}' OR destination='${uniqueName}'"` },
        { tool: 'busctl' as const, command: `busctl --${busType} monitor --unique-name=${uniqueName}` },
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
            {busType === 'system' ? t('service.systemBus') : t('service.sessionBus')}
          </span>
          {isActive ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {t('service.active')}
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {t('service.inactive')}
            </span>
          )}
        </div>

        {/* Service Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('service.serviceInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">{t('service.loading')}</div>
            ) : (
              <div>
                <KVRow label={t('service.serviceName')} value={serviceName} />
                <KVRow label={t('service.uniqueName')} value={uniqueName} mono />
                <KVRow label={t('service.owningProcess')} value={isActive ? `${processName} (PID ${pid ?? '?'})` : t('service.notRunning')} />
                <KVRow label={t('service.busType')} value={busType} />
                <KVRow label={t('service.startTime')} value={info?.startTime ? new Date(info.startTime).toLocaleString() : '-'} />
              </div>
            )}

            {/* Startup Command */}
            {isActive && processCmd && (
              <div className="mt-3 border-t border-border pt-3">
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t('service.startupCommand')}
                </div>
                <div className="group flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-xs hover:bg-muted">
                  <span className="flex-1 break-all">{processCmd}</span>
                  <button
                    onClick={handleCopyCmd}
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
                    title={t('monitor.copy')}
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
          title={t('service.monitorService')}
          scope="service-level"
          commands={serviceMonitorCmds}
        />

        {processMonitorCmds.length > 0 && (
          <MonitoringCommands
            title={t('service.monitorProcess')}
            scope="process-level"
            commands={processMonitorCmds}
          />
        )}
      </div>
    </div>
  )
}

