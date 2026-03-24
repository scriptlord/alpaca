import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateCredentials } from '@/api/alpaca-rest'
import { CREDENTIALS_KEY, TELEGRAM_CONFIG_KEY } from '@/lib/constants'

// Demo keys — loaded from environment variables at build time.
// Set VITE_DEMO_API_KEY and VITE_DEMO_SECRET_KEY in Vercel env vars.
const DEMO_API_KEY = import.meta.env.VITE_DEMO_API_KEY as string | undefined
const DEMO_SECRET_KEY = import.meta.env.VITE_DEMO_SECRET_KEY as string | undefined
const hasDemoKeys = !!DEMO_API_KEY && !!DEMO_SECRET_KEY

export function SetupModal({
  open,
  onComplete,
}: {
  open: boolean
  onComplete: () => void
}) {
  const [step, setStep] = useState(0)
  const [tab, setTab] = useState<'demo' | 'own'>(hasDemoKeys ? 'demo' : 'own')
  const [apiKey, setApiKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')

  const handleValidate = async (key: string, secret: string) => {
    if (!key.trim() || !secret.trim()) {
      setError('Both fields are required')
      return
    }
    setValidating(true)
    setError('')
    sessionStorage.setItem(
      CREDENTIALS_KEY,
      JSON.stringify({ apiKey: key.trim(), secretKey: secret.trim() })
    )
    const valid = await validateCredentials()
    setValidating(false)
    if (valid) {
      setStep(1)
    } else {
      sessionStorage.removeItem(CREDENTIALS_KEY)
      setError('Invalid credentials. Make sure you are using Paper Trading keys.')
    }
  }

  const handleDemoConnect = async () => {
    if (!DEMO_API_KEY || !DEMO_SECRET_KEY) return
    setValidating(true)
    setError('')
    sessionStorage.setItem(
      CREDENTIALS_KEY,
      JSON.stringify({ apiKey: DEMO_API_KEY, secretKey: DEMO_SECRET_KEY })
    )
    const valid = await validateCredentials()
    setValidating(false)
    if (valid) {
      // Skip Telegram step for demo — go straight to dashboard
      onComplete()
    } else {
      sessionStorage.removeItem(CREDENTIALS_KEY)
      setError('Demo account connection failed. Try using your own keys.')
    }
  }

  const handleOwnConnect = () => {
    handleValidate(apiKey, secretKey)
  }

  const handleTelegramSave = () => {
    if (botToken.trim() && chatId.trim()) {
      sessionStorage.setItem(
        TELEGRAM_CONFIG_KEY,
        JSON.stringify({ botToken: botToken.trim(), chatId: chatId.trim() })
      )
    }
    onComplete()
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        {step === 0 ? (
          <>
            <DialogHeader>
              <DialogTitle>Connect to Alpaca</DialogTitle>
              <DialogDescription>
                Connect to Alpaca Paper Trading to see your portfolio and set alerts.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Tabs */}
              {hasDemoKeys && (
                <div className="flex rounded-md border border-border overflow-hidden">
                  <button
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      tab === 'demo'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                    onClick={() => { setTab('demo'); setError('') }}
                  >
                    Try Demo
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      tab === 'own'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                    onClick={() => { setTab('own'); setError('') }}
                  >
                    Use My Keys
                  </button>
                </div>
              )}

              {/* Demo tab */}
              {tab === 'demo' && hasDemoKeys && (
                <div className="space-y-3">
                  <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground space-y-2">
                    <p>Connect instantly with a pre-configured paper trading account.</p>
                    <p>You'll see a live portfolio with sample positions and can test all features including alerts and AI insights.</p>
                  </div>
                  {error && (
                    <p className="text-sm text-destructive" role="alert">{error}</p>
                  )}
                  <Button
                    onClick={handleDemoConnect}
                    disabled={validating}
                    className="w-full"
                  >
                    {validating ? 'Connecting...' : 'Connect with Demo Account'}
                  </Button>
                </div>
              )}

              {/* Own keys tab */}
              {(tab === 'own' || !hasDemoKeys) && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground italic">
                    Production version would use Alpaca OAuth 2.0 for seamless
                    authentication — manual API key entry is used here for the
                    paper trading demo.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key ID</Label>
                    <Input
                      id="apiKey"
                      placeholder="PK..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secretKey">Secret Key</Label>
                    <Input
                      id="secretKey"
                      type="password"
                      placeholder="Your secret key"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive" role="alert">{error}</p>
                  )}
                  <Button
                    onClick={handleOwnConnect}
                    disabled={validating}
                    className="w-full"
                  >
                    {validating ? 'Validating...' : 'Connect'}
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Telegram Notifications (Optional)</DialogTitle>
              <DialogDescription>
                Set up Telegram to receive alerts on your phone. You can
                configure this later in Settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="botToken">Bot Token</Label>
                <Input
                  id="botToken"
                  placeholder="123456:ABC-DEF..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chatId">Chat ID</Label>
                <Input
                  id="chatId"
                  placeholder="Your chat ID"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleTelegramSave} className="flex-1">
                  Skip
                </Button>
                <Button onClick={handleTelegramSave} className="flex-1">
                  Save & Continue
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
