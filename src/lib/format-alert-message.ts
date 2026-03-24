import type { ExperienceMode } from './types'

export type AlertMessageData = {
  symbol: string
  condition: string
  actualValue: number
  thresholdValue: number
  dailyChangePct: number
}

export function formatAlertMessage(
  data: AlertMessageData,
  mode: ExperienceMode
): string {
  const { symbol, condition, actualValue, thresholdValue, dailyChangePct } = data
  const changeStr = `${dailyChangePct >= 0 ? '+' : ''}${dailyChangePct.toFixed(1)}%`

  if (mode === 'pro') {
    return [
      `🚨 ${symbol} $${actualValue.toFixed(2)} (${changeStr})`,
      `Trigger: ${condition}`,
    ].join('\n')
  }

  // Beginner mode
  const direction = dailyChangePct >= 0 ? 'went up' : 'went down'

  return [
    `🚨 ${symbol} has reached your target price of $${thresholdValue}!`,
    '',
    `📊 *What happened:* The stock ${direction} by ${Math.abs(dailyChangePct).toFixed(1)}% today. Current price is $${actualValue.toFixed(2)}.`,
    `💡 *What this means:* ${condition}.`,
    `🤔 *What you can do:* Check the stock's recent news and decide if you want to buy, sell, or wait.`,
    '',
    `_Not financial advice._`,
  ].join('\n')
}
