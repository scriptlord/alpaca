import { createStore, get, set, del, keys, values } from 'idb-keyval'
import type { AlertRule, TriggeredAlert } from './types'

const rulesStore = createStore('alpaca-alert-rules', 'rules')
const historyStore = createStore('alpaca-alert-history', 'history')

// Alert Rules
export async function saveRule(rule: AlertRule): Promise<void> {
  await set(rule.id, rule, rulesStore)
}

export async function getRule(id: string): Promise<AlertRule | undefined> {
  return get(id, rulesStore)
}

export async function getAllRules(): Promise<AlertRule[]> {
  return values(rulesStore)
}

export async function deleteRule(id: string): Promise<void> {
  await del(id, rulesStore)
}

// Triggered Alerts
export async function saveTriggeredAlert(alert: TriggeredAlert): Promise<void> {
  await set(alert.id, alert, historyStore)
}

export async function getAllTriggeredAlerts(): Promise<TriggeredAlert[]> {
  return values(historyStore)
}

export async function clearTriggeredAlerts(): Promise<void> {
  const allKeys = await keys(historyStore)
  await Promise.all(allKeys.map((k) => del(k, historyStore)))
}
