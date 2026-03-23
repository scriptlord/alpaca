import { TELEGRAM_API } from '@/lib/constants'

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  retries = 3
): Promise<boolean> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(
        `${TELEGRAM_API}/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'Markdown',
          }),
        }
      )
      if (res.ok) return true
      if (res.status === 429) {
        const data = (await res.json()) as { parameters?: { retry_after?: number } }
        const retryAfter = data.parameters?.retry_after ?? 5
        await new Promise((r) => setTimeout(r, retryAfter * 1000))
        continue
      }
      return false
    } catch {
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }
  return false
}

export function formatTelegramMessage(
  symbol: string,
  condition: string,
  actualValue: number,
  thresholdValue: number
): string {
  return [
    '🔔 *Alert Triggered*',
    `Symbol: \`${symbol}\``,
    `Condition: ${condition}`,
    `Actual: ${actualValue.toFixed(2)}`,
    `Threshold: ${thresholdValue.toFixed(2)}`,
    `Time: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`,
  ].join('\n')
}
