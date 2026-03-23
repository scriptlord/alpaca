import { create } from 'zustand'
import { WATCHLIST_STORAGE_KEY } from '@/lib/constants'

interface WatchlistState {
  symbols: string[]
  addSymbol: (symbol: string) => void
  removeSymbol: (symbol: string) => void
  setSymbols: (symbols: string[]) => void
}

const STORAGE_KEY = WATCHLIST_STORAGE_KEY
const DEFAULT_WATCHLIST = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN']

function loadFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      return parsed.length > 0 ? parsed : DEFAULT_WATCHLIST
    }
    return DEFAULT_WATCHLIST
  } catch {
    return DEFAULT_WATCHLIST
  }
}

function saveToStorage(symbols: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols))
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  symbols: loadFromStorage(),

  addSymbol: (symbol) => {
    const upper = symbol.toUpperCase()
    if (get().symbols.includes(upper)) return
    const updated = [...get().symbols, upper]
    set({ symbols: updated })
    saveToStorage(updated)
  },

  removeSymbol: (symbol) => {
    const updated = get().symbols.filter((s) => s !== symbol)
    set({ symbols: updated })
    saveToStorage(updated)
  },

  setSymbols: (symbols) => {
    set({ symbols })
    saveToStorage(symbols)
  },
}))
