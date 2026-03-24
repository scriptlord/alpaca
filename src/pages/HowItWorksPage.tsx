import { HowItWorks } from '@/components/layout/HowItWorks'

export function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Never miss a market move</h1>
        <p className="text-muted-foreground">
          Real-time stock alerts with AI-powered insights, delivered to your Telegram in English, Pidgin, Yoruba, or Igbo.
        </p>
      </div>
      <HowItWorks />
    </div>
  )
}
