import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  getHistoricalBars,
  getNews,
  getLatestQuote,
  placeOrder,
} from '@/api/alpaca-market'
import { analyzeStock, formatInsightForTelegram } from '@/engine/stock-insights'
import type { StockInsight } from '@/engine/stock-insights'
import { getAiAnalysis, hasAiApiKey } from '@/api/ai-analysis'
import { getPreferredLanguage, getPreferredExperienceMode } from '@/components/settings/AiSettings'
import { sendTelegramMessage } from '@/api/telegram'
import { TELEGRAM_CONFIG_KEY } from '@/lib/constants'
import { useMarketDataStore } from '@/stores/market-data'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Newspaper,
  Activity,
  Send,
  ShoppingCart,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

export function StockInsightPanel({
  symbol,
  onClose,
}: {
  symbol: string
  onClose: () => void
}) {
  const [insight, setInsight] = useState<Omit<StockInsight, 'symbol'> | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [trading, setTrading] = useState(false)
  const [sendingTg, setSendingTg] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const livePrice = useMarketDataStore((s) => s.prices[symbol]?.price)

  useEffect(() => {
    const controller = new AbortController()
    async function fetchInsight() {
      setLoading(true)
      setFetchError(null)
      setAiAnalysis(null)
      try {
        const [bars, news, quote] = await Promise.all([
          getHistoricalBars(symbol).catch(() => []),
          getNews(symbol).catch(() => []),
          getLatestQuote(symbol).catch(() => undefined),
        ])
        if (controller.signal.aborted) return
        const result = analyzeStock(bars, news, quote)
        setInsight(result)
      } catch {
        if (!controller.signal.aborted) {
          setFetchError('Could not load market data. Market may be closed.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    fetchInsight()
    return () => controller.abort()
  }, [symbol])

  const handleAiAnalysis = async () => {
    if (!insight) return
    setAiLoading(true)
    try {
      const analysis = await getAiAnalysis({
        symbol,
        currentPrice: livePrice ?? 0,
        dailyChangePct: insight.dailyChangePct,
        rsi: insight.rsi,
        rsiSignal: insight.rsiSignal,
        volumeRatio: insight.volumeRatio,
        volumeSignal: insight.volumeSignal,
        priceVsSma50: insight.priceVsSma50,
        priceVsSma200: insight.priceVsSma200,
        momentumSignal: insight.momentumSignal,
        momentumReasons: insight.momentumReasons,
        newsHeadlines: insight.news.map((n) => n.headline),
        newsSentiment: insight.newsSentiment,
        language: getPreferredLanguage(),
        experienceMode: getPreferredExperienceMode(),
      })
      setAiAnalysis(analysis)
    } catch (e) {
      toast.error(`AI analysis failed: ${(e as Error).message}`)
    } finally {
      setAiLoading(false)
    }
  }

  const handleTrade = async (side: 'buy' | 'sell') => {
    setTrading(true)
    try {
      await placeOrder({ symbol, qty: '1', side })
      toast.success(`${side === 'buy' ? 'Bought' : 'Sold'} 1 share of ${symbol}`)
    } catch (e) {
      toast.error(`Trade failed: ${(e as Error).message}`)
    } finally {
      setTrading(false)
    }
  }

  const handleSendToTelegram = async () => {
    const raw = sessionStorage.getItem(TELEGRAM_CONFIG_KEY)
    if (!raw || !insight) {
      toast.error('Configure Telegram in Settings first')
      return
    }
    setSendingTg(true)
    const config = JSON.parse(raw) as { botToken: string; chatId: string }
    const price = livePrice ?? 0

    // Message 1: Data card (RSI, volume, news, buy/sell links)
    const dataCard = formatInsightForTelegram(symbol, insight, price, window.location.origin)
    await sendTelegramMessage(config.botToken, config.chatId, dataCard)

    // Message 2: AI analysis in user's language + experience mode
    if (hasAiApiKey()) {
      try {
        const analysis = await getAiAnalysis({
          symbol,
          currentPrice: price,
          dailyChangePct: insight.dailyChangePct,
          rsi: insight.rsi,
          rsiSignal: insight.rsiSignal,
          volumeRatio: insight.volumeRatio,
          volumeSignal: insight.volumeSignal,
          priceVsSma50: insight.priceVsSma50,
          priceVsSma200: insight.priceVsSma200,
          momentumSignal: insight.momentumSignal,
          momentumReasons: insight.momentumReasons,
          newsHeadlines: insight.news.map((n) => n.headline),
          newsSentiment: insight.newsSentiment,
          language: getPreferredLanguage(),
          experienceMode: getPreferredExperienceMode(),
        })

        const emoji = insight.momentumSignal === 'Bullish' ? '🟢' : insight.momentumSignal === 'Bearish' ? '🔴' : '🟡'
        await sendTelegramMessage(config.botToken, config.chatId, `${emoji} *${symbol} — AI Analysis*\n\n${analysis}`)
      } catch {
        // AI failed — data card already sent, that's fine
      }
    }

    const success = true
    if (success) {
      toast.success('Insight sent to Telegram')
    } else {
      toast.error('Failed to send to Telegram')
    }
    setSendingTg(false)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{symbol} Insight</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  if (!insight) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>{fetchError ?? `Could not load insights for ${symbol}`}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setLoading(true)}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const MomentumIcon =
    insight.momentumSignal === 'Bullish'
      ? TrendingUp
      : insight.momentumSignal === 'Bearish'
        ? TrendingDown
        : Minus


  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{symbol}</span>
            <Badge
              className={cn(
                'gap-1',
                insight.momentumSignal === 'Bullish'
                  ? 'bg-success/10 text-success border-success/20'
                  : insight.momentumSignal === 'Bearish'
                    ? 'bg-danger/10 text-danger border-danger/20'
                    : 'bg-muted text-muted-foreground'
              )}
              variant="outline"
            >
              <MomentumIcon className="h-3 w-3" />
              {insight.momentumSignal}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price */}
        <div className="flex items-baseline gap-2">
          {livePrice && (
            <span className="text-2xl font-bold">
              ${livePrice.toFixed(2)}
            </span>
          )}
          <span
            className={cn(
              'text-sm font-medium',
              insight.dailyChangePct >= 0 ? 'text-success' : 'text-danger'
            )}
          >
            {insight.dailyChangePct >= 0 ? '+' : ''}
            {insight.dailyChangePct.toFixed(2)}%
          </span>
        </div>

        <Separator />

        {/* Momentum Reasons */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4" />
            Why {insight.momentumSignal}
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {insight.momentumReasons.map((reason, i) => (
              <li key={i} className="flex items-center gap-2">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    reason.toLowerCase().includes('below') ||
                      reason.toLowerCase().includes('selling') ||
                      reason.toLowerCase().includes('negative') ||
                      reason.toLowerCase().includes('overbought')
                      ? 'bg-danger'
                      : reason.toLowerCase().includes('above') ||
                          reason.toLowerCase().includes('buying') ||
                          reason.toLowerCase().includes('positive') ||
                          reason.toLowerCase().includes('oversold')
                        ? 'bg-success'
                        : 'bg-muted-foreground'
                  )}
                />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">RSI (14)</span>
            <p className={cn('font-medium', insight.rsi < 30 ? 'text-success' : insight.rsi > 70 ? 'text-danger' : '')}>
              {insight.rsi.toFixed(0)} — {insight.rsiSignal.split('—')[0].trim()}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Volume</span>
            <p className="font-medium">
              {insight.volumeRatio.toFixed(1)}x avg
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">vs 50-day MA</span>
            <p className={cn('font-medium', insight.priceVsSma50 >= 0 ? 'text-success' : 'text-danger')}>
              {insight.priceVsSma50 >= 0 ? '+' : ''}{insight.priceVsSma50.toFixed(1)}%
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">vs 200-day MA</span>
            <p className={cn('font-medium', insight.priceVsSma200 >= 0 ? 'text-success' : 'text-danger')}>
              {insight.priceVsSma200 >= 0 ? '+' : ''}{insight.priceVsSma200.toFixed(1)}%
            </p>
          </div>
        </div>

        {insight.spreadSignal && (
          <>
            <Separator />
            <div className="text-sm">
              <span className="text-muted-foreground">Spread: </span>
              <span>{insight.spreadSignal}</span>
            </div>
          </>
        )}

        {/* News */}
        {insight.news.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Newspaper className="h-4 w-4" />
                News
                <Badge variant="outline" className="text-[10px]">
                  {insight.newsSentiment}
                </Badge>
              </div>
              <div className="space-y-2">
                {insight.news.slice(0, 3).map((article) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-md border border-border p-2 text-xs hover:bg-accent transition-colors"
                  >
                    <p className="font-medium line-clamp-2">
                      {article.headline}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {article.source} ·{' '}
                      {new Date(article.created_at).toLocaleDateString()}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* AI Analysis */}
        {hasAiApiKey() && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Analysis</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAiAnalysis}
                disabled={aiLoading}
              >
                {aiLoading ? 'Analyzing...' : aiAnalysis ? 'Refresh' : 'Analyze'}
              </Button>
            </div>
            {aiAnalysis && (
              <div className="rounded-md bg-muted/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                {aiAnalysis}
              </div>
            )}
          </div>
        )}

        {!hasAiApiKey() && (
          <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            Configure AI in Settings for smart analysis
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-success hover:bg-success/90 text-white"
            onClick={() => handleTrade('buy')}
            disabled={trading}
          >
            <ShoppingCart className="mr-1 h-3 w-3" />
            Buy 1
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={() => handleTrade('sell')}
            disabled={trading}
          >
            Sell 1
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSendToTelegram}
            disabled={sendingTg}
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
