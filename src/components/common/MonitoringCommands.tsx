import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

export interface MonitorCommand {
  tool: 'dbus-monitor' | 'busctl' | 'gdbus'
  command: string
}

interface MonitoringCommandsProps {
  title: string
  scope: string
  commands: MonitorCommand[]
}

export function MonitoringCommands({ title, scope, commands }: MonitoringCommandsProps) {
  const [activeTool, setActiveTool] = useState<string>(commands[0]?.tool ?? 'dbus-monitor')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const activeCommand = commands.find((c) => c.tool === activeTool)

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(commands.map((c) => c.command).join('\n'))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1500)
  }

  if (commands.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          {title}
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {scope}
          </span>
        </CardTitle>
        <div className="flex items-center gap-1">
          {/* Tool tabs */}
          <div className="inline-flex rounded border border-border">
            {commands.map((cmd) => (
              <button
                key={cmd.tool}
                onClick={() => setActiveTool(cmd.tool)}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors border-r border-border last:border-r-0 ${
                  activeTool === cmd.tool
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                {cmd.tool}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-6 text-[11px]" onClick={handleCopyAll}>
            {copiedAll ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span className="ml-1">Copy All</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {activeCommand && (
          <div className="group flex items-center gap-2 rounded bg-muted/50 px-3 py-2 font-mono text-xs hover:bg-muted">
            <span className="flex-1 break-all text-foreground">{activeCommand.command}</span>
            <button
              onClick={() => handleCopy(activeCommand.command, -1)}
              className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
              title="Copy"
            >
              {copiedIndex === -1 ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
