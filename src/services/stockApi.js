/**
 * Stock data service — 真實股價 via 多重 CORS proxy 嘗試
 * 失敗時 fallback 到 sectors.js 的基準價格模擬數據
 */

/* ── Simulated data (fallback) ─────────────────────────── */
function seededRandom(seed) {
  let s = seed >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    return (s >>> 0) / 0xffffffff
  }
}

export function generateCandles(base, code, n = 30) {
  const r = seededRandom(parseInt(code.slice(-3)) || 42)
  const candles = []
  let price = base * (0.93 + r() * 0.07)
  const trend = r() > 0.38 ? 0.0012 : -0.0006
  for (let i = 0; i < n; i++) {
    const open  = price
    const vol   = 0.022 + r() * 0.018
    const move  = (r() - 0.47 + trend) * price * vol
    const close = Math.max(price * 0.4, price + move)
    const wUp   = r() * price * vol * 0.7
    const wDn   = r() * price * vol * 0.7
    candles.push({
      open:   +open.toFixed(2),
      close:  +close.toFixed(2),
      high:   +(Math.max(open, close) + wUp).toFixed(2),
      low:    +(Math.min(open, close) - wDn).toFixed(2),
      volume: Math.floor((0.2 + r() * 0.8) * 60000),
      date:   new Date(Date.now() - (n - i) * 86400000),
    })
    price = close
  }
  return candles
}

/* ── 多重 CORS proxy 嘗試 ──────────────────────────────── */
const PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

async function fetchViaProxy(yahooUrl) {
  for (const makeProxy of PROXIES) {
    try {
      const proxyUrl = makeProxy(yahooUrl)
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue

      const text = await res.text()
      // allorigins wraps in { contents: "..." }
      let raw = text
      try {
        const wrapper = JSON.parse(text)
        if (wrapper.contents) raw = wrapper.contents
      } catch {}

      const chart = JSON.parse(raw)
      if (chart.chart?.error || !chart.chart?.result?.[0]) continue

      const result     = chart.chart.result[0]
      const timestamps = result.timestamp
      const q          = result.indicators.quote[0]

      const candles = timestamps
        .map((ts, i) => ({
          date:   new Date(ts * 1000),
          open:   parseFloat((q.open[i]  ?? 0).toFixed(2)),
          high:   parseFloat((q.high[i]  ?? 0).toFixed(2)),
          low:    parseFloat((q.low[i]   ?? 0).toFixed(2)),
          close:  parseFloat((q.close[i] ?? 0).toFixed(2)),
          volume: q.volume[i] || 0,
        }))
        .filter(c => c.close > 0 && c.open > 0 && !isNaN(c.close))

      if (candles.length >= 5) return candles
    } catch {}
  }
  throw new Error('all proxies failed')
}

export async function fetchRealCandles(code, days = 40) {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.TW?interval=1d&range=3mo`
  const candles = await fetchViaProxy(yahooUrl)
  return candles.slice(-days)
}

/* ── Candle cache ─────────────────────────────────────────── */
export const CANDLES_CACHE = {}

export function initCandleCache(sectors) {
  Object.values(sectors).forEach(s =>
    s.stocks.forEach(st => {
      CANDLES_CACHE[st.code] = generateCandles(st.base, st.code)
    })
  )
}

export async function loadRealCandlesForSector(stocks) {
  await Promise.allSettled(
    stocks.map(async (st) => {
      try {
        const real = await fetchRealCandles(st.code)
        if (real.length >= 5) {
          CANDLES_CACHE[st.code] = real
          console.log(`✅ ${st.code} ${st.name}: 真實資料 ${real.length} 根`)
        }
      } catch (e) {
        console.warn(`⚠️ ${st.code} ${st.name}: 使用模擬資料 (${e.message})`)
      }
    })
  )
}

/* ── Indicators ───────────────────────────────────────────── */
export function calcMA(candles, period) {
  if (!candles || candles.length < period) return null
  return candles.slice(-period).reduce((s, c) => s + c.close, 0) / period
}

export function calcRSI(candles, period = 14) {
  const slice = candles.slice(-(period + 1))
  let gains = 0, losses = 0
  for (let i = 1; i < slice.length; i++) {
    const d = slice[i].close - slice[i - 1].close
    d > 0 ? (gains += d) : (losses += Math.abs(d))
  }
  const avgG = gains / period
  const avgL = losses / period
  return avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL)
}
