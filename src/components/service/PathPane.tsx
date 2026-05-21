import { ArrowLeft } from 'lucide-react'
import { MonitoringCommands } from '../common/MonitoringCommands'
import type { BusType } from '../../types/electron-api'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface PathPaneProps {
  path: string
  serviceName: string
  busType: BusType
  onBack?: () => void
}

export function PathPane({ path, serviceName, busType, onBack }: PathPaneProps) {
  const monitorCmds = [
    { tool: 'dbus-monitor' as const, command: `dbus-monitor "destination='${serviceName}',path='${path}'"` },
    { tool: 'busctl' as const, command: `busctl monitor ${serviceName} ${path}` },
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
            <CardTitle className="text-sm">Path Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-0">
              <InfoItem label="Object Path" value={path} mono />
              <InfoItem label="Owning Service" value={serviceName} mono />
              <InfoItem label="Bus Type" value={busType} />
            </div>
          </CardContent>
        </Card>

        <MonitoringCommands title="Monitor Path" scope="path-level" commands={monitorCmds} />
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
