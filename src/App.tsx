import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { SetupModal } from '@/components/layout/SetupModal'
import { AlertBuilderDrawer } from '@/components/alerts/AlertBuilderDrawer'
import { DashboardPage } from '@/pages/DashboardPage'
import { AlertsPage } from '@/pages/AlertsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { HowItWorksPage } from '@/pages/HowItWorksPage'
import { useAlpacaWs } from '@/hooks/useAlpacaWs'
import { useAlertEngine } from '@/hooks/useAlertEngine'
import { useAlertsStore } from '@/stores/alerts'
import { ConnectionBanner } from '@/components/layout/ConnectionBanner'
import { HowItWorks } from '@/components/layout/HowItWorks'
import { CREDENTIALS_KEY } from '@/lib/constants'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})

function AppShell() {
  const [needsSetup, setNeedsSetup] = useState(
    !sessionStorage.getItem(CREDENTIALS_KEY)
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerSymbol, setDrawerSymbol] = useState<string | undefined>()

  // Initialize
  useAlpacaWs()
  useAlertEngine()

  useEffect(() => {
    useAlertsStore.getState().loadFromDb()
  }, [])

  const handleSetAlert = useCallback((symbol: string) => {
    setDrawerSymbol(symbol)
    setDrawerOpen(true)
  }, [])

  const handleCreateAlert = useCallback(() => {
    setDrawerSymbol(undefined)
    setDrawerOpen(true)
  }, [])

  const handleResetKeys = useCallback(() => {
    sessionStorage.removeItem(CREDENTIALS_KEY)
    setNeedsSetup(true)
  }, [])

  const handleSetupComplete = useCallback(() => {
    setNeedsSetup(false)
    // Reload to reconnect WebSockets with new credentials
    window.location.reload()
  }, [])

  const [showSetup, setShowSetup] = useState(false)

  if (needsSetup) {
    return (
      <>
        <div className="min-h-screen bg-background text-foreground">
          <header className="flex h-14 items-center justify-between border-b border-border px-6">
            <h1 className="text-lg font-semibold">Smart Trading Alerts Hub</h1>
            <Button onClick={() => setShowSetup(true)}>
              Get Started
            </Button>
          </header>
          <main className="mx-auto max-w-3xl px-6 py-10 space-y-10">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold">Never miss a market move</h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Real-time stock alerts with smart insights — delivered to your Telegram in English, Pidgin, Yoruba, or Igbo.
              </p>
              <Button size="lg" onClick={() => setShowSetup(true)}>
                Get Started
              </Button>
            </div>
            <HowItWorks />
            <div className="text-center pb-10">
              <Button size="lg" onClick={() => setShowSetup(true)}>
                Get Started
              </Button>
            </div>
          </main>
        </div>
        <Toaster theme="light" position="top-right" richColors />
        <SetupModal open={showSetup} onComplete={handleSetupComplete} />
      </>
    )
  }

  return (
    <>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <ConnectionBanner />
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route
                path="/"
                element={<DashboardPage onSetAlert={handleSetAlert} />}
              />
              <Route
                path="/alerts"
                element={<AlertsPage onCreateAlert={handleCreateAlert} />}
              />
              <Route
                path="/settings"
                element={<SettingsPage onResetKeys={handleResetKeys} />}
              />
              <Route
                path="/guide"
                element={<HowItWorksPage />}
              />
            </Routes>
          </main>
        </div>
      </div>

      <Toaster theme="light" position="top-right" richColors />

      <AlertBuilderDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        prefillSymbol={drawerSymbol}
      />
    </>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
