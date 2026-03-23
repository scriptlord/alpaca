import type { Bar, NewsArticle } from '@/api/alpaca-market'

export type MomentumSignal = 'Bullish' | 'Bearish' | 'Neutral'

export type StockInsight = {
  symbol: string
  // Momentum
  rsi: number
  rsiSignal: string // "Oversold", "Overbought", "Neutral"
  priceVsSma50: number // % above/below 50-day SMA
  priceVsSma200: number // % above/below 200-day SMA
  momentumSignal: MomentumSignal
  momentumReasons: string[]
  // Volume
  currentVolume: number
  avgVolume20: number
  volumeRatio: number // current / avg
  volumeSignal: string // "Unusual activity", "Normal", "Low"
  // Price action
  dailyChange: number
  dailyChangePct: number
  // News
  news: NewsArticle[]
  newsSentiment: 'Positive' | 'Negative' | 'Mixed' | 'No news'
  // Spread
  bidAskSpread?: number
  spreadSignal?: string
}

// Calculate RSI from closing prices
export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50 // not enough data

  let gains = 0
  let losses = 0

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1]
    if (change >= 0) gains += change
    else losses += Math.abs(change)
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  // Smooth with remaining data
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]
    if (change >= 0) {
      avgGain = (avgGain * (period - 1) + change) / period
      avgLoss = (avgLoss * (period - 1)) / period
    } else {
      avgGain = (avgGain * (period - 1)) / period
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period
    }
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

// Simple Moving Average
export function calculateSMA(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1]
  const slice = values.slice(-period)
  return slice.reduce((sum, v) => sum + v, 0) / period
}

// Analyze news sentiment (simple keyword-based)
export function analyzeNewsSentiment(
  articles: NewsArticle[]
): 'Positive' | 'Negative' | 'Mixed' | 'No news' {
  if (articles.length === 0) return 'No news'

  const positiveWords = [
    'surge', 'rally', 'beat', 'upgrade', 'bullish', 'record', 'growth',
    'profit', 'gain', 'soar', 'rise', 'jump', 'boost', 'strong', 'exceed',
    'outperform', 'buy', 'positive', 'optimistic', 'recovery',
  ]
  const negativeWords = [
    'crash', 'plunge', 'miss', 'downgrade', 'bearish', 'loss', 'decline',
    'fall', 'drop', 'slump', 'weak', 'cut', 'sell', 'negative', 'warn',
    'layoff', 'lawsuit', 'investigation', 'recession', 'fear',
  ]

  let positive = 0
  let negative = 0

  for (const article of articles) {
    const text = `${article.headline} ${article.summary}`.toLowerCase()
    for (const word of positiveWords) {
      if (text.includes(word)) positive++
    }
    for (const word of negativeWords) {
      if (text.includes(word)) negative++
    }
  }

  if (positive > negative * 1.5) return 'Positive'
  if (negative > positive * 1.5) return 'Negative'
  if (positive > 0 || negative > 0) return 'Mixed'
  return 'No news'
}

// Main analysis function
export function analyzeStock(
  bars: Bar[],
  news: NewsArticle[],
  quote?: { bidPrice: number; askPrice: number }
): Omit<StockInsight, 'symbol'> {
  const closes = bars.map((b) => b.c)
  const volumes = bars.map((b) => b.v)

  // RSI
  const rsi = calculateRSI(closes)
  const rsiSignal =
    rsi < 30 ? 'Oversold — may bounce' : rsi > 70 ? 'Overbought — may pull back' : 'Neutral'

  // Moving averages
  const currentPrice = closes[closes.length - 1] ?? 0
  const sma50 = calculateSMA(closes, 50)
  const sma200 = calculateSMA(closes, 200)
  const priceVsSma50 = sma50 ? ((currentPrice - sma50) / sma50) * 100 : 0
  const priceVsSma200 = sma200 ? ((currentPrice - sma200) / sma200) * 100 : 0

  // Volume analysis
  const currentVolume = volumes[volumes.length - 1] ?? 0
  const avgVolume20 = calculateSMA(volumes, 20)
  const volumeRatio = avgVolume20 ? currentVolume / avgVolume20 : 1
  const volumeSignal =
    volumeRatio > 2
      ? 'Unusual activity — ' + volumeRatio.toFixed(1) + 'x normal'
      : volumeRatio > 1.3
        ? 'Above average'
        : volumeRatio < 0.5
          ? 'Low activity'
          : 'Normal'

  // Daily change
  const prevClose = closes.length >= 2 ? closes[closes.length - 2] : currentPrice
  const dailyChange = currentPrice - prevClose
  const dailyChangePct = prevClose ? (dailyChange / prevClose) * 100 : 0

  // Momentum verdict
  const momentumReasons: string[] = []
  let bullishSignals = 0
  let bearishSignals = 0

  if (rsi < 30) {
    momentumReasons.push('RSI oversold (' + rsi.toFixed(0) + ')')
    bullishSignals++ // contrarian: oversold = potential bounce
  } else if (rsi > 70) {
    momentumReasons.push('RSI overbought (' + rsi.toFixed(0) + ')')
    bearishSignals++
  }

  if (priceVsSma50 > 2) {
    momentumReasons.push('Price above 50-day MA')
    bullishSignals++
  } else if (priceVsSma50 < -2) {
    momentumReasons.push('Price below 50-day MA')
    bearishSignals++
  }

  if (priceVsSma200 > 2) {
    momentumReasons.push('Price above 200-day MA')
    bullishSignals++
  } else if (priceVsSma200 < -2) {
    momentumReasons.push('Price below 200-day MA')
    bearishSignals++
  }

  if (volumeRatio > 2 && dailyChange > 0) {
    momentumReasons.push('High volume buying')
    bullishSignals++
  } else if (volumeRatio > 2 && dailyChange < 0) {
    momentumReasons.push('High volume selling')
    bearishSignals++
  }

  const newsSentiment = analyzeNewsSentiment(news)
  if (newsSentiment === 'Positive') {
    momentumReasons.push('Positive news sentiment')
    bullishSignals++
  } else if (newsSentiment === 'Negative') {
    momentumReasons.push('Negative news sentiment')
    bearishSignals++
  }

  if (momentumReasons.length === 0) {
    momentumReasons.push('No strong signals')
  }

  const momentumSignal: MomentumSignal =
    bullishSignals > bearishSignals + 1
      ? 'Bullish'
      : bearishSignals > bullishSignals + 1
        ? 'Bearish'
        : 'Neutral'

  // Spread
  const bidAskSpread = quote
    ? ((quote.askPrice - quote.bidPrice) / quote.askPrice) * 100
    : undefined
  const spreadSignal = bidAskSpread
    ? bidAskSpread < 0.05
      ? 'Tight spread — high liquidity'
      : bidAskSpread > 0.5
        ? 'Wide spread — low liquidity'
        : 'Normal spread'
    : undefined

  return {
    rsi,
    rsiSignal,
    priceVsSma50,
    priceVsSma200,
    momentumSignal,
    momentumReasons,
    currentVolume,
    avgVolume20,
    volumeRatio,
    volumeSignal,
    dailyChange,
    dailyChangePct,
    news,
    newsSentiment,
    bidAskSpread,
    spreadSignal,
  }
}

// Format insight for Telegram message
export function formatInsightForTelegram(
  symbol: string,
  insight: Omit<StockInsight, 'symbol'>,
  currentPrice: number,
  appUrl?: string
): string {
  const emoji =
    insight.momentumSignal === 'Bullish'
      ? '🟢'
      : insight.momentumSignal === 'Bearish'
        ? '🔴'
        : '🟡'

  const lines = [
    `${emoji} *${symbol} Insight Report*`,
    '',
    `*Price:* $${currentPrice.toFixed(2)} (${insight.dailyChangePct >= 0 ? '+' : ''}${insight.dailyChangePct.toFixed(2)}%)`,
    `*Signal:* ${insight.momentumSignal}`,
    `*RSI:* ${insight.rsi.toFixed(0)} — ${insight.rsiSignal}`,
    `*Volume:* ${insight.volumeSignal}`,
    `*News:* ${insight.newsSentiment}`,
    '',
    '*Why:*',
    ...insight.momentumReasons.map((r) => `  • ${r}`),
  ]

  if (insight.news.length > 0) {
    lines.push('', '*Latest Headlines:*')
    for (const article of insight.news.slice(0, 3)) {
      lines.push(`  📰 [${article.headline}](${article.url})`)
    }
  }

  if (appUrl) {
    lines.push(
      '',
      `[📈 Buy ${symbol}](${appUrl}?action=buy&symbol=${symbol}) | [📉 Sell ${symbol}](${appUrl}?action=sell&symbol=${symbol})`
    )
  }

  return lines.join('\n')
}
