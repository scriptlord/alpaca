import { useState, useEffect, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAlertsStore } from '@/stores/alerts'
import { usePortfolioStore } from '@/stores/portfolio'
import { useWatchlistStore } from '@/stores/watchlist'
import { searchAssets } from '@/api/alpaca-rest'
import { formatCondition } from '@/engine/condition-evaluator'
import { DEFAULT_COOLDOWN_MINUTES } from '@/lib/constants'
import type { AlertMetric, AlertOperator, AlertRule, NotificationChannel, Asset } from '@/lib/types'
import { Search } from 'lucide-react'

const METRICS: { value: AlertMetric; label: string }[] = [
  { value: 'price', label: 'Price' },
  { value: 'pnl_pct', label: 'P&L %' },
  { value: 'pnl_usd', label: 'P&L $' },
  { value: 'order_status', label: 'Order Status' },
]

export function AlertBuilderDrawer({
  open,
  onClose,
  prefillSymbol,
}: {
  open: boolean
  onClose: () => void
  prefillSymbol?: string
}) {
  const positions = usePortfolioStore((s) => s.positions)
  const watchlistSymbols = useWatchlistStore((s) => s.symbols)
  const addRule = useAlertsStore((s) => s.addRule)

  const [step, setStep] = useState(0)
  const [suggestions, setSuggestions] = useState<Asset[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [symbol, setSymbol] = useState(prefillSymbol ?? '')
  const [metric, setMetric] = useState<AlertMetric>('price')
  const [operator, setOperator] = useState<AlertOperator>('below')
  const [threshold, setThreshold] = useState('')
  const [channels, setChannels] = useState<NotificationChannel[]>(['in_app'])

  const resetAndClose = () => {
    setStep(0)
    setSymbol(prefillSymbol ?? '')
    setMetric('price')
    setOperator('below')
    setThreshold('')
    setChannels(['in_app'])
    onClose()
  }

  const toggleChannel = (ch: NotificationChannel) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    )
  }

  const previewRule: Partial<AlertRule> = {
    symbol,
    metric,
    operator,
    threshold: parseFloat(threshold) || 0,
  }

  const handleSave = () => {
    const rule: AlertRule = {
      id: crypto.randomUUID(),
      symbol,
      metric,
      operator,
      threshold: parseFloat(threshold),
      channels,
      active: true,
      cooldownMinutes: DEFAULT_COOLDOWN_MINUTES,
      lastTriggeredAt: null,
      createdAt: Date.now(),
    }
    addRule(rule)
    resetAndClose()
  }

  const canProceed = () => {
    switch (step) {
      case 0:
        return symbol.length > 0
      case 1:
        return true
      case 2:
        return true
      case 3:
        return threshold.length > 0 && !isNaN(parseFloat(threshold))
      case 4:
        return channels.length > 0
      default:
        return true
    }
  }

  const positionSymbols = positions.map((p) => p.symbol)

  return (
    <Sheet open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto px-6 py-6">
        <SheetHeader>
          <SheetTitle>Create Alert</SheetTitle>
          <SheetDescription>
            Step {step + 1} of 6
          </SheetDescription>
        </SheetHeader>


        <div className="mt-6 space-y-6">
          {step === 0 && (
            <div className="space-y-6">
              <div className="space-y-2" ref={dropdownRef}>
                <Label>Select Asset</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search stocks (e.g. AAPL, Tesla)"
                    value={symbol}
                    className="pl-9"
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase()
                      setSymbol(val)
                      if (debounceRef.current) clearTimeout(debounceRef.current)
                      if (val.length >= 1) {
                        debounceRef.current = window.setTimeout(async () => {
                          try {
                            const results = await searchAssets(val)
                            setSuggestions(results.slice(0, 6))
                            setShowSuggestions(true)
                          } catch { setSuggestions([]) }
                        }, 150)
                      } else {
                        setSuggestions([])
                        setShowSuggestions(false)
                      }
                    }}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg max-h-48 overflow-auto">
                      {suggestions.map((asset) => (
                        <button
                          key={asset.symbol}
                          className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                          onClick={() => {
                            setSymbol(asset.symbol)
                            setShowSuggestions(false)
                          }}
                        >
                          <span className="font-medium">{asset.symbol}</span>
                          <span className="text-muted-foreground text-xs truncate ml-2">{asset.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Watchlist symbols */}
              {watchlistSymbols.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Watchlist:</p>
                  <div className="flex flex-wrap gap-2">
                    {watchlistSymbols.map((s) => (
                      <Button
                        key={s}
                        variant={symbol === s ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => { setSymbol(s); setShowSuggestions(false) }}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Position symbols */}
              {positionSymbols.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Your positions:</p>
                  <div className="flex flex-wrap gap-2">
                    {positionSymbols.map((s) => (
                      <Button
                        key={s}
                        variant={symbol === s ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => { setSymbol(s); setShowSuggestions(false) }}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Label>Pick Metric</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {METRICS.map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={metric === value ? 'default' : 'outline'}
                    onClick={() => setMetric(value)}
                    className="h-12"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label>Choose Operator</Label>
              <div className="flex gap-2">
                {(['above', 'below'] as const).map((op) => (
                  <Button
                    key={op}
                    variant={operator === op ? 'default' : 'outline'}
                    onClick={() => setOperator(op)}
                    className="flex-1 h-12 capitalize"
                  >
                    {op}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label>Set Threshold</Label>
              <Input
                type="number"
                placeholder={metric === 'pnl_pct' ? 'e.g. -5' : 'e.g. 175'}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {metric === 'price' && 'Enter the price level in USD'}
                {metric === 'pnl_pct' && 'Enter the P&L percentage (e.g. -5 for -5%)'}
                {metric === 'pnl_usd' && 'Enter the P&L amount in USD'}
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Label>Delivery Channels</Label>
              <div className="space-y-3">
                {([
                  { value: 'in_app' as const, label: 'In-App Toast' },
                  { value: 'telegram' as const, label: 'Telegram' },
                  { value: 'browser_push' as const, label: 'Browser Push' },
                ]).map(({ value, label }) => (
                  <div key={value} className="flex items-center gap-2">
                    <Checkbox
                      id={value}
                      checked={channels.includes(value)}
                      onCheckedChange={() => toggleChannel(value)}
                    />
                    <Label htmlFor={value} className="font-normal">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <Label>Preview</Label>
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm">
                  Alert me when{' '}
                  <span className="font-semibold">
                    {formatCondition(previewRule as AlertRule)}
                  </span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  via {channels.map((c) => c === 'in_app' ? 'In-App' : c === 'telegram' ? 'Telegram' : 'Browser Push').join(' + ')}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Back
              </Button>
            )}
            {step < 5 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1"
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSave} className="flex-1">
                Save Alert
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
