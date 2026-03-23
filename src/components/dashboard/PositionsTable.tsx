import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { usePortfolioStore } from '@/stores/portfolio'
import { useMarketDataStore } from '@/stores/market-data'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Bell } from 'lucide-react'

export function PositionsTable({
  onSetAlert,
  onSelectSymbol,
}: {
  onSetAlert: (symbol: string) => void
  onSelectSymbol?: (symbol: string) => void
}) {
  const positions = usePortfolioStore((s) => s.positions)
  const prices = useMarketDataStore((s) => s.prices)

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground">No open positions</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a symbol to your watchlist below, then use the Buy button to open a position.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right hidden sm:table-cell">Avg Entry</TableHead>
            <TableHead className="text-right">Current</TableHead>
            <TableHead className="text-right hidden md:table-cell">P&L</TableHead>
            <TableHead className="text-right">P&L %</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((pos) => {
            const livePrice = prices[pos.symbol]?.price
            const currentPrice = livePrice ?? parseFloat(pos.current_price)
            const avgEntry = parseFloat(pos.avg_entry_price)
            const qty = parseFloat(pos.qty)
            const pnl = (currentPrice - avgEntry) * qty
            const pnlPct = avgEntry !== 0 ? ((currentPrice - avgEntry) / avgEntry) * 100 : 0
            const isPositive = pnl >= 0

            return (
              <TableRow key={pos.symbol}>
                <TableCell>
                  <button
                    className="font-medium hover:text-primary transition-colors"
                    onClick={() => onSelectSymbol?.(pos.symbol)}
                  >
                    {pos.symbol}
                  </button>
                </TableCell>
                <TableCell className="text-right">{pos.qty}</TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  {formatCurrency(avgEntry)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(currentPrice)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-mono hidden md:table-cell',
                    isPositive ? 'text-success' : 'text-danger'
                  )}
                >
                  {isPositive ? '+' : ''}
                  {formatCurrency(pnl)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-mono',
                    isPositive ? 'text-success' : 'text-danger'
                  )}
                >
                  {isPositive ? '↑' : '↓'} {Math.abs(pnlPct).toFixed(2)}%
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSetAlert(pos.symbol)}
                  >
                    <Bell className="mr-1 h-3 w-3" />
                    Alert
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
