import { ArrowLeft } from 'lucide-react'
import { MonitoringCommands } from '../common/MonitoringCommands'
import type { BusType, DbusMemberInfo } from '../../types/electron-api'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useTranslation } from '../../i18n'

interface SignalPaneProps {
  member: DbusMemberInfo
  busType: BusType
  connectionId?: string | null
  onBack?: () => void
}

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  UnitNew: 'Emitted when a new unit is loaded into memory.',
  UnitRemoved: 'Emitted when a unit is unloaded from memory.',
  JobNew: 'Emitted when a new job is queued.',
  JobRemoved: 'Emitted when a job completes or is removed.',
  PropertiesChanged: 'Emitted when properties change on a D-Bus interface.',
  NameAcquired: 'Emitted when this connection acquires a bus name.',
  NameLost: 'Emitted when this connection loses a bus name.',
}

export function SignalPane({ member, busType, onBack }: SignalPaneProps) {
  const { t } = useTranslation()
  const desc = SIGNAL_DESCRIPTIONS[member.name] || t('signal.defaultDesc')

  const monitorCmds = [
    { tool: 'dbus-monitor' as const, command: `dbus-monitor --${busType} "type='signal',interface='${member.interfaceName}',member='${member.name}'"` },
    { tool: 'busctl' as const, command: `busctl --${busType} monitor ${member.serviceName} ${member.path} ${member.interfaceName}.${member.name}` },
    { tool: 'gdbus' as const, command: `gdbus monitor --${busType} --dest ${member.serviceName}` },
  ]

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
          <h1 className="text-lg font-semibold">{member.name}</h1>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {busType === 'system' ? t('signal.systemBus') : t('signal.sessionBus')}
          </span>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            {t('signal.signal')}
          </span>
        </div>

        {/* Signal Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('signal.signalInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <InfoRow label={t('signal.interface')} value={member.interfaceName} mono />
              <InfoRow label={t('signal.objectPath')} value={member.path} mono />
              <InfoRow label={t('signal.description')} value={desc} />
            </div>
          </CardContent>
        </Card>

        {/* Monitoring Commands */}
        <MonitoringCommands
          title={t('signal.monitorSignal')}
          scope="signal-level"
          commands={monitorCmds}
        />
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-24 shrink-0 text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
