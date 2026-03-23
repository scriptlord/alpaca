import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAlertsStore } from '@/stores/alerts'
import { Badge } from '@/components/ui/badge'
import { formatTime } from '@/lib/format'

export function TriggeredAlertsFeed() {
  const triggeredAlerts = useAlertsStore((s) => s.triggeredAlerts)
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: triggeredAlerts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  })

  if (triggeredAlerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No alerts have triggered yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your triggered alerts will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Triggered Alerts</h2>
      <div
        ref={parentRef}
        className="h-[300px] md:h-[500px] overflow-auto rounded-lg border border-border"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const alert = triggeredAlerts[virtualItem.index]
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="border-b border-border p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{alert.symbol}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(alert.triggeredAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {alert.condition}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">
                    Actual: {alert.actualValue.toFixed(2)} | Threshold:{' '}
                    {alert.thresholdValue.toFixed(2)}
                  </span>
                  <div className="flex gap-1">
                    {(['in_app', 'telegram', 'browser_push'] as const).map(
                      (ch) => {
                        const status = alert.deliveryStatus[ch]
                        if (status === 'skipped') return null
                        return (
                          <Badge
                            key={ch}
                            variant={
                              status === 'sent' ? 'default' : 'destructive'
                            }
                            className="text-[11px] px-1.5"
                          >
                            {status === 'sent' ? '✓' : '✗'}
                          </Badge>
                        )
                      }
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
