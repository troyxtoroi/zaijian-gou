/**
 * 股價資料服務 v3 — 真實資料優先，無假資料
 * - 啟動時立即載入所有股票
 * - 台灣市場時間內每 90 秒刷新
 * - 多重 Proxy 確保成功率
 */

/* ── CORS Proxy 策略 ────────────────────────────────────── */
const PROXIES = [
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

async function tryFetch(url, timeout = 8000) {
  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(url), { signal: AbortSignal.timeout(timeout) })
      if (!res.ok) continue
      let text = await res.text()
      try { const w = JSON.parse(text); if (w.contents) text = w.contents } catch {}
      return text
    } catch {}
  }
  // 最後嘗試直連
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (res.ok) return res.text()
  } catch {}
  throw new Error('all proxies failed')
}

/* ── Yahoo Finance 解析 ─────────────────────────────────── */
function parseChart(text) {
  const data = JSON.parse(text)
  const r    = data?.chart?.result?.[0]
  if (!r) throw new Error('no result')
  const { timestamp, indicators, meta } = r
  const q = indicators.quote[0]
  const candles = timestamp
    .map((ts, i) => ({
      date:   new Date(ts * 1000),
      open:   +((q.open[i]   || 0).toFixed(2)),
      high:   +((q.high[i]   || 0).toFixed(2)),
      low:    +((q.low[i]    || 0).toFixed(2)),
      close:  +((q.close[i]  || q.adjclose?.[i] || 0).toFixed(2)),
      volume: q.volume[i] || 0,
    }))
    .filter(c => c.close > 0 && c.high > 0)
  return { candles, meta }
}

/* ── 取得個股K線（日線，自動判斷上市/上櫃）─────────────── */
export async function fetchRealCandles(code, isOTC = false, days = 60) {
  const suffixes = isOTC ? ['TWO','TW'] : ['TW','TWO']
  for (const suffix of suffixes) {
    try {
      const url  = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.${suffix}?interval=1d&range=3mo`
      const text = await tryFetch(url)
      const { candles } = parseChart(text)
      if (candles.length >= 5) {
        console.log(`✅ ${code}.${suffix} 取得 ${candles.length} 根K線`)
        return candles.slice(-days)
      }
    } catch {}
  }
  throw new Error(`無法取得 ${code}`)
}

/* ── 取得即時報價（分鐘線，最新一筆） ───────────────────── */
export async function fetchRealTimePrice(code, isOTC = false) {
  const suffixes = isOTC ? ['TWO','TW'] : ['TW','TWO']
  for (const suffix of suffixes) {
    try {
      // 用 1 分鐘 K 線取今日最新價
      const url  = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.${suffix}?interval=5m&range=1d`
      const text = await tryFetch(url, 6000)
      const { candles, meta } = parseChart(text)
      if (candles.length > 0) {
        const last = candles[candles.length - 1]
        return { price: last.close, suffix, volume: last.volume }
      }
    } catch {}
  }
  return null
}

/* ── 全股票快取 ─────────────────────────────────────────── */
export const CANDLES_CACHE = {}
let _loadingCodes = new Set()

/** 初始化：不填假資料，讓 UI 顯示載入中 */
export function initCandleCache(sectors) {
  // 清空，不填假資料
  Object.keys(CANDLES_CACHE).forEach(k => delete CANDLES_CACHE[k])
}

/** 並發載入一批股票（最多同時 5 筆） */
async function loadBatch(stocks, onProgress) {
  const CONCURRENCY = 5
  let done = 0
  for (let i = 0; i < stocks.length; i += CONCURRENCY) {
    const batch = stocks.slice(i, i + CONCURRENCY)
    await Promise.allSettled(
      batch.map(async st => {
        try {
          const cs = await fetchRealCandles(st.code, st.otc === true)
          if (cs.length >= 5) {
            CANDLES_CACHE[st.code] = cs
            done++
            onProgress && onProgress(done, stocks.length)
          }
        } catch {}
      })
    )
    // Proxy 限速：批次間間隔
    if (i + CONCURRENCY < stocks.length) await sleep(150)
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

/** 一次載入所有族群的股票（頁面啟動時呼叫） */
export async function loadAllStocks(allSectors, onProgress) {
  // 收集所有不重複的股票
  const seen   = new Set()
  const stocks = []
  for (const sec of Object.values(allSectors)) {
    for (const st of (sec.stocks || [])) {
      if (!seen.has(st.code)) { seen.add(st.code); stocks.push(st) }
    }
  }
  await loadBatch(stocks, onProgress)
  return stocks.length
}

/** 載入單一族群（切換族群時用） */
export async function loadRealCandlesForSector(stocks) {
  const toLoad = stocks.filter(st => !CANDLES_CACHE[st.code])
  if (toLoad.length > 0) await loadBatch(toLoad, null)

  // 已有資料的也刷新最新價（不阻塞）
  refreshLatestPrices(stocks)
}

/** 刷新最新即時價格（非阻塞，更新 CANDLES_CACHE 最後一根K棒）*/
export async function refreshLatestPrices(stocks) {
  for (const st of stocks) {
    try {
      const rt = await fetchRealTimePrice(st.code, st.otc === true)
      if (!rt) continue
      const cs = CANDLES_CACHE[st.code]
      if (!cs || !cs.length) continue
      const last = cs[cs.length - 1]
      // 只更新今日K棒的收盤價（若市場開盤中）
      const today = new Date(); today.setHours(0,0,0,0)
      const lastDate = new Date(last.date); lastDate.setHours(0,0,0,0)
      if (lastDate.getTime() === today.getTime()) {
        last.close = rt.price
        if (rt.price > last.high) last.high = rt.price
        if (rt.price < last.low)  last.low  = rt.price
      }
    } catch {}
    await sleep(100)
  }
}

/* ── 台灣市場時間判斷 ───────────────────────────────────── */
export function isTWMarketOpen() {
  const now = new Date()
  // 台北時間 = UTC+8
  const tw  = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const day = tw.getUTCDay() // 0=週日, 6=週六
  if (day === 0 || day === 6) return false
  const h = tw.getUTCHours(), m = tw.getUTCMinutes()
  const mins = h * 60 + m
  return mins >= 9 * 60 && mins <= 13 * 60 + 30
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

// 保留相容性
export function generateCandles(base, code, n = 30) { return [] }
