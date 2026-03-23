import { ALPACA_PAPER_REST, ALPACA_DATA_API } from '@/lib/constants'
import { getAlpacaHeaders as getHeaders } from './shared'

// Historical bars for technical analysis
export type Bar = {
  t: string // timestamp
  o: number // open
  h: number // high
  l: number // low
  c: number // close
  v: number // volume
}

export async function getHistoricalBars(
  symbol: string,
  timeframe = '1Day',
  limit = 200
): Promise<Bar[]> {
  const res = await fetch(
    `${ALPACA_DATA_API}/v2/stocks/${symbol}/bars?timeframe=${timeframe}&limit=${limit}`,
    { headers: getHeaders() }
  )
  if (!res.ok) throw new Error(`Bars API error: ${res.status}`)
  const data = (await res.json()) as { bars: Bar[] }
  return data.bars ?? []
}

export async function getLatestQuote(symbol: string): Promise<{
  bidPrice: number
  askPrice: number
  bidSize: number
  askSize: number
}> {
  const res = await fetch(
    `${ALPACA_DATA_API}/v2/stocks/${symbol}/quotes/latest`,
    { headers: getHeaders() }
  )
  if (!res.ok) throw new Error(`Quote API error: ${res.status}`)
  const data = (await res.json()) as {
    quote: { bp: number; ap: number; bs: number; as: number }
  }
  return {
    bidPrice: data.quote.bp,
    askPrice: data.quote.ap,
    bidSize: data.quote.bs,
    askSize: data.quote.as,
  }
}

export async function getLatestTrade(symbol: string): Promise<{
  price: number
  size: number
  timestamp: string
}> {
  const res = await fetch(
    `${ALPACA_DATA_API}/v2/stocks/${symbol}/trades/latest`,
    { headers: getHeaders() }
  )
  if (!res.ok) throw new Error(`Trade API error: ${res.status}`)
  const data = (await res.json()) as {
    trade: { p: number; s: number; t: string }
  }
  return {
    price: data.trade.p,
    size: data.trade.s,
    timestamp: data.trade.t,
  }
}

// News API
export type NewsArticle = {
  id: number
  headline: string
  summary: string
  url: string
  source: string
  created_at: string
  symbols: string[]
}

export async function getNews(
  symbol: string,
  limit = 5
): Promise<NewsArticle[]> {
  const res = await fetch(
    `${ALPACA_DATA_API}/v1beta1/news?symbols=${symbol}&limit=${limit}&sort=desc`,
    { headers: getHeaders() }
  )
  if (!res.ok) throw new Error(`News API error: ${res.status}`)
  const data = (await res.json()) as { news: NewsArticle[] }
  return data.news ?? []
}

// Place order
export async function placeOrder(params: {
  symbol: string
  qty: string
  side: 'buy' | 'sell'
  type?: string
  time_in_force?: string
}): Promise<{ id: string; status: string; symbol: string }> {
  const res = await fetch(`${ALPACA_PAPER_REST}/v2/orders`, {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      symbol: params.symbol,
      qty: params.qty,
      side: params.side,
      type: params.type ?? 'market',
      time_in_force: params.time_in_force ?? 'day',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Order failed: ${err}`)
  }
  return res.json() as Promise<{ id: string; status: string; symbol: string }>
}
