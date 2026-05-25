import { ArrowLeft } from 'lucide-react'
import { MonitoringCommands } from '../common/MonitoringCommands'
import type { BusType } from '../../types/electron-api'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { KVRow } from '../common/KVRow'
import { useTranslation } from '../../i18n'

interface PathPaneProps {
  path: string
  serviceName: string
  busType: BusType
  onBack?: () => void
}

export function PathPane({ path, serviceName, busType, onBack }: PathPaneProps) {
  const { t } = useTranslation()
  const monitorCmds = [
    { tool: 'dbus-monitor' as const, command: `dbus-monitor --${busType} "destination='${serviceName}',path='${path}'"` },
    { tool: 'busctl' as const, command: `busctl --${busType} monitor ${serviceName} ${path}` },
    { tool: 'gdbus' as const, command: `gdbus monitor --${busType} --dest ${serviceName} --object-path ${path}` },
  ]

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-muted/30 p-6">
      <div className="mx-auto w-full max-w-[780px] space-y-5">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="font-mono text-lg font-semibold">{path}</h1>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">path</span>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('path.pathInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <KVRow label={t('path.objectPath')} value={path} mono />
              <KVRow label={t('path.owningService')} value={serviceName} mono />
              <KVRow label={t('path.busType')} value={busType} />
            </div>
          </CardContent>
        </Card>

        <MonitoringCommands title={t('path.monitorPath')} scope="path-level" commands={monitorCmds} />
      </div>
    </div>
  )
}

