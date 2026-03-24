# Smart Trading Alerts Hub

A real-time alert system built on Alpaca's Paper Trading API. It monitors market data and your portfolio, checks conditions you set, and pings you on Telegram when something happens — with a breakdown of *why* it happened, in your own language.

I built this because Alpaca has no built-in alerts. Their users have been asking for it on the forum for years.

## Try It Live

**[stocks-alerts.vercel.app](https://stocks-alerts.vercel.app)**

1. Click **"Try Demo"** — connects to a paper trading account instantly
2. Click any stock in the watchlist (e.g. AAPL) — see insights
3. Click **"Analyze"** — get a breakdown in Pidgin, Yoruba, Igbo, or English
4. Go to **Alerts** → **Create Alert** → set a price condition
5. During market hours (Mon-Fri, 9:30 AM - 4:00 PM ET), alerts fire with live prices

### Telegram Alerts

When an alert triggers, you get a Telegram message like this:

**Beginner + Pidgin:**
> 🔴 Bros, AAPL don drop 5% today o! Na because tariff talk dey cause wahala. Volume dey 3x pass normal — plenty people dey sell. You fit watch am small before you decide wetin you wan do. Not financial advice o.

**Pro + English:**
> 🚨 AAPL $174.50 (-5.1%) | RSI 28 | Vol 3.1x
> BofA PT raise to $320. Chip rally on Iran pause.

Set it up in **Settings** → **Connect Telegram** → paste bot token → scan QR code → done.

## What It Does

- Connects to Alpaca via dual WebSocket streams (market data + trade updates)
- Lets you set alerts on price, P&L %, P&L $, or order status
- Sends notifications via in-app toasts, Telegram, and browser push
- Shows stock insights: RSI, volume vs average, moving averages, news sentiment
- Explains what's happening in English, Pidgin, Yoruba, or Igbo
- Beginner mode explains like you're new; Pro mode gives you raw data
- Watchlist with autocomplete search from Alpaca's asset API
- Buy/sell directly from the insight panel
- Telegram onboarding via QR code — no manual chat ID entry
- Detects market hours — shows "Opens Monday at 9:30 AM ET" instead of pretending to reconnect
- Falls back to REST polling if WebSocket drops

## Tech Stack

| Tech | Why |
|---|---|
| React (Vite) + TypeScript | Fast builds, type safety |
| TailwindCSS + shadcn/ui | Clean components, consistent styling |
| Zustand | Lightweight state — 3 separate slices so price ticks don't re-render the alert form |
| TanStack Query | Stale-while-revalidate for REST data |
| TanStack Virtual | Virtualized list for triggered alerts (can grow to thousands) |
| idb-keyval | IndexedDB for alert history — localStorage caps at 5MB |
| lightweight-charts | Sparkline price charts from TradingView |
| sonner | Toast notifications |
| Vitest | Unit tests for the condition engine |

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

### Why I Made These Choices

- **IndexedDB** over localStorage — alert history grows, 5MB limit would break it
- **sessionStorage** for API keys — financial credentials shouldn't persist to disk
- **Real WebSocket streams** — not mocked, proves it works with Alpaca's actual infra
- **requestAnimationFrame batching** — WebSocket ticks come faster than 60fps, batching prevents render storms
- **Pure function condition engine** — no side effects, fully testable, 15 unit tests
- **Exponential backoff + jitter** — reconnection that doesn't hammer the server
- **5-minute cooldown per rule** — prevents notification spam on volatile price swings

## Running It Yourself

### What You Need

1. **Alpaca Paper Trading account** (free): [Sign up](https://app.alpaca.markets/signup)
   - Switch to Paper Trading
   - Generate API Key ID + Secret Key
   - Buy a few paper stocks (AAPL, TSLA, etc.)

2. **Telegram Bot** (optional):
   - Message [@BotFather](https://t.me/botfather) → `/newbot` → save the token
   - In the app: Settings → Connect Telegram → paste token → scan QR → done

### Local Dev

```bash
git clone https://github.com/scriptlord/alpaca.git
cd alpaca
npm install
npm run dev
```

Open `http://localhost:5173` — enter your API keys when prompted.

No `.env` needed — credentials live in sessionStorage and clear when you close the tab.

### Tests

```bash
npm test
```

## Security

- Credentials in `sessionStorage` only — gone when you close the tab
- Never logged, never written to disk, never sent anywhere except Alpaca's API
- All traffic over HTTPS/WSS
- Production would use Alpaca OAuth 2.0 instead of manual key entry

## Disclaimer

This is for awareness, not trading decisions. Alerts are not guaranteed.

## License

MIT
