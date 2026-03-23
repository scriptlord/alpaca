import { create } from 'zustand'
import type { ConnectionStatus, MarketQuote } from '@/lib/types'
import { isMarketOpen } from '@/lib/market-hours'

interface MarketDataState {
  prices: Record<string, MarketQuote>
  connectionStatus: ConnectionStatus
  subscribedSymbols: string[]
  updatePrice: (symbol: string, price: number) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setSubscribedSymbols: (symbols: string[]) => void
}

// RAF batching: buffer high-frequency WebSocket updates and flush once per frame
let pendingUpdates: MarketQuote[] = []
let rafScheduled = false

export const useMarketDataStore = create<MarketDataState>((set) => {
  function flushUpdates() {
    if (pendingUpdates.length === 0) return
    const updates = [...pendingUpdates]
    pendingUpdates = []
    rafScheduled = false
    set((state) => {
      const newPrices = { ...state.prices }
      for (const u of updates) {
        newPrices[u.symbol] = u
      }
      return { prices: newPrices }
    })
  }

  return {
    prices: {},
    connectionStatus: isMarketOpen() ? 'disconnected' : 'market_closed',
    subscribedSymbols: [],

    updatePrice: (symbol: string, price: number) => {
      pendingUpdates.push({ symbol, price, timestamp: Date.now() })
      if (!rafScheduled) {
        rafScheduled = true
        requestAnimationFrame(flushUpdates)
      }
    },

    setConnectionStatus: (status: ConnectionStatus) => {
      set({ connectionStatus: status })
    },

    setSubscribedSymbols: (symbols: string[]) => {
      set({ subscribedSymbols: symbols })
    },
  }
})
