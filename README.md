# Smart Trading Alerts Hub

A real-time alert management system built on Alpaca's Paper Trading API. Monitors market data and portfolio state continuously, evaluates user-defined conditions, and notifies traders instantly via Telegram, browser push, and in-app toasts.

**Built to solve Alpaca's #1 validated customer pain point** — the platform has no built-in alert or notification system.

## Try It Live

**[smart-alerts-hub.vercel.app](https://stocks-alerts.vercel.app)**

1. Click **"Try Demo"** — connects instantly to a paper trading account
2. Click any stock in the watchlist (e.g. AAPL) — see AI-powered insights
3. Click **"Analyze"** — get stock analysis in Pidgin, Yoruba, Igbo, or English
4. Go to **Alerts** → **Create Alert** → set a price condition
5. During US market hours (Mon-Fri, 9:30 AM - 4:00 PM ET), alerts trigger with live prices

### Telegram Alerts

When an alert triggers, you receive a Telegram message like this:

**Beginner + Pidgin:**
> 🔴 Bros, AAPL don drop 5% today o! Na because tariff talk dey cause wahala. Volume dey 3x pass normal — plenty people dey sell. You fit watch am small before you decide wetin you wan do. Not financial advice o.

**Pro + English:**
> 🚨 AAPL $174.50 (-5.1%) | RSI 28 | Vol 3.1x
> BofA PT raise to $320. Chip rally on Iran pause.

To try it: **Settings** → **Connect Telegram** → paste bot token → scan QR code → done.

## Features

- **Real-time monitoring** via dual WebSocket streams (market data + trade updates)
- **Configurable alerts** — price thresholds, P&L %, P&L $, order status
- **AI-powered stock insights** — technical analysis with news sentiment, explained in your language
- **Multi-language support** — English, Nigerian Pidgin, Yoruba, Igbo
- **Beginner/Pro modes** — simple explanations or data-driven alerts
- **Multi-channel notifications** — in-app toasts, Telegram messages, browser push
- **Portfolio dashboard** — live positions, P&L, account summary
- **Watchlist** — add any stock with autocomplete search from Alpaca's API
- **Quick trade** — buy/sell directly from the insight panel
- **Telegram QR onboarding** — scan to connect, no manual chat ID entry
- **Market hours detection** — shows "Opens Monday at 9:30 AM ET" instead of false "Reconnecting"
- **Connection resilience** — exponential backoff reconnection + REST polling fallback

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
- **Market hours awareness** — no false reconnection attempts when market is closed

## Setup

### Prerequisites

1. **Alpaca Paper Trading account** (free): [Sign up](https://app.alpaca.markets/signup)
   - Switch to Paper Trading mode
   - Generate API Key ID + Secret Key
   - Place a few paper trades (buy AAPL, TSLA, etc.)

2. **Telegram Bot** (optional):
   - Message [@BotFather](https://t.me/botfather) → `/newbot` → save bot token
   - Go to Settings in the app → Connect Telegram → paste token → scan QR → done

### Run Locally

```bash
git clone https://github.com/scriptlord/alpaca.git
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

## Security

- API keys stored in `sessionStorage` only — cleared on tab close
- Keys are never logged, written to disk, or sent to any third party
- All communication uses HTTPS/WSS
- WebSocket data is sanitized before rendering
- Alert thresholds validated (no negative prices, reasonable ranges)
- Production version would use Alpaca OAuth 2.0 for seamless authentication

## Disclaimer

Alerts are informational and not guaranteed. Not for time-critical trading decisions.

## License

MIT
