import { useAlertsStore } from '@/stores/alerts'
import { Badge } from '@/components/ui/badge'
import { timeAgo } from '@/lib/format'

export function RecentTriggers() {
  const triggeredAlerts = useAlertsStore((s) => s.triggeredAlerts)
  const recent = triggeredAlerts.slice(0, 5)

  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No alerts triggered yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {recent.map((alert) => (
        <div
          key={alert.id}
          className="rounded-lg border border-border p-3 text-sm"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{alert.symbol}</span>
            <span className="text-xs text-muted-foreground">
              {timeAgo(alert.triggeredAt)}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">{alert.condition}</p>
          <div className="mt-2 flex gap-1">
            {(['in_app', 'telegram', 'browser_push'] as const).map((ch) => {
              const status = alert.deliveryStatus[ch]
              if (status === 'skipped') return null
              return (
                <Badge
                  key={ch}
                  variant={status === 'sent' ? 'default' : 'destructive'}
                  className="text-[11px]"
                >
                  {ch === 'in_app' ? 'App' : ch === 'telegram' ? 'TG' : 'Push'}{' '}
                  {status === 'sent' ? '✓' : '✗'}
                </Badge>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
