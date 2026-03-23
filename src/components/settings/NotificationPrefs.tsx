import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function NotificationPrefs() {
  const { permission, requestPermission } = usePushNotifications()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>In-App Toasts</Label>
          <Badge variant="default">Always on</Badge>
        </div>

        <div className="flex items-center justify-between">
          <Label>Browser Push</Label>
          {permission === 'granted' ? (
            <Badge variant="default">Granted</Badge>
          ) : permission === 'denied' ? (
            <Badge variant="destructive">Denied — update in browser settings</Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={requestPermission}>
              Request Permission
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Label>Telegram</Label>
          <Badge variant="secondary">Configure above</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
