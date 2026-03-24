import { BarChart3, Bell, Globe, Send } from 'lucide-react'

const steps = [
  {
    icon: BarChart3,
    title: 'Track Any Stock',
    description: 'Add stocks to your watchlist and get real-time insights, RSI, volume analysis, news sentiment, and momentum signals.',
  },
  {
    icon: Bell,
    title: 'Set Smart Alerts',
    description: 'Create alerts for price thresholds, P&L changes, or volume spikes. Get notified the moment conditions are met.',
  },
  {
    icon: Globe,
    title: 'Your Language, Your Level',
    description: 'Get AI-powered explanations in English, Pidgin, Yoruba, or Igbo. Choose Beginner or Pro mode for your experience level.',
  },
  {
    icon: Send,
    title: 'Telegram Delivery',
    description: 'Alerts and insights delivered straight to your Telegram. Set it up in Settings, just paste your bot token and scan the QR code.',
  },
]

export function HowItWorks() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">How It Works</h2>
        <p className="text-muted-foreground">Set alerts once. Get insights everywhere.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {steps.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex gap-4 rounded-lg border border-border bg-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Telegram screenshots */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold">What You Receive on Telegram</h3>
          <p className="text-sm text-muted-foreground">Real examples: AI analysis in Nigerian Pidgin</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border overflow-hidden">
            <img
              src="/screenshots/telegram-data.jpeg"
              alt="Stock data card with RSI, volume, and news headlines"
              className="w-full"
              loading="lazy"
            />
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <img
              src="/screenshots/telegram-pidgin-1.jpeg"
              alt="AI analysis in Pidgin: what is happening with the stock"
              className="w-full"
              loading="lazy"
            />
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <img
              src="/screenshots/telegram-pidgin-2.jpeg"
              alt="AI analysis in Pidgin: what to consider doing"
              className="w-full"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
