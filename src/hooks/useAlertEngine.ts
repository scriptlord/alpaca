import { useEffect, useRef } from 'react'
import { useMarketDataStore } from '@/stores/market-data'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAlertsStore } from '@/stores/alerts'
import {
  evaluateRule,
  formatCondition,
  getActualValue,
} from '@/engine/condition-evaluator'
import type { EvaluationContext } from '@/engine/condition-evaluator'
import type { TriggeredAlert } from '@/lib/types'
import { MAX_ALERTS_PER_MINUTE, TELEGRAM_CONFIG_KEY } from '@/lib/constants'
import { sendTelegramMessage } from '@/api/telegram'
import { getAiAnalysis, hasAiApiKey } from '@/api/ai-analysis'
import { getPreferredLanguage, getPreferredExperienceMode } from '@/components/settings/AiSettings'
import { formatAlertMessage } from '@/lib/format-alert-message'
import { getHistoricalBars, getNews } from '@/api/alpaca-market'
import { analyzeStock } from '@/engine/stock-insights'
import { toast } from 'sonner'

export function useAlertEngine() {
  const prices = useMarketDataStore((s) => s.prices)
  const positions = usePortfolioStore((s) => s.positions)
  const account = usePortfolioStore((s) => s.account)
  const rules = useAlertsStore((s) => s.rules)
  const addTriggeredAlert = useAlertsStore((s) => s.addTriggeredAlert)
  const markRuleTriggered = useAlertsStore((s) => s.markRuleTriggered)

  // Rate limiting: track alerts per minute
  const alertTimestamps = useRef<number[]>([])
  // Track which rule symbols have relevant price data to avoid unnecessary evaluations
  const lastPriceVersionRef = useRef<Record<string, number>>({})

  useEffect(() => {
    if (rules.length === 0) return

    // Skip evaluation if no relevant price data changed
    const relevantSymbols = rules.filter((r) => r.active).map((r) => r.symbol)
    const currentVersions: Record<string, number> = {}
    let hasChanged = false
    for (const sym of relevantSymbols) {
      const ts = prices[sym]?.timestamp ?? 0
      currentVersions[sym] = ts
      if (ts !== (lastPriceVersionRef.current[sym] ?? 0)) hasChanged = true
    }
    if (!hasChanged && Object.keys(lastPriceVersionRef.current).length > 0) return
    lastPriceVersionRef.current = currentVersions

    const context: EvaluationContext = { prices, positions, account }

    for (const rule of rules) {
      if (!evaluateRule(rule, context)) continue

      // Global rate limit
      const now = Date.now()
      alertTimestamps.current = alertTimestamps.current.filter(
        (t) => now - t < 60_000
      )
      if (alertTimestamps.current.length >= MAX_ALERTS_PER_MINUTE) continue
      alertTimestamps.current.push(now)

      const condition = formatCondition(rule)
      const actualValue = getActualValue(rule, context)

      const triggered: TriggeredAlert = {
        id: crypto.randomUUID(),
        ruleId: rule.id,
        symbol: rule.symbol,
        condition,
        actualValue,
        thresholdValue: rule.threshold,
        triggeredAt: now,
        deliveryStatus: {
          in_app: 'skipped',
          telegram: 'skipped',
          browser_push: 'skipped',
        },
      }

      // Dispatch notifications
      if (rule.channels.includes('in_app')) {
        toast(condition, {
          description: `Actual: ${actualValue.toFixed(2)} | Threshold: ${rule.threshold}`,
          duration: 8000,
        })
        triggered.deliveryStatus.in_app = 'sent'
      }

      if (rule.channels.includes('telegram')) {
        const raw = sessionStorage.getItem(TELEGRAM_CONFIG_KEY)
        if (raw) {
          try {
            const config = JSON.parse(raw) as {
              botToken: string
              chatId: string
            }
            if (config.botToken && config.chatId) {
              triggered.deliveryStatus.telegram = 'sent'

              // build rich message if AI key is available
              const sendRichMessage = async () => {
                const experienceMode = getPreferredExperienceMode()
                let message = formatAlertMessage(
                  { symbol: rule.symbol, condition, actualValue, thresholdValue: rule.threshold, dailyChangePct: 0 },
                  experienceMode
                )

                if (hasAiApiKey()) {
                  try {
                    const [bars, news] = await Promise.all([
                      getHistoricalBars(rule.symbol).catch(() => []),
                      getNews(rule.symbol).catch(() => []),
                    ])
                    const insight = analyzeStock(bars, news)
                    const aiSummary = await getAiAnalysis({
                      symbol: rule.symbol,
                      currentPrice: actualValue,
                      dailyChangePct: insight.dailyChangePct,
                      rsi: insight.rsi,
                      rsiSignal: insight.rsiSignal,
                      volumeRatio: insight.volumeRatio,
                      volumeSignal: insight.volumeSignal,
                      priceVsSma50: insight.priceVsSma50,
                      priceVsSma200: insight.priceVsSma200,
                      momentumSignal: insight.momentumSignal,
                      momentumReasons: insight.momentumReasons,
                      newsHeadlines: news.map((n) => n.headline),
                      newsSentiment: insight.newsSentiment,
                      language: getPreferredLanguage(),
                      brief: true,
                      experienceMode,
                    })

                    const emoji = insight.momentumSignal === 'Bullish' ? '🟢' : insight.momentumSignal === 'Bearish' ? '🔴' : '🟡'
                    const rsiTag = `RSI ${insight.rsi.toFixed(0)}`
                    const volTag = insight.volumeRatio > 1.5 ? ` | Vol ${insight.volumeRatio.toFixed(1)}x` : ''

                    message = [
                      `${emoji} *${rule.symbol}* $${actualValue.toFixed(2)} (${insight.dailyChangePct >= 0 ? '+' : ''}${insight.dailyChangePct.toFixed(1)}%) | ${rsiTag}${volTag}`,
                      '',
                      aiSummary,
                      '',
                      `_Open app for full analysis_`,
                    ].join('\n')
                  } catch {
                    // AI failed — send basic message
                  }
                }

                return sendTelegramMessage(config.botToken, config.chatId, message)
              }

              sendRichMessage().then((success) => {
                if (!success) {
                  triggered.deliveryStatus.telegram = 'failed'
                }
              }).catch(() => {
                triggered.deliveryStatus.telegram = 'failed'
              })
            }
          } catch {
            // Invalid JSON in sessionStorage
          }
        }
      }

      if (rule.channels.includes('browser_push')) {
        if (
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted'
        ) {
          new Notification(`Alert: ${rule.symbol}`, { body: condition, tag: 'alpaca-alert' })
          triggered.deliveryStatus.browser_push = 'sent'
        }
      }

      addTriggeredAlert(triggered)
      markRuleTriggered(rule.id)
    }
  }, [prices, positions, account, rules, addTriggeredAlert, markRuleTriggered])
}
