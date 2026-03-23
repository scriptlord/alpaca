# Smart Trading Alerts Hub

A real-time alert management system built on Alpaca's Paper Trading API. Monitors market data and portfolio state continuously, evaluates user-defined conditions, and notifies traders instantly via Telegram, browser push, and in-app toasts.

**Built to solve Alpaca's #1 validated customer pain point** — the platform has no built-in alert or notification system.

## Features

- **Real-time monitoring** via dual WebSocket streams (market data + trade updates)
- **Configurable alerts** — price thresholds, P&L %, P&L $, order status
- **Multi-channel notifications** — in-app toasts, Telegram messages, browser push
- **Portfolio dashboard** — live positions, P&L, account summary
- **Alert management** — create, edit, pause, resume, delete rules
- **Triggered alert feed** — virtualized, persistent history via IndexedDB
- **Connection resilience** — exponential backoff reconnection + REST polling fallback
- **Dark theme** — default, as traders expect

## Tech Stack

| Technology | Purpose |
|---|---|
| React (Vite) + TypeScript | UI framework with type safety |
| TailwindCSS + shadcn/ui | Styling + accessible component library |
| Zustand | State management (3 partitioned slices) |
| TanStack Query | REST API caching with stale-while-revalidate |
| TanStack Virtual | Virtualized lists for triggered alert feed |
| idb-keyval | IndexedDB persistence for alert rules + history |
| lightweight-charts | Sparkline price charts |
| sonner | Toast notifications |
| Vitest | Unit testing for condition engine |

## Architecture

```
Alpaca Market Data WS ──→ marketDataStore ──→ Condition Engine ──→ Alert Dispatch
                                                    │                    │
Alpaca Trade Updates WS ──→ portfolioStore ─────────┘          ┌────────┼────────┐
                                                               │        │        │
                                                            In-App   Telegram  Browser
                                                            Toast    Bot API    Push
                                                               │
                                                           IndexedDB
                                                           Alert Log
```

### Key Engineering Decisions

- **IndexedDB** for alert history (not localStorage — 5MB limit)
- **sessionStorage** for API keys (never persist financial credentials to disk)
- **Real WebSocket streams** (not simulated — proves integration with Alpaca infrastructure)
- **requestAnimationFrame batching** for high-frequency price updates
- **Pure function condition engine** with comprehensive unit tests
- **Exponential backoff + jitter** for production-grade reconnection
- **5-minute cooldown per rule** to prevent notification spam

## Setup

### Prerequisites

1. **Alpaca Paper Trading account** (free): [Sign up](https://app.alpaca.markets/signup)
   - Switch to Paper Trading mode
   - Generate API Key ID + Secret Key
   - Place a few paper trades (buy AAPL, TSLA, etc.)

2. **Telegram Bot** (optional):
   - Message [@BotFather](https://t.me/botfather) → `/newbot` → save bot token
   - Message your bot, then visit `https://api.telegram.org/bot<TOKEN>/getUpdates` to get your chat ID

### Run Locally

```bash
git clone <this-repo>
cd alpaca
npm install
npm run dev
```

Open `http://localhost:5173` — the setup modal will prompt for your API keys.

> **No `.env` file needed** — all credentials are stored in browser sessionStorage and cleared when you close the tab.

### Run Tests

```bash
npm test
```

## Demo Walkthrough

1. Open the app → SetupModal appears
2. Enter Alpaca paper trading keys → connection turns green
3. Dashboard loads with portfolio summary + live positions
4. Click "Alert" on a position → AlertBuilderDrawer opens
5. Configure: "Price Below $X" + Telegram → preview shows condition
6. Save alert → appears in Active Alerts
7. When condition triggers → toast + Telegram message arrives
8. View Alerts page → triggered alert logged with delivery status
9. Disconnect WiFi → yellow banner: "Data may be stale"
10. Reconnect → auto-reconnects, green dot, data resumes

## Security

- API keys stored in `sessionStorage` only — cleared on tab close
- Keys are never logged, written to disk, or sent to any third party
- All communication uses HTTPS/WSS
- WebSocket data is sanitized before rendering
- Alert thresholds validated (no negative prices, reasonable ranges)

## Disclaimer

Alerts are informational and not guaranteed. Not for time-critical trading decisions.

## License

MIT
