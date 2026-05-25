/**
 * 股價資料服務 — 瀏覽器端 Yahoo Finance
 * 策略：佔位資料秒顯示 → 背景抓真實資料 → 自動替換
 */

/* ── 佔位 K 線（用真實基準價）──────────────────────────── */
export function generateCandles(base, code, n = 60) {
  const price0 = Math.max(base || 10, 1)
  const candles = []
  let p = price0 * (0.92 + Math.random() * 0.08)
  for (let i = n - 1; i >= 0; i--) {
    const chg   = (Math.random() - 0.48) * 0.022
    const open  = p
    const close = Math.max(p * 0.5, p * (1 + chg))
    const hi    = Math.max(open, close) * (1 + Math.random() * 0.008)
    const lo    = Math.min(open, close) * (1 - Math.random() * 0.008)
    candles.push({
      date:   new Date(Date.now() - i * 86400000),
      open:   +open.toFixed(2),
      close:  +close.toFixed(2),
      high:   +hi.toFixed(2),
      low:    +lo.toFixed(2),
      volume: Math.floor(10000 + Math.random() * 80000),
      isPlaceholder: true,
    })
    p = close
  }
  return candles
}

/* ── 全域 K 線快取 ──────────────────────────────────────── */
export const CANDLES_CACHE = {}

/** 啟動時立刻填佔位資料（確保頁面秒顯示） */
export function initCandleCache(sectors) {
  Object.values(sectors).forEach(sec =>
    (sec.stocks || []).forEach(st => {
      if (!CANDLES_CACHE[st.code])
        CANDLES_CACHE[st.code] = generateCandles(st.base || 50, st.code)
    })
  )
}

/* ── Yahoo Finance 抓取（CORS Proxy）────────────────────── */
const PROXIES = [
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  u => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
]

function parseYahoo(text) {
  let raw = text
  try { const w = JSON.parse(text); if (w.contents) raw = w.contents } catch {}
  const data = JSON.parse(raw)
  const r = data?.chart?.result?.[0]
  if (!r) throw new Error('no data')
  const { timestamp, indicators } = r
  const q = indicators.quote[0]
  return timestamp.map((ts, i) => ({
    date:   new Date(ts * 1000),
    open:   +((q.open[i]   || 0).toFixed(2)),
    high:   +((q.high[i]   || 0).toFixed(2)),
    low:    +((q.low[i]    || 0).toFixed(2)),
    close:  +((q.close[i]  || 0).toFixed(2)),
    volume: q.volume[i] || 0,
  })).filter(c => c.close > 0)
}

export async function fetchRealCandles(code, isOTC = false) {
  const suffixes = isOTC ? ['TWO','TW'] : ['TW','TWO']
  for (const suf of suffixes) {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.${suf}?interval=1d&range=3mo`
    for (const makeProxy of PROXIES) {
      try {
        const res = await fetch(makeProxy(yahooUrl), { signal: AbortSignal.timeout(8000) })
        if (!res.ok) continue
        const text = await res.text()
        const cs = parseYahoo(text)
        if (cs.length >= 5) return cs.slice(-60)
      } catch {}
    }
  }
  return null  // 失敗回傳 null，不丟例外
}

/** 載入單一族群的真實資料（非阻塞，成功就替換） */
export async function loadRealCandlesForSector(stocks) {
  await Promise.allSettled(
    stocks.map(async st => {
      const cs = await fetchRealCandles(st.code, st.otc === true)
      if (cs && cs.length >= 5) CANDLES_CACHE[st.code] = cs
    })
  )
}

/** 台灣市場時間 */
export function isTWMarketOpen() {
  const tw  = new Date(Date.now() + 8 * 3600000)
  const day = tw.getUTCDay()
  if (day === 0 || day === 6) return false
  const m = tw.getUTCHours() * 60 + tw.getUTCMinutes()
  return m >= 540 && m <= 810
}

/* ── 技術指標 ──────────────────────────────────────────── */
export function calcMA(candles, period) {
  if (!candles || candles.length < period) return null
  return candles.slice(-period).reduce((s, c) => s + c.close, 0) / period
}

export function calcRSI(candles, period = 14) {
  const sl = candles.slice(-(period + 1))
  if (sl.length < period + 1) return null
  let g = 0, l = 0
  for (let i = 1; i < sl.length; i++) {
    const d = sl[i].close - sl[i-1].close
    d > 0 ? (g += d) : (l -= d)
  }
  const ag = g / period, al = l / period
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al)
}
