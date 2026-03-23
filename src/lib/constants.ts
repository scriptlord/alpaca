export const ALPACA_PAPER_REST = 'https://paper-api.alpaca.markets'
// Use 'test' feed for free paper trading accounts (iex requires paid subscription)
export const ALPACA_MARKET_WS = 'wss://stream.data.sandbox.alpaca.markets/v2/test'
export const ALPACA_TRADE_WS = 'wss://paper-api.alpaca.markets/stream'
export const TELEGRAM_API = 'https://api.telegram.org'

export const WS_RECONNECT_BASE_MS = 1000
export const WS_RECONNECT_MAX_MS = 30000
export const REST_POLL_INTERVAL_MS = 5000
export const DEFAULT_COOLDOWN_MINUTES = 5
export const MAX_ALERTS_PER_MINUTE = 10

export const CREDENTIALS_KEY = 'alpaca_credentials'
export const TELEGRAM_CONFIG_KEY = 'telegram_config'
export const NOTIFICATION_PREFS_KEY = 'notification_prefs'
export const AI_API_KEY_STORAGE = 'ai_api_key'
export const WATCHLIST_STORAGE_KEY = 'watchlist_symbols'
export const PREFERRED_LANGUAGE_KEY = 'preferred_language'
export const EXPERIENCE_MODE_KEY = 'experience_mode'
export const ALPACA_DATA_API = 'https://data.alpaca.markets'
export const RECENT_ALERT_WINDOW_MS = 3_600_000

// US market hours in ET (Eastern Time)
export const MARKET_OPEN_HOUR = 9 // 9:30 AM ET
export const MARKET_OPEN_MINUTE = 30
export const MARKET_CLOSE_HOUR = 16 // 4:00 PM ET

// Chart colors (must match CSS tokens --success and --danger)
export const CHART_COLOR_SUCCESS = '#0ECB81'
export const CHART_COLOR_DANGER = '#F6465D'
