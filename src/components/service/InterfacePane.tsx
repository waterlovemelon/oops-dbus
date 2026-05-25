import { ArrowLeft, Zap, Activity, Settings } from 'lucide-react'
import { MonitoringCommands } from '../common/MonitoringCommands'
import type { BusType, DbusMemberInfo } from '../../types/electron-api'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { KVRow } from '../common/KVRow'
import { useTranslation } from '../../i18n'

interface InterfacePaneProps {
  interfaceName: string
  path: string
  serviceName: string
  busType: BusType
  members?: DbusMemberInfo[]
  onBack?: () => void
}

export function InterfacePane({
  interfaceName,
  path,
  serviceName,
  busType,
  members = [],
  onBack,
}: InterfacePaneProps) {
  const { t } = useTranslation()
  const methods = members.filter((m) => m.type === 'method')
  const signals = members.filter((m) => m.type === 'signal')
  const properties = members.filter((m) => m.type === 'property')

  const monitorCmds = [
    { tool: 'dbus-monitor' as const, command: `dbus-monitor --${busType} "destination='${serviceName}',path='${path}',interface='${interfaceName}'"` },
    { tool: 'busctl' as const, command: `busctl --${busType} monitor ${serviceName} ${path} ${interfaceName}` },
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
          <h1 className="text-lg font-semibold">{interfaceName}</h1>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">interface</span>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('interface.interfaceInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <KVRow label={t('interface.interfaceName')} value={interfaceName} mono />
              <KVRow label={t('interface.objectPath')} value={path} mono />
              <KVRow label={t('interface.owningService')} value={serviceName} mono />
              <KVRow label={t('interface.busType')} value={busType} />
            </div>
            <div className="mt-2 flex gap-5 border-t border-border pt-2.5">
              <StatChip icon={<Zap className="h-3 w-3 text-orange-500" />} count={methods.length} label={t('interface.methods')} />
              <StatChip icon={<Activity className="h-3 w-3 text-purple-500" />} count={signals.length} label={t('interface.signals')} />
              <StatChip icon={<Settings className="h-3 w-3 text-cyan-500" />} count={properties.length} label={t('interface.properties')} />
            </div>
          </CardContent>
        </Card>

        <MonitoringCommands title={t('interface.monitorInterface')} scope="interface-level" commands={monitorCmds} />
      </div>
    </div>
  )
}


function StatChip({ icon, count, label }: { icon: React.ReactNode; count: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {icon}
      <span className="font-semibold text-foreground">{count}</span> {label}
    </div>
  )
}
