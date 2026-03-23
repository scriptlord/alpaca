import type { AlertRule, MarketQuote, Position, AccountInfo } from '@/lib/types'

export type EvaluationContext = {
  prices: Record<string, MarketQuote>
  positions: Position[]
  account: AccountInfo | null
}

export function evaluateRule(
  rule: AlertRule,
  context: EvaluationContext
): boolean {
  if (!rule.active) return false

  // Cooldown check
  if (rule.lastTriggeredAt) {
    const cooldownMs = rule.cooldownMinutes * 60 * 1000
    if (Date.now() - rule.lastTriggeredAt < cooldownMs) return false
  }

  switch (rule.metric) {
    case 'price':
      return evaluatePrice(rule, context.prices)
    case 'pnl_pct':
      return evaluatePnlPercent(rule, context.positions)
    case 'pnl_usd':
      return evaluatePnlUsd(rule, context.positions)
    case 'order_status':
      return false // Handled separately via trade update stream
    default:
      return false
  }
}

function evaluatePrice(
  rule: AlertRule,
  prices: Record<string, MarketQuote>
): boolean {
  const quote = prices[rule.symbol]
  if (!quote) return false // Missing data = safe default

  return rule.operator === 'above'
    ? quote.price > rule.threshold
    : quote.price < rule.threshold
}

function evaluatePnlPercent(
  rule: AlertRule,
  positions: Position[]
): boolean {
  const pos = positions.find((p) => p.symbol === rule.symbol)
  if (!pos) return false

  const pnlPct = parseFloat(pos.unrealized_plpc ?? '0') * 100
  if (isNaN(pnlPct)) return false
  return rule.operator === 'above'
    ? pnlPct > rule.threshold
    : pnlPct < rule.threshold
}

function evaluatePnlUsd(
  rule: AlertRule,
  positions: Position[]
): boolean {
  const pos = positions.find((p) => p.symbol === rule.symbol)
  if (!pos) return false

  const pnlUsd = parseFloat(pos.unrealized_pl ?? '0')
  if (isNaN(pnlUsd)) return false
  return rule.operator === 'above'
    ? pnlUsd > rule.threshold
    : pnlUsd < rule.threshold
}

export function formatCondition(rule: AlertRule): string {
  const metricLabel: Record<string, string> = {
    price: 'price',
    pnl_pct: 'P&L %',
    pnl_usd: 'P&L $',
    order_status: 'order status',
  }

  const prefix = rule.metric === 'pnl_usd' || rule.metric === 'price' ? '$' : ''
  const suffix = rule.metric === 'pnl_pct' ? '%' : ''

  return `${rule.symbol} ${metricLabel[rule.metric]} ${rule.operator} ${prefix}${rule.threshold}${suffix}`
}

export function getActualValue(
  rule: AlertRule,
  context: EvaluationContext
): number {
  switch (rule.metric) {
    case 'price': {
      const quote = context.prices[rule.symbol]
      return quote?.price ?? 0
    }
    case 'pnl_pct': {
      const pos = context.positions.find((p) => p.symbol === rule.symbol)
      return pos ? parseFloat(pos.unrealized_plpc) * 100 : 0
    }
    case 'pnl_usd': {
      const pos = context.positions.find((p) => p.symbol === rule.symbol)
      return pos ? parseFloat(pos.unrealized_pl) : 0
    }
    default:
      return 0
  }
}
