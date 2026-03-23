import { useState, useEffect, useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TELEGRAM_API, TELEGRAM_CONFIG_KEY } from '@/lib/constants'
import { sendTelegramMessage } from '@/api/telegram'
import { CheckCircle2, Loader2, ExternalLink } from 'lucide-react'

type SetupStep = 'idle' | 'enter-token' | 'scan-qr' | 'polling' | 'connected'

async function getBotUsername(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/getMe`)
    if (!res.ok) return null
    const data = (await res.json()) as { ok: boolean; result: { username: string } }
    return data.ok ? data.result.username : null
  } catch {
    return null
  }
}

async function pollForChatId(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/getUpdates?limit=5&timeout=0`)
    if (!res.ok) return null
    const data = (await res.json()) as {
      ok: boolean
      result: Array<{ update_id: number; message?: { chat: { id: number } } }>
    }
    if (!data.ok || data.result.length === 0) return null
    // Find the most recent message with a chat ID
    for (let i = data.result.length - 1; i >= 0; i--) {
      const update = data.result[i]
      const chatId = update?.message?.chat?.id
      if (chatId) {
        // Mark this update as read so it won't be returned again
        // by passing offset = update_id + 1
        await fetch(`${TELEGRAM_API}/bot${token}/getUpdates?offset=${update.update_id + 1}&limit=1`)
        return String(chatId)
      }
    }
    return null
  } catch {
    return null
  }
}

export function TelegramSettings() {
  const [step, setStep] = useState<SetupStep>('idle')
  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [botUsername, setBotUsername] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle')
  const pollRef = useRef<number | null>(null)

  // Load existing config
  useEffect(() => {
    const raw = sessionStorage.getItem(TELEGRAM_CONFIG_KEY)
    if (raw) {
      const config = JSON.parse(raw) as { botToken: string; chatId: string }
      if (config.botToken && config.chatId) {
        setBotToken(config.botToken)
        setChatId(config.chatId)
        setStep('connected')
      }
    }
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handleValidateToken = async () => {
    setTokenError('')
    const token = botToken.trim()
    if (!token) {
      setTokenError('Enter your bot token')
      return
    }
    const username = await getBotUsername(token)
    if (!username) {
      setTokenError('Invalid token — check and try again')
      return
    }
    setBotUsername(username)
    setStep('scan-qr')
    startPolling(token)
  }

  const connectedRef = useRef(false)

  const startPolling = useCallback((token: string) => {
    setStep('scan-qr')
    connectedRef.current = false
    pollRef.current = window.setInterval(async () => {
      if (connectedRef.current) return
      const foundChatId = await pollForChatId(token)
      if (foundChatId && !connectedRef.current) {
        connectedRef.current = true
        if (pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
        setChatId(foundChatId)
        sessionStorage.setItem(
          TELEGRAM_CONFIG_KEY,
          JSON.stringify({ botToken: token.trim(), chatId: foundChatId })
        )
        setStep('connected')
        sendTelegramMessage(
          token.trim(),
          foundChatId,
          '✅ *Alpaca Alerts Connected!*\n\nYou will receive stock alerts and insights here.'
        )
      }
    }, 2000)
  }, [])

  const handleTest = async () => {
    setTestStatus('sending')
    const success = await sendTelegramMessage(
      botToken.trim(),
      chatId,
      '✅ *Alpaca Alerts* — Test message successful!'
    )
    setTestStatus(success ? 'success' : 'failed')
    setTimeout(() => setTestStatus('idle'), 3000)
  }

  const handleDisconnect = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    sessionStorage.removeItem(TELEGRAM_CONFIG_KEY)
    setBotToken('')
    setChatId('')
    setBotUsername('')
    setStep('idle')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          Telegram
          {step === 'connected' && (
            <Badge className="bg-success/10 text-success border-success/20" variant="outline">
              Connected ✓
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step: Idle — not configured */}
        {step === 'idle' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Get stock alerts and AI insights delivered to your Telegram.
            </p>
            <Button onClick={() => setStep('enter-token')} className="w-full">
              Connect Telegram
            </Button>
          </div>
        )}

        {/* Step: Enter token */}
        {step === 'enter-token' && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted/50 p-3 text-sm space-y-2">
              <p className="font-medium">Step 1: Create a Telegram bot</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Open{' '}
                  <a
                    href="https://t.me/botfather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    @BotFather <ExternalLink className="h-3 w-3" />
                  </a>{' '}
                  on Telegram
                </li>
                <li>Send <code className="bg-muted px-1 rounded">/newbot</code></li>
                <li>Follow the prompts — give it a name</li>
                <li>Copy the token BotFather gives you</li>
              </ol>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tg-token">Paste bot token here</Label>
              <Input
                id="tg-token"
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v..."
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleValidateToken()}
              />
              {tokenError && (
                <p className="text-sm text-destructive">{tokenError}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('idle')}>
                Cancel
              </Button>
              <Button onClick={handleValidateToken} className="flex-1">
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step: Scan QR code */}
        {step === 'scan-qr' && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
              <p className="font-medium">Step 2: Scan with your phone</p>
              <p className="text-muted-foreground">
                Open your phone camera and scan this QR code, then tap <strong>Start</strong> in Telegram.
              </p>
            </div>
            <div className="flex justify-center py-4">
              <div className="rounded-lg border border-border bg-white p-4">
                <QRCodeSVG
                  value={`https://t.me/${botUsername}`}
                  size={180}
                  level="M"
                />
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Or open directly:{' '}
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-medium hover:underline"
              >
                t.me/{botUsername}
              </a>
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for you to tap Start...
            </div>
            <Button variant="outline" onClick={handleDisconnect} className="w-full">
              Cancel
            </Button>
          </div>
        )}

        {/* Step: Connected */}
        {step === 'connected' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-md bg-success/5 border border-success/20 p-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Connected to @{botUsername || 'your bot'}</p>
                <p className="text-muted-foreground">Alerts and insights will be sent here</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleTest}
                disabled={testStatus === 'sending'}
                className="flex-1"
              >
                {testStatus === 'sending'
                  ? 'Sending...'
                  : testStatus === 'success'
                    ? 'Sent ✓'
                    : testStatus === 'failed'
                      ? 'Failed ✗'
                      : 'Send Test Message'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
