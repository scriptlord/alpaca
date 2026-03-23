import { create } from 'zustand'
import type { AccountInfo, Order, Position } from '@/lib/types'

interface PortfolioState {
  account: AccountInfo | null
  positions: Position[]
  orders: Order[]
  lastUpdated: number | null
  setAccount: (account: AccountInfo) => void
  setPositions: (positions: Position[]) => void
  setOrders: (orders: Order[]) => void
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  account: null,
  positions: [],
  orders: [],
  lastUpdated: null,

  setAccount: (account) => set({ account, lastUpdated: Date.now() }),
  setPositions: (positions) => set({ positions, lastUpdated: Date.now() }),
  setOrders: (orders) => set({ orders, lastUpdated: Date.now() }),
}))
