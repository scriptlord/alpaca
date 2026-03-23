import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePortfolioStore } from '@/stores/portfolio'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

export function PortfolioSummary() {
  const account = usePortfolioStore((s) => s.account)

  if (!account) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const equity = parseFloat(account.equity)
  const lastEquity = parseFloat(account.last_equity)
  const dayPnl = equity - lastEquity
  const dayPnlPct = lastEquity !== 0 ? (dayPnl / lastEquity) * 100 : 0

  const cards = [
    { title: 'Equity', value: formatCurrency(account.equity) },
    { title: 'Cash', value: formatCurrency(account.cash) },
    {
      title: 'Day P&L',
      value: `${dayPnl >= 0 ? '+' : ''}${formatCurrency(dayPnl)} (${dayPnlPct >= 0 ? '+' : ''}${dayPnlPct.toFixed(2)}%)`,
      color: dayPnl >= 0 ? 'text-success' : 'text-danger',
    },
    { title: 'Buying Power', value: formatCurrency(account.buying_power) },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ title, value, color }) => (
        <Card key={title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
