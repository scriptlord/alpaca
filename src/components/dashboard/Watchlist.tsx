import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWatchlistStore } from '@/stores/watchlist'
import { searchAssets } from '@/api/alpaca-rest'
import type { Asset } from '@/lib/types'
import { Plus, X, TrendingUp, Search } from 'lucide-react'

export function Watchlist({
  onSelectSymbol,
  selectedSymbol,
}: {
  onSelectSymbol: (symbol: string) => void
  selectedSymbol?: string | null
}) {
  const symbols = useWatchlistStore((s) => s.symbols)
  const addSymbol = useWatchlistStore((s) => s.addSymbol)
  const removeSymbol = useWatchlistStore((s) => s.removeSymbol)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<Asset[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (input.trim().length < 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = window.setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchAssets(input.trim())
        setSuggestions(results.slice(0, 8))
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 150)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [input])

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (symbol: string) => {
    addSymbol(symbol)
    onSelectSymbol(symbol)
    setInput('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleAdd = () => {
    const sym = input.trim().toUpperCase()
    if (sym) {
      handleSelect(sym)
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Watchlist</h2>
      <div ref={containerRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stocks (e.g. AAPL, Tesla)"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="pl-9"
            />
          </div>
          <Button
            size="icon"
            onClick={handleAdd}
            disabled={!input.trim()}
            aria-label="Add symbol to watchlist"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg max-h-64 overflow-auto">
            {suggestions.map((asset) => (
              <button
                key={asset.symbol}
                className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                onClick={() => handleSelect(asset.symbol)}
              >
                <div>
                  <span className="font-medium">{asset.symbol}</span>
                  <span className="ml-2 text-muted-foreground truncate">
                    {asset.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {asset.exchange}
                </span>
              </button>
            ))}
          </div>
        )}

        {showSuggestions && searching && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg p-3 text-sm text-muted-foreground text-center">
            Searching...
          </div>
        )}

        {showSuggestions && !searching && input.trim().length > 0 && suggestions.length === 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg p-3 text-sm text-muted-foreground text-center">
            No matching stocks found
          </div>
        )}
      </div>

      {symbols.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Search and add stocks to your watchlist
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {symbols.map((sym) => (
            <div
              key={sym}
              className={`flex items-center gap-1 rounded-md border px-3 py-1.5 transition-colors ${
                selectedSymbol === sym
                  ? 'border-primary bg-primary text-primary-foreground font-semibold'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <button
                onClick={() => onSelectSymbol(sym)}
                className={`flex items-center gap-1 text-sm font-medium transition-colors py-1 px-1 ${
                  selectedSymbol === sym ? 'text-primary-foreground' : 'hover:text-primary'
                }`}
                aria-label={`View insights for ${sym}`}
              >
                <TrendingUp className="h-3 w-3" />
                {sym}
              </button>
              <button
                onClick={() => {
                  removeSymbol(sym)
                  if (selectedSymbol === sym) onSelectSymbol('')
                }}
                className={`ml-1 p-1 transition-colors ${
                  selectedSymbol === sym ? 'text-primary-foreground/70 hover:text-primary-foreground' : 'text-muted-foreground hover:text-danger'
                }`}
                aria-label={`Remove ${sym} from watchlist`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
