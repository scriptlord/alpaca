import { useMarketDataStore } from '@/stores/market-data'
import { usePortfolioStore } from '@/stores/portfolio'
import { getNextMarketOpen } from '@/lib/market-hours'
import { AlertTriangle, WifiOff, Clock } from 'lucide-react'

export function ConnectionBanner() {
  const status = useMarketDataStore((s) => s.connectionStatus)
  const lastUpdated = usePortfolioStore((s) => s.lastUpdated)

  if (status === 'connected') return null

  const timeStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString()
    : 'unknown'

  if (status === 'market_closed') {
    return (
      <div className="flex items-center gap-2 bg-muted border-b border-border px-6 py-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          US market is closed. Live prices resume {getNextMarketOpen()}.
          Portfolio data is up to date.
        </span>
      </div>
    )
  }

  if (status === 'reconnecting') {
    return (
      <div role="alert" className="flex items-center gap-2 bg-warning/10 border-b border-warning/20 px-6 py-2 text-sm text-warning">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Real-time data interrupted. Using cached data from {timeStr}.
          Reconnecting...
        </span>
      </div>
    )
  }

  return (
    <div role="alert" className="flex items-center gap-2 bg-danger/10 border-b border-danger/20 px-6 py-2 text-sm text-danger">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        Connection lost. Data may be stale. Check your API keys or network.
      </span>
    </div>
  )
}
