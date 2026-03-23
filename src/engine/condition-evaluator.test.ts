import { describe, it, expect, vi } from 'vitest'
import {
  evaluateRule,
  formatCondition,
  getActualValue,
} from './condition-evaluator'
import type { EvaluationContext } from './condition-evaluator'
import type { AlertRule } from '@/lib/types'

const baseRule: AlertRule = {
  id: '1',
  symbol: 'AAPL',
  metric: 'price',
  operator: 'below',
  threshold: 175,
  channels: ['in_app'],
  active: true,
  cooldownMinutes: 5,
  lastTriggeredAt: null,
  createdAt: Date.now(),
}

const baseContext: EvaluationContext = {
  prices: {
    AAPL: { symbol: 'AAPL', price: 170, timestamp: Date.now() },
  },
  positions: [
    {
      asset_id: '1',
      symbol: 'AAPL',
      qty: '10',
      avg_entry_price: '180',
      current_price: '170',
      unrealized_pl: '-100',
      unrealized_plpc: '-0.0556',
      market_value: '1700',
      side: 'long',
    },
  ],
  account: null,
}

describe('evaluateRule', () => {
  it('triggers when price crosses below threshold', () => {
    expect(evaluateRule(baseRule, baseContext)).toBe(true)
  })

  it('does NOT trigger when price is above threshold (below rule)', () => {
    const context = {
      ...baseContext,
      prices: { AAPL: { symbol: 'AAPL', price: 180, timestamp: Date.now() } },
    }
    expect(evaluateRule(baseRule, context)).toBe(false)
  })

  it('triggers when price crosses above threshold (above rule)', () => {
    const rule = { ...baseRule, operator: 'above' as const, threshold: 160 }
    expect(evaluateRule(rule, baseContext)).toBe(true)
  })

  it('does NOT trigger when price is below threshold (above rule)', () => {
    const rule = { ...baseRule, operator: 'above' as const, threshold: 180 }
    expect(evaluateRule(rule, baseContext)).toBe(false)
  })

  it('returns false for inactive rule', () => {
    const rule = { ...baseRule, active: false }
    expect(evaluateRule(rule, baseContext)).toBe(false)
  })

  it('returns false when price data is missing (safe default)', () => {
    const context = { ...baseContext, prices: {} }
    expect(evaluateRule(baseRule, context)).toBe(false)
  })

  it('respects cooldown period', () => {
    const rule = { ...baseRule, lastTriggeredAt: Date.now() - 60_000 } // 1 min ago
    expect(evaluateRule(rule, baseContext)).toBe(false) // cooldown is 5 min
  })

  it('triggers after cooldown expires', () => {
    const rule = {
      ...baseRule,
      lastTriggeredAt: Date.now() - 6 * 60_000, // 6 min ago
    }
    expect(evaluateRule(rule, baseContext)).toBe(true) // cooldown is 5 min
  })

  it('evaluates P&L % correctly — triggers when below threshold', () => {
    const rule = {
      ...baseRule,
      metric: 'pnl_pct' as const,
      operator: 'below' as const,
      threshold: -5,
    }
    // unrealized_plpc = -0.0556 = -5.56%
    expect(evaluateRule(rule, baseContext)).toBe(true)
  })

  it('evaluates P&L $ correctly — does not trigger when within limit', () => {
    const rule = {
      ...baseRule,
      metric: 'pnl_usd' as const,
      operator: 'below' as const,
      threshold: -200,
    }
    // unrealized_pl = -100, which is above -200
    expect(evaluateRule(rule, baseContext)).toBe(false)
  })
})

describe('formatCondition', () => {
  it('formats price condition readably', () => {
    expect(formatCondition(baseRule)).toBe('AAPL price below $175')
  })

  it('formats P&L % condition', () => {
    const rule = {
      ...baseRule,
      metric: 'pnl_pct' as const,
      threshold: -5,
    }
    expect(formatCondition(rule)).toBe('AAPL P&L % below -5%')
  })

  it('formats P&L $ condition', () => {
    const rule = {
      ...baseRule,
      metric: 'pnl_usd' as const,
      threshold: -100,
    }
    expect(formatCondition(rule)).toBe('AAPL P&L $ below $-100')
  })
})

describe('getActualValue', () => {
  it('returns current price for price metric', () => {
    expect(getActualValue(baseRule, baseContext)).toBe(170)
  })

  it('returns 0 when data missing', () => {
    expect(getActualValue(baseRule, { ...baseContext, prices: {} })).toBe(0)
  })
})
