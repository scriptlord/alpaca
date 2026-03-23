import { useEffect } from 'react'
import { CREDENTIALS_KEY } from '@/lib/constants'
import type { AlpacaCredentials } from '@/lib/types'
import { useMarketDataStore } from '@/stores/market-data'
import { usePortfolioStore } from '@/stores/portfolio'
import { wsManager } from '@/api/alpaca-ws'

export function useAlpacaWs() {
  const connectionStatus = useMarketDataStore((s) => s.connectionStatus)
  const positions = usePortfolioStore((s) => s.positions)

  useEffect(() => {
    const raw = sessionStorage.getItem(CREDENTIALS_KEY)
    if (!raw) return

    const creds = JSON.parse(raw) as AlpacaCredentials
    wsManager.connect(creds)

    return () => wsManager.disconnect()
  }, [])

  // Auto-subscribe to symbols when positions change
  useEffect(() => {
    const symbols = positions.map((p) => p.symbol)
    if (symbols.length > 0) {
      wsManager.subscribe(symbols)
    }
  }, [positions])

  return { connectionStatus }
}
