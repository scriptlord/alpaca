import { MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, MARKET_CLOSE_HOUR } from './constants'

export function isMarketOpen(): boolean {
  const now = new Date()

  // Convert to ET (US Eastern)
  const et = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' })
  )

  const day = et.getDay()
  // Weekend: Saturday (6) or Sunday (0)
  if (day === 0 || day === 6) return false

  const hour = et.getHours()
  const minute = et.getMinutes()
  const timeInMinutes = hour * 60 + minute
  const openInMinutes = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE
  const closeInMinutes = MARKET_CLOSE_HOUR * 60

  return timeInMinutes >= openInMinutes && timeInMinutes < closeInMinutes
}

export function getNextMarketOpen(): string {
  const now = new Date()
  const et = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' })
  )

  const day = et.getDay()
  const hour = et.getHours()
  const timeInMinutes = hour * 60 + et.getMinutes()
  const openInMinutes = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE

  // If it's a weekday before market open
  if (day >= 1 && day <= 5 && timeInMinutes < openInMinutes) {
    return 'today at 9:30 AM ET'
  }

  // If it's Friday after close or weekend
  if (day === 5 && timeInMinutes >= MARKET_CLOSE_HOUR * 60) {
    return 'Monday at 9:30 AM ET'
  }
  if (day === 6) return 'Monday at 9:30 AM ET'
  if (day === 0) return 'Monday at 9:30 AM ET'

  // Weekday after close
  return 'tomorrow at 9:30 AM ET'
}
