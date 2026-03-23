import { ApiKeySettings } from '@/components/settings/ApiKeySettings'
import { TelegramSettings } from '@/components/settings/TelegramSettings'
import { NotificationPrefs } from '@/components/settings/NotificationPrefs'
import { AiSettings } from '@/components/settings/AiSettings'

export function SettingsPage({ onResetKeys }: { onResetKeys: () => void }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <ApiKeySettings onResetKeys={onResetKeys} />
      <AiSettings />
      <TelegramSettings />
      <NotificationPrefs />
    </div>
  )
}
