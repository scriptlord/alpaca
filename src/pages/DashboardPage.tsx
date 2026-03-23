import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PortfolioSummary } from '@/components/dashboard/PortfolioSummary'
import { PositionsTable } from '@/components/dashboard/PositionsTable'
import { RecentTriggers } from '@/components/dashboard/RecentTriggers'
import { Watchlist } from '@/components/dashboard/Watchlist'
import { StockInsightPanel } from '@/components/dashboard/StockInsightPanel'
import { getAccount, getPositions, queryKeys } from '@/api/alpaca-rest'
import { usePortfolioStore } from '@/stores/portfolio'
import { useWatchlistStore } from '@/stores/watchlist'

export function DashboardPage({
  onSetAlert,
}: {
  onSetAlert: (symbol: string) => void
}) {
  const setAccount = usePortfolioStore((s) => s.setAccount)
  const setPositions = usePortfolioStore((s) => s.setPositions)
  const watchlistSymbols = useWatchlistStore((s) => s.symbols)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)

  // Auto-select first watchlist symbol on load
  useEffect(() => {
    if (!selectedSymbol && watchlistSymbols.length > 0) {
      setSelectedSymbol(watchlistSymbols[0])
    }
  }, [watchlistSymbols, selectedSymbol])

  const { data: account } = useQuery({
    queryKey: queryKeys.account,
    queryFn: getAccount,
    refetchInterval: 30_000,
  })

  const { data: positions } = useQuery({
    queryKey: queryKeys.positions,
    queryFn: getPositions,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (account) setAccount(account)
  }, [account, setAccount])

  useEffect(() => {
    if (positions) setPositions(positions)
  }, [positions, setPositions])

  return (
    <div className="space-y-6">
      <PortfolioSummary />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Positions</h2>
            <PositionsTable
              onSetAlert={onSetAlert}
              onSelectSymbol={setSelectedSymbol}
            />
          </div>
          <Watchlist onSelectSymbol={setSelectedSymbol} selectedSymbol={selectedSymbol} />
        </div>
        <div className="space-y-6">
          {selectedSymbol ? (
            <StockInsightPanel
              symbol={selectedSymbol}
              onClose={() => setSelectedSymbol(null)}
            />
          ) : null}
          <div>
            <h2 className="mb-3 text-lg font-semibold">Recent Alerts</h2>
            <RecentTriggers />
          </div>
        </div>
      </div>
    </div>
  )
}
