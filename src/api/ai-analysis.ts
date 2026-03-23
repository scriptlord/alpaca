const AI_API_URL = 'https://api.anthropic.com/v1/messages'
const AI_KEY_STORAGE = 'ai_api_key'

const ENV_AI_KEY = import.meta.env.VITE_AI_API_KEY as string | undefined

export function setAiApiKey(key: string) {
  sessionStorage.setItem(AI_KEY_STORAGE, key)
}

export function getAiApiKey(): string | null {
  return sessionStorage.getItem(AI_KEY_STORAGE) ?? ENV_AI_KEY ?? null
}

export function hasAiApiKey(): boolean {
  return !!(sessionStorage.getItem(AI_KEY_STORAGE) ?? ENV_AI_KEY)
}

export type Language = 'english' | 'pidgin' | 'yoruba' | 'igbo'

const languageInstructions: Record<Language, string> = {
  english: 'Respond in clear, conversational English.',
  pidgin: `Respond in Nigerian Pidgin English. Use natural pidgin expressions like:
- "don" for past tense ("e don drop")
- "dey" for continuous ("e dey rise")
- "fit" for possibility ("e fit bounce back")
- "wahala" for trouble
- "bros" to address the reader
- "abi" for "right?"
- "no be small thing" for emphasis
Keep it natural, not forced. A Lagos trader should feel at home reading this.`,
  yoruba: `Respond in Yoruba language. Use common Yoruba expressions naturally.
Keep financial terms in English where Yoruba equivalent would be unclear (e.g. keep "stock", "RSI", "volume").
Mix with English where natural — the way a Yoruba-speaking trader actually talks about markets.`,
  igbo: `Respond in Igbo language. Use common Igbo expressions naturally.
Keep financial terms in English where Igbo equivalent would be unclear (e.g. keep "stock", "RSI", "volume").
Mix with English where natural — the way an Igbo-speaking trader actually talks about markets.`,
}

export async function getAiAnalysis(params: {
  symbol: string
  currentPrice: number
  dailyChangePct: number
  rsi: number
  rsiSignal: string
  volumeRatio: number
  volumeSignal: string
  priceVsSma50: number
  priceVsSma200: number
  momentumSignal: string
  momentumReasons: string[]
  newsHeadlines: string[]
  newsSentiment: string
  language: Language
  brief?: boolean
  experienceMode?: 'beginner' | 'pro'
}): Promise<string> {
  const apiKey = getAiApiKey()
  if (!apiKey) throw new Error('AI API key not configured')

  const dataBlock = `Here's the current data for ${params.symbol}:

PRICE: $${params.currentPrice.toFixed(2)} (${params.dailyChangePct >= 0 ? '+' : ''}${params.dailyChangePct.toFixed(2)}% today)

TECHNICAL INDICATORS:
- RSI (14): ${params.rsi.toFixed(0)} — ${params.rsiSignal}
- Volume: ${params.volumeRatio.toFixed(1)}x average — ${params.volumeSignal}
- Price vs 50-day moving average: ${params.priceVsSma50 >= 0 ? '+' : ''}${params.priceVsSma50.toFixed(1)}%
- Price vs 200-day moving average: ${params.priceVsSma200 >= 0 ? '+' : ''}${params.priceVsSma200.toFixed(1)}%
- Overall signal: ${params.momentumSignal}
- Reasons: ${params.momentumReasons.join(', ')}

RECENT NEWS:
${params.newsHeadlines.length > 0 ? params.newsHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n') : 'No recent news available'}
News sentiment: ${params.newsSentiment}`

  const mode = params.experienceMode ?? 'pro'

  const modeInstructions = mode === 'beginner'
    ? `The reader is NEW to stock trading. They don't understand technical jargon.
- Do NOT use terms like RSI, moving average, volume ratio, or momentum unless you explain them simply
- Explain WHAT happened, WHY it happened (cite specific news if available), and what they MIGHT consider doing
- End with "Not financial advice"
- Use a warm, helpful tone — like explaining to a friend`
    : `The reader is an experienced trader. Be concise and data-driven.
- Use technical terms freely (RSI, MA, volume, momentum)
- Focus on actionable data, not explanations
- No disclaimers needed`

  const prompt = params.brief
    ? `You are a stock analyst sending a quick mobile alert. Be extremely brief.

${languageInstructions[params.language]}

${modeInstructions}

${dataBlock}

${mode === 'beginner'
  ? `Give a 2-3 sentence summary:
- What happened and why (in simple terms, cite news if available)
- What the reader might want to consider doing
- End with "Not financial advice"
No bullet points. No headers. Plain sentences.`
  : `Give a 2-sentence summary ONLY:
- Sentence 1: What happened and why (mention the specific cause if news explains it)
- Sentence 2: Key data point or what to watch
Maximum 2 sentences. No bullet points. No headers.`}`
    : `You are a knowledgeable stock market analyst.

${languageInstructions[params.language]}

${modeInstructions}

${dataBlock}

${mode === 'beginner'
  ? `Explain in 4-6 sentences:
1. What happened to this stock and WHY (cite specific news)
2. What this means for someone who owns it or is watching it
3. What they might want to do next (without giving direct advice)
4. End with "Not financial advice"

Use simple language. No jargon. Be warm and helpful.`
  : `Give a brief analysis (4-6 sentences max):
1. What's happening with this stock right now and WHY
2. What the indicators suggest about short-term direction
3. What a trader should watch for next
4. Any risks to be aware of

Be concise and data-driven.`}`

  const res = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: params.brief ? 150 : 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI API error: ${res.status} — ${err}`)
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text: string }>
  }

  let text = data.content[0]?.text ?? 'Analysis unavailable'

  // API returns **bold** but Telegram expects *bold*
  text = text.replace(/\*\*(.+?)\*\*/g, '*$1*')

  return text
}
