import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CREDENTIALS_KEY } from '@/lib/constants'
import { useMarketDataStore } from '@/stores/market-data'
import { validateCredentials } from '@/api/alpaca-rest'

export function ApiKeySettings({ onResetKeys }: { onResetKeys: () => void }) {
  const connectionStatus = useMarketDataStore((s) => s.connectionStatus)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<boolean | null>(null)

  const raw = sessionStorage.getItem(CREDENTIALS_KEY)
  const creds = raw ? (JSON.parse(raw) as { apiKey: string }) : null
  const maskedKey = creds ? `...${creds.apiKey.slice(-4)}` : 'Not set'

  const handleTest = async () => {
    setTesting(true)
    const valid = await validateCredentials()
    setTestResult(valid)
    setTesting(false)
    setTimeout(() => setTestResult(null), 3000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">API Keys</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">API Key: <span className="font-mono">{maskedKey}</span></p>
            <p className="mt-1 text-xs text-muted-foreground">
              Stored in session only
            </p>
          </div>
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
            {connectionStatus}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
            {testing ? 'Testing...' : testResult === true ? 'Valid ✓' : testResult === false ? 'Invalid ✗' : 'Test Connection'}
          </Button>
          <Button variant="destructive" size="sm" onClick={onResetKeys}>
            Change Keys
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
