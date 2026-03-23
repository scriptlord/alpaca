import { ActiveAlertsList } from '@/components/alerts/ActiveAlertsList'
import { TriggeredAlertsFeed } from '@/components/alerts/TriggeredAlertsFeed'

export function AlertsPage({
  onCreateAlert,
}: {
  onCreateAlert: () => void
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ActiveAlertsList onCreateAlert={onCreateAlert} />
      <TriggeredAlertsFeed />
    </div>
  )
}
