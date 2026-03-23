import { Bell } from 'lucide-react'
import { useMarketDataStore } from '@/stores/market-data'
import { useAlertsStore } from '@/stores/alerts'
import { RECENT_ALERT_WINDOW_MS } from '@/lib/constants'
import { getNextMarketOpen } from '@/lib/market-hours'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  connected: 'bg-success',
  reconnecting: 'bg-warning',
  disconnected: 'bg-danger',
  market_closed: 'bg-muted-foreground',
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'connected': return 'Connected'
    case 'reconnecting': return 'Reconnecting...'
    case 'disconnected': return 'Disconnected'
    case 'market_closed': return `Opens ${getNextMarketOpen()}`
    default: return status
  }
}

export function Header() {
  const connectionStatus = useMarketDataStore((s) => s.connectionStatus)
  const triggeredAlerts = useAlertsStore((s) => s.triggeredAlerts)

  const recentCount = triggeredAlerts.filter(
    (a) => Date.now() - a.triggeredAt < RECENT_ALERT_WINDOW_MS
  ).length

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">Alpaca Alerts</h1>
        <div
          className="flex items-center gap-2"
          role="status"
          aria-label={`Connection status: ${getStatusLabel(connectionStatus)}`}
        >
          <div
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              statusColors[connectionStatus]
            )}
            aria-hidden="true"
          />
          <span className="text-xs text-muted-foreground">
            {getStatusLabel(connectionStatus)}
          </span>
        </div>
      </div>

      <button
        className="relative p-2 rounded-md hover:bg-accent transition-colors"
        aria-label={`Notifications${recentCount > 0 ? `, ${recentCount} recent` : ''}`}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {recentCount > 0 && (
          <span
            className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            {recentCount > 9 ? '9+' : recentCount}
          </span>
        )}
      </button>
    </header>
  )
}
