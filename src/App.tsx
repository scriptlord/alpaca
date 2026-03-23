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
import { useAlpacaWs } from '@/hooks/useAlpacaWs'
import { useAlertEngine } from '@/hooks/useAlertEngine'
import { useAlertsStore } from '@/stores/alerts'
import { ConnectionBanner } from '@/components/layout/ConnectionBanner'
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
            </Routes>
          </main>
        </div>
      </div>

      <Toaster theme="light" position="top-right" richColors />

      <SetupModal open={needsSetup} onComplete={handleSetupComplete} />

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
