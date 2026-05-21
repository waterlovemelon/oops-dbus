import { ArrowLeft, Zap, Activity, Settings } from 'lucide-react'
import { MonitoringCommands } from '../common/MonitoringCommands'
import type { BusType, DbusMemberInfo } from '../../types/electron-api'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

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
  const methods = members.filter((m) => m.type === 'method')
  const signals = members.filter((m) => m.type === 'signal')
  const properties = members.filter((m) => m.type === 'property')

  const monitorCmds = [
    { tool: 'dbus-monitor' as const, command: `dbus-monitor "destination='${serviceName}',path='${path}',interface='${interfaceName}'"` },
    { tool: 'busctl' as const, command: `busctl monitor ${serviceName} ${path} ${interfaceName}` },
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
            <CardTitle className="text-sm">Interface Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-0">
              <InfoItem label="Interface Name" value={interfaceName} mono />
              <InfoItem label="Object Path" value={path} mono />
              <InfoItem label="Owning Service" value={serviceName} mono />
              <InfoItem label="Bus Type" value={busType} />
            </div>
            <div className="flex gap-4 border-t border-border bg-muted/30 px-4 py-2.5">
              <StatChip icon={<Zap className="h-3 w-3 text-orange-500" />} count={methods.length} label="Methods" />
              <StatChip icon={<Activity className="h-3 w-3 text-purple-500" />} count={signals.length} label="Signals" />
              <StatChip icon={<Settings className="h-3 w-3 text-cyan-500" />} count={properties.length} label="Properties" />
            </div>
          </CardContent>
        </Card>

        <MonitoringCommands title="Monitor Interface" scope="interface-level" commands={monitorCmds} />
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

function StatChip({ icon, count, label }: { icon: React.ReactNode; count: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {icon}
      <span className="font-semibold text-foreground">{count}</span> {label}
    </div>
  )
}
