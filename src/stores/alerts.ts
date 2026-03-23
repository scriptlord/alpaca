import { create } from 'zustand'
import type { AlertRule, TriggeredAlert } from '@/lib/types'
import {
  saveRule,
  deleteRule as dbDeleteRule,
  getAllRules,
  getAllTriggeredAlerts,
  saveTriggeredAlert,
} from '@/lib/db'

interface AlertsState {
  rules: AlertRule[]
  triggeredAlerts: TriggeredAlert[]
  addRule: (rule: AlertRule) => void
  updateRule: (id: string, updates: Partial<AlertRule>) => void
  removeRule: (id: string) => void
  toggleRule: (id: string) => void
  markRuleTriggered: (ruleId: string) => void
  addTriggeredAlert: (alert: TriggeredAlert) => void
  loadFromDb: () => Promise<void>
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  rules: [],
  triggeredAlerts: [],

  addRule: (rule) => {
    set((state) => ({ rules: [...state.rules, rule] }))
    saveRule(rule)
  },

  updateRule: (id, updates) => {
    set((state) => ({
      rules: state.rules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }))
    const updated = get().rules.find((r) => r.id === id)
    if (updated) saveRule(updated)
  },

  removeRule: (id) => {
    set((state) => ({ rules: state.rules.filter((r) => r.id !== id) }))
    dbDeleteRule(id)
  },

  toggleRule: (id) => {
    set((state) => ({
      rules: state.rules.map((r) =>
        r.id === id ? { ...r, active: !r.active } : r
      ),
    }))
    const toggled = get().rules.find((r) => r.id === id)
    if (toggled) saveRule(toggled)
  },

  markRuleTriggered: (ruleId) => {
    const now = Date.now()
    set((state) => ({
      rules: state.rules.map((r) =>
        r.id === ruleId ? { ...r, lastTriggeredAt: now } : r
      ),
    }))
    const rule = get().rules.find((r) => r.id === ruleId)
    if (rule) saveRule(rule)
  },

  addTriggeredAlert: (alert) => {
    set((state) => ({
      triggeredAlerts: [alert, ...state.triggeredAlerts],
    }))
    saveTriggeredAlert(alert)
  },

  loadFromDb: async () => {
    const [rules, triggeredAlerts] = await Promise.all([
      getAllRules(),
      getAllTriggeredAlerts(),
    ])
    set({
      rules,
      triggeredAlerts: triggeredAlerts.sort(
        (a, b) => b.triggeredAt - a.triggeredAt
      ),
    })
  },
}))
