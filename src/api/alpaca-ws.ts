import {
  ALPACA_MARKET_WS,
  ALPACA_TRADE_WS,
  WS_RECONNECT_BASE_MS,
  WS_RECONNECT_MAX_MS,
  REST_POLL_INTERVAL_MS,
} from '@/lib/constants'
import type { AlpacaCredentials } from '@/lib/types'
import { useMarketDataStore } from '@/stores/market-data'
import { usePortfolioStore } from '@/stores/portfolio'
import { getPositions, getAccount } from './alpaca-rest'
import { isMarketOpen } from '@/lib/market-hours'

class AlpacaWebSocketManager {
  private marketWs: WebSocket | null = null
  private tradeWs: WebSocket | null = null
  private reconnectAttempts = { market: 0, trade: 0 }
  private marketAuthFailed = false
  private pollInterval: number | null = null
  private credentials: AlpacaCredentials | null = null
  private isDestroyed = false

  connect(credentials: AlpacaCredentials): void {
    this.credentials = credentials
    this.isDestroyed = false

    // Check market hours before attempting market data WebSocket
    if (!isMarketOpen()) {
      useMarketDataStore.getState().setConnectionStatus('market_closed')
      // Poll every 60s to auto-connect when market opens
      this.scheduleMarketOpenCheck()
    } else {
      this.connectMarketStream()
    }
    this.connectTradeStream()
  }

  private marketCheckScheduled = false

  private scheduleMarketOpenCheck(): void {
    if (this.marketCheckScheduled) return
    this.marketCheckScheduled = true
    setTimeout(() => {
      this.marketCheckScheduled = false
      if (this.isDestroyed) return
      if (isMarketOpen()) {
        this.reconnectAttempts = { market: 0, trade: 0 }
        this.connectMarketStream()
        this.connectTradeStream()
      } else {
        useMarketDataStore.getState().setConnectionStatus('market_closed')
        this.scheduleMarketOpenCheck()
      }
    }, 60_000)
  }

  private connectMarketStream(): void {
    if (this.isDestroyed || !this.credentials) return

    console.log('[WS Market] Connecting to', ALPACA_MARKET_WS)
    const ws = new WebSocket(ALPACA_MARKET_WS)
    this.marketWs = ws

    ws.onopen = () => {
      console.log('[WS Market] Connected, authenticating...')
      ws.send(
        JSON.stringify({
          action: 'auth',
          key: this.credentials!.apiKey,
          secret: this.credentials!.secretKey,
        })
      )
    }

    ws.onmessage = (event: MessageEvent) => {
      let messages: Array<Record<string, unknown>>
      try {
        messages = JSON.parse(event.data as string) as Array<Record<string, unknown>>
      } catch {
        console.warn('Market WS: malformed message', event.data)
        return
      }
      for (const msg of messages) {
        if (msg.T === 'success' && msg.msg === 'connected') {
          console.log('[WS Market] WebSocket connected to Alpaca')
        } else if (msg.T === 'success' && msg.msg === 'authenticated') {
          console.log('[WS Market] Authenticated successfully')
          this.reconnectAttempts.market = 0
          this.stopRestPolling()
          useMarketDataStore.getState().setConnectionStatus('connected')
          // Subscribe to symbols from current positions
          this.subscribeToPositionSymbols()
        } else if (msg.T === 't') {
          // Trade message: { T: "t", S: "AAPL", p: 175.50, ... }
          useMarketDataStore.getState().updatePrice(
            msg.S as string,
            msg.p as number
          )
        } else if (msg.T === 'q') {
          // Quote message: { T: "q", S: "AAPL", bp: 175.50, ap: 175.55, ... }
          const midPrice =
            ((msg.bp as number) + (msg.ap as number)) / 2
          useMarketDataStore.getState().updatePrice(
            msg.S as string,
            midPrice
          )
        } else if (msg.T === 'error') {
          console.error('[WS Market] Error message:', msg)
          // Auth failed (402) — stop retrying, feed not available for this account
          if (msg.code === 402 || msg.msg === 'auth failed') {
            console.warn('[WS Market] Auth failed — using REST polling fallback.')
            this.marketAuthFailed = true
            useMarketDataStore.getState().setConnectionStatus('connected')
            this.startRestPolling()
            ws.close()
            return
          }
        }
      }
    }

    ws.onclose = (event) => {
      console.log('[WS Market] Closed — code:', event.code, 'reason:', event.reason)
      if (this.isDestroyed || this.marketAuthFailed) return
      this.scheduleReconnect('market')
    }

    ws.onerror = (event) => {
      console.error('[WS Market] Error event:', event)
      ws.close()
    }
  }

  private connectTradeStream(): void {
    if (this.isDestroyed || !this.credentials) return

    const ws = new WebSocket(ALPACA_TRADE_WS)
    this.tradeWs = ws

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          action: 'authenticate',
          data: {
            key_id: this.credentials!.apiKey,
            secret_key: this.credentials!.secretKey,
          },
        })
      )
    }

    ws.onmessage = async (event: MessageEvent) => {
      // Trade WS may send Blob or string
      let rawData: string
      if (event.data instanceof Blob) {
        rawData = await event.data.text()
      } else {
        rawData = event.data as string
      }

      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(rawData) as Record<string, unknown>
      } catch {
        console.warn('[WS Trade] malformed message', rawData)
        return
      }

      if (msg.stream === 'authorization' && (msg.data as Record<string, unknown>)?.status === 'authorized') {
        this.reconnectAttempts.trade = 0
        // Listen for trade updates
        ws.send(
          JSON.stringify({
            action: 'listen',
            data: { streams: ['trade_updates'] },
          })
        )
      } else if (msg.stream === 'trade_updates') {
        // Refresh positions and orders on any trade event
        this.refreshPortfolioData()
      }
    }

    ws.onclose = () => {
      if (this.isDestroyed) return
      this.scheduleReconnect('trade')
    }

    ws.onerror = () => {
      ws.close()
    }
  }

  private scheduleReconnect(stream: 'market' | 'trade'): void {
    if (this.isDestroyed) return

    // If market is closed, stop all reconnection attempts
    if (!isMarketOpen()) {
      useMarketDataStore.getState().setConnectionStatus('market_closed')
      this.scheduleMarketOpenCheck()
      return
    }

    const attempts = this.reconnectAttempts[stream]
    const baseDelay = WS_RECONNECT_BASE_MS * Math.pow(2, attempts)
    const delay = Math.min(baseDelay, WS_RECONNECT_MAX_MS)
    const jitter = delay * 0.5 * Math.random()

    if (stream === 'market') {
      // Only show "Reconnecting" after first failed retry, not on initial connect
      if (attempts > 0) {
        useMarketDataStore.getState().setConnectionStatus('reconnecting')
      }
      this.startRestPolling()
    }

    setTimeout(() => {
      if (this.isDestroyed) return
      this.reconnectAttempts[stream]++
      if (stream === 'market') this.connectMarketStream()
      else this.connectTradeStream()
    }, delay + jitter)
  }

  private startRestPolling(): void {
    if (this.pollInterval) return
    this.pollInterval = window.setInterval(async () => {
      try {
        const [positions, account] = await Promise.all([
          getPositions(),
          getAccount(),
        ])
        usePortfolioStore.getState().setPositions(positions)
        usePortfolioStore.getState().setAccount(account)
      } catch {
        // Polling failed, will retry on next interval
      }
    }, REST_POLL_INTERVAL_MS)
  }

  private stopRestPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  private async refreshPortfolioData(): Promise<void> {
    try {
      const [positions, account] = await Promise.all([
        getPositions(),
        getAccount(),
      ])
      usePortfolioStore.getState().setPositions(positions)
      usePortfolioStore.getState().setAccount(account)
    } catch {
      // Will be refreshed on next trade update or poll
    }
  }

  private subscribeToPositionSymbols(): void {
    const positions = usePortfolioStore.getState().positions
    const symbols = positions.map((p) => p.symbol)
    if (symbols.length > 0) {
      this.subscribe(symbols)
    }
  }

  subscribe(symbols: string[]): void {
    if (!this.marketWs || this.marketWs.readyState !== WebSocket.OPEN) return
    const newSymbols = symbols.filter(
      (s) => !useMarketDataStore.getState().subscribedSymbols.includes(s)
    )
    if (newSymbols.length === 0) return

    this.marketWs.send(
      JSON.stringify({
        action: 'subscribe',
        trades: newSymbols,
        quotes: newSymbols,
      })
    )
    useMarketDataStore.getState().setSubscribedSymbols([
      ...useMarketDataStore.getState().subscribedSymbols,
      ...newSymbols,
    ])
  }

  disconnect(): void {
    this.isDestroyed = true
    this.stopRestPolling()
    if (this.marketWs) {
      this.marketWs.close()
      this.marketWs = null
    }
    if (this.tradeWs) {
      this.tradeWs.close()
      this.tradeWs = null
    }
    useMarketDataStore.getState().setConnectionStatus('disconnected')
  }
}

export const wsManager = new AlpacaWebSocketManager()
