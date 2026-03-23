import { useState, useCallback } from 'react'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return false
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [])

  const sendPush = useCallback(
    (title: string, body: string) => {
      if (permission !== 'granted') return
      new Notification(title, {
        body,
        tag: 'alpaca-alert',
      })
    },
    [permission]
  )

  return { permission, requestPermission, sendPush }
}
