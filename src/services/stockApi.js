/**
 * 股價資料服務 — 直連 Yahoo Finance（支援上市.TW / 上櫃.TWO）
 * 透過多重 CORS Proxy 嘗試，確保瀏覽器可以存取
 */

/* ── 模擬資料（備援） ───────────────────────────────────── */
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

/* ── Yahoo Finance 解析 ────────────────────────────────── */
function parseYahooResponse(text) {
  let raw = text
  // allorigins wraps in { contents: "..." }
  try {
    const w = JSON.parse(text)
    if (w.contents) raw = w.contents
  } catch {}

  const chart = JSON.parse(raw)
  const result = chart?.chart?.result?.[0]
  if (!result) throw new Error('no result')

  const { timestamp, indicators } = result
  const q = indicators.quote[0]

  return timestamp
    .map((ts, i) => ({
      date:   new Date(ts * 1000),
      open:   parseFloat((q.open[i]  || 0).toFixed(2)),
      high:   parseFloat((q.high[i]  || 0).toFixed(2)),
      low:    parseFloat((q.low[i]   || 0).toFixed(2)),
      close:  parseFloat((q.close[i] || 0).toFixed(2)),
      volume: q.volume[i] || 0,
    }))
    .filter(c => c.close > 0 && !isNaN(c.close))
}

/* ── 多重 CORS Proxy ────────────────────────────────────── */
async function fetchWithProxies(yahooUrl) {
  const strategies = [
    // 直接連線（部分瀏覽器/環境可能有效）
    async () => {
      const r = await fetch(yahooUrl, {
        signal: AbortSignal.timeout(6000),
        headers: { 'Accept': 'application/json' },
      })
      if (!r.ok) throw new Error(`direct ${r.status}`)
      return r.text()
    },
    // corsproxy.io
    async () => {
      const r = await fetch(`https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
        { signal: AbortSignal.timeout(8000) })
      if (!r.ok) throw new Error(`corsproxy ${r.status}`)
      return r.text()
    },
    // allorigins raw
    async () => {
      const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
        { signal: AbortSignal.timeout(8000) })
      if (!r.ok) throw new Error(`allorigins ${r.status}`)
      return r.text()
    },
    // allorigins get (JSON wrapper)
    async () => {
      const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`,
        { signal: AbortSignal.timeout(8000) })
      if (!r.ok) throw new Error(`allorigins-get ${r.status}`)
      return r.text()
    },
    // codetabs
    async () => {
      const r = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(yahooUrl)}`,
        { signal: AbortSignal.timeout(8000) })
      if (!r.ok) throw new Error(`codetabs ${r.status}`)
      return r.text()
    },
  ]

  for (const strategy of strategies) {
    try {
      const text = await strategy()
      const candles = parseYahooResponse(text)
      if (candles.length >= 5) return candles
    } catch {}
  }
  throw new Error('all strategies failed')
}

/* ── 取得真實 K 線（自動判斷上市/上櫃）─────────────────── */
export async function fetchRealCandles(code, isOTC = false, days = 40) {
  // 上市用 .TW，上櫃用 .TWO
  const suffixes = isOTC ? ['TWO', 'TW'] : ['TW', 'TWO']

  for (const suffix of suffixes) {
    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.${suffix}?interval=1d&range=3mo`
      const candles = await fetchWithProxies(yahooUrl)
      if (candles.length >= 5) {
        console.log(`✅ ${code}.${suffix}: 取得 ${candles.length} 根真實K線`)
        return candles.slice(-days)
      }
    } catch (e) {
      console.warn(`⚠️ ${code}.${suffix} 失敗: ${e.message}`)
    }
  }
  throw new Error(`無法取得 ${code} 真實資料`)
}

/* ── K 線快取 ──────────────────────────────────────────── */
export const CANDLES_CACHE = {}

export function initCandleCache(sectors) {
  Object.values(sectors).forEach(s =>
    s.stocks.forEach(st => {
      CANDLES_CACHE[st.code] = generateCandles(st.base, st.code)
    })
  )
}

export async function loadRealCandlesForSector(stocks) {
  const results = await Promise.allSettled(
    stocks.map(async (st) => {
      try {
        const real = await fetchRealCandles(st.code, st.otc === true)
        if (real.length >= 5) {
          CANDLES_CACHE[st.code] = real
          return { code: st.code, success: true, count: real.length }
        }
      } catch (e) {
        return { code: st.code, success: false, error: e.message }
      }
    })
  )
  return results
}

/* ── 技術指標 ──────────────────────────────────────────── */
export function calcMA(candles, period) {
  if (!candles || candles.length < period) return null
  return candles.slice(-period).reduce((s, c) => s + c.close, 0) / period
}

export function calcRSI(candles, period = 14) {
  const slice = candles.slice(-(period + 1))
  if (slice.length < period + 1) return null
  let gains = 0, losses = 0
  for (let i = 1; i < slice.length; i++) {
    const d = slice[i].close - slice[i - 1].close
    d > 0 ? (gains += d) : (losses += Math.abs(d))
  }
  const avgG = gains / period, avgL = losses / period
  return avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL)
}
