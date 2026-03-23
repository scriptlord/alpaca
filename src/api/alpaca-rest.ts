import { ALPACA_PAPER_REST } from '@/lib/constants'
import { getAlpacaHeaders as getHeaders } from './shared'
import type { AccountInfo, Asset, Order, Position } from '@/lib/types'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${ALPACA_PAPER_REST}${path}`, {
    headers: getHeaders(),
  })
  if (!res.ok) {
    throw new Error(`Alpaca API error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export async function getAccount(): Promise<AccountInfo> {
  return apiFetch<AccountInfo>('/v2/account')
}

export async function getPositions(): Promise<Position[]> {
  return apiFetch<Position[]>('/v2/positions')
}

export async function getOrders(): Promise<Order[]> {
  return apiFetch<Order[]>('/v2/orders?status=all&limit=50')
}

export async function searchAssets(query: string): Promise<Asset[]> {
  const assets = await apiFetch<Asset[]>('/v2/assets?status=active')
  const q = query.toUpperCase()
  return assets
    .filter(
      (a) =>
        a.tradable &&
        (a.symbol.includes(q) || a.name.toUpperCase().includes(q))
    )
    .slice(0, 20)
}

export async function validateCredentials(): Promise<boolean> {
  try {
    await getAccount()
    return true
  } catch {
    return false
  }
}

export const queryKeys = {
  account: ['account'] as const,
  positions: ['positions'] as const,
  orders: ['orders'] as const,
  assets: (query: string) => ['assets', query] as const,
}
