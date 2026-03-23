import { CREDENTIALS_KEY } from '@/lib/constants'

export function getAlpacaHeaders(): HeadersInit {
  const raw = sessionStorage.getItem(CREDENTIALS_KEY)
  if (!raw) throw new Error('No Alpaca credentials found')
  const creds = JSON.parse(raw) as { apiKey: string; secretKey: string }
  return {
    'APCA-API-KEY-ID': creds.apiKey,
    'APCA-API-SECRET-KEY': creds.secretKey,
  }
}
