export type AlpacaCredentials = {
  apiKey: string
  secretKey: string
}

export type TelegramConfig = {
  botToken: string
  chatId: string
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected' | 'market_closed'

export type AlertMetric = 'price' | 'pnl_pct' | 'pnl_usd' | 'order_status'
export type AlertOperator = 'above' | 'below'
export type NotificationChannel = 'in_app' | 'telegram' | 'browser_push'
export type ExperienceMode = 'beginner' | 'pro'
export type DeliveryResult = 'sent' | 'failed' | 'skipped'

export type AlertRule = {
  id: string
  symbol: string
  metric: AlertMetric
  operator: AlertOperator
  threshold: number
  channels: NotificationChannel[]
  active: boolean
  cooldownMinutes: number
  lastTriggeredAt: number | null
  createdAt: number
}

export type TriggeredAlert = {
  id: string
  ruleId: string
  symbol: string
  condition: string
  actualValue: number
  thresholdValue: number
  triggeredAt: number
  deliveryStatus: {
    in_app: DeliveryResult
    telegram: DeliveryResult
    browser_push: DeliveryResult
  }
}

export type MarketQuote = {
  symbol: string
  price: number
  timestamp: number
}

export type Position = {
  asset_id: string
  symbol: string
  qty: string
  avg_entry_price: string
  current_price: string
  unrealized_pl: string
  unrealized_plpc: string
  market_value: string
  side: 'long' | 'short'
}

export type AccountInfo = {
  equity: string
  cash: string
  buying_power: string
  portfolio_value: string
  last_equity: string
  status: string
}

export type Order = {
  id: string
  symbol: string
  qty: string
  side: 'buy' | 'sell'
  type: string
  status: string
  filled_avg_price: string | null
  submitted_at: string
  filled_at: string | null
}

export type Asset = {
  id: string
  symbol: string
  name: string
  exchange: string
  tradable: boolean
}

export type NotificationPrefs = {
  soundEnabled: boolean
  cooldownMinutes: number
  channels: {
    in_app: boolean
    telegram: boolean
    browser_push: boolean
  }
}
