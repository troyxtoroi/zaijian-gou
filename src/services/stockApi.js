/**
 * 股價資料服務 v4
 * 策略：先顯示合理佔位資料 → 當前族群優先真實載入 → 其他背景緩載
 */

/* ── CORS Proxy（只用最快的兩個）───────────────────────── */
async function tryFetch(url, timeout = 7000) {
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ]
  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy, { signal: AbortSignal.timeout(timeout) })
      if (!res.ok) continue
      let text = await res.text()
      try { const w = JSON.parse(text); if (w.contents) text = w.contents } catch {}
      return text
    } catch {}
  }
  throw new Error('fetch failed')
}

/* ── Yahoo Finance 解析 ─────────────────────────────────── */
function parseChart(text) {
  const data = JSON.parse(text)
  const r    = data?.chart?.result?.[0]
  if (!r) throw new Error('no result')
  const { timestamp, indicators } = r
  const q = indicators.quote[0]
  return timestamp
    .map((ts, i) => ({
      date:   new Date(ts * 1000),
      open:   +((q.open[i]  || 0).toFixed(2)),
      high:   +((q.high[i]  || 0).toFixed(2)),
      low:    +((q.low[i]   || 0).toFixed(2)),
      close:  +((q.close[i] || 0).toFixed(2)),
      volume: q.volume[i] || 0,
    }))
    .filter(c => c.close > 0)
}

/* ── 佔位K線（用真實基準價，視覺合理）──────────────────── */
export function generateCandles(base, code, n = 30) {
  if (!base || base <= 0) return []
  let price = base
  const candles = []
  const now = Date.now()
  for (let i = n - 1; i >= 0; i--) {
    const chg   = (Math.random() - 0.49) * 0.025
    const open  = price
    const close = Math.max(price * 0.5, price * (1 + chg))
    const hi    = Math.max(open, close) * (1 + Math.random() * 0.01)
    const lo    = Math.min(open, close) * (1 - Math.random() * 0.01)
    candles.push({
      date: new Date(now - i * 86400000),
      open: +open.toFixed(2), close: +close.toFixed(2),
      high: +hi.toFixed(2),   low:   +lo.toFixed(2),
      volume: Math.floor(Math.random() * 80000 + 20000),
      isPlaceholder: true,
    })
    price = close
  }
  return candles
}

/* ── 抓取真實K線 ─────────────────────────────────────────── */
export async function fetchRealCandles(code, isOTC = false) {
  const suffixes = isOTC ? ['TWO','TW'] : ['TW','TWO']
  for (const suffix of suffixes) {
    try {
      const url  = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.${suffix}?interval=1d&range=3mo`
      const text = await tryFetch(url)
      const cs   = parseChart(text)
      if (cs.length >= 5) return cs.slice(-60)
    } catch {}
  }
  throw new Error(`failed: ${code}`)
}

/* ── 全域快取 ───────────────────────────────────────────── */
export const CANDLES_CACHE = {}
const _loading = new Set()

/** 啟動：立刻用佔位資料填滿，顯示合理數字 */
export function initCandleCache(sectors) {
  Object.values(sectors).forEach(s =>
    s.stocks.forEach(st => {
      if (!CANDLES_CACHE[st.code])
        CANDLES_CACHE[st.code] = generateCandles(st.base || 100, st.code)
    })
  )
}

/** 優先載入一批股票（當前族群用）*/
export async function loadRealCandlesForSector(stocks) {
  await Promise.allSettled(
    stocks.map(async st => {
      if (_loading.has(st.code)) return
      _loading.add(st.code)
      try {
        const cs = await fetchRealCandles(st.code, st.otc === true)
        if (cs.length >= 5) CANDLES_CACHE[st.code] = cs
      } catch {}
      _loading.delete(st.code)
    })
  )
}

/** 背景緩慢載入其他族群（不阻塞 UI）*/
export function backgroundLoadAll(allSectors, onDone) {
  const seen = new Set(); const queue = []
  Object.values(allSectors).forEach(s =>
    (s.stocks || []).forEach(st => {
      if (!seen.has(st.code)) { seen.add(st.code); queue.push(st) }
    })
  )
  let i = 0
  async function next() {
    if (i >= queue.length) { onDone && onDone(); return }
    const st = queue[i++]
    if (!CANDLES_CACHE[st.code]?.some?.(c => !c.isPlaceholder)) {
      try {
        const cs = await fetchRealCandles(st.code, st.otc === true)
        if (cs.length >= 5) CANDLES_CACHE[st.code] = cs
      } catch {}
    }
    setTimeout(next, 300)  // 每筆間隔 300ms，不塞爆 proxy
  }
  // 同時跑 3 條背景線
  next(); setTimeout(next, 100); setTimeout(next, 200)
}

/** 台灣市場開盤判斷 */
export function isTWMarketOpen() {
  const tw  = new Date(Date.now() + 8 * 3600000)
  const day = tw.getUTCDay()
  if (day === 0 || day === 6) return false
  const m = tw.getUTCHours() * 60 + tw.getUTCMinutes()
  return m >= 540 && m <= 810   // 09:00~13:30
}

export async function loadAllStocks(allSectors, onProgress) {
  const seen = new Set(); const stocks = []
  Object.values(allSectors).forEach(s =>
    (s.stocks||[]).forEach(st => { if(!seen.has(st.code)){seen.add(st.code);stocks.push(st)} }))
  let done = 0
  await Promise.allSettled(stocks.map(async st => {
    try {
      const cs = await fetchRealCandles(st.code, st.otc===true)
      if (cs.length>=5) CANDLES_CACHE[st.code] = cs
    } catch {}
    onProgress && onProgress(++done, stocks.length)
  }))
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

export async function refreshLatestPrices(stocks) {}
