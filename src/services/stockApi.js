/**
 * 股價資料服務 v5
 * 資料來源優先順序：
 *   1. WantGoo (旺狗) — 台灣本地網站，無需認證
 *   2. FinMind API   — 台灣金融資料平台
 *   3. TWSE OpenAPI  — 台灣證交所
 *   4. Yahoo Finance — 透過 CORS Proxy
 *   5. 佔位資料      — 基準價往回推算，數字合理
 */

/* ── 佔位 K 線（從基準價往回推，最後一根=基準價）────────── */
export function generateCandles(base, code, n = 60) {
  const b = Math.max(base || 10, 1)
  const raw = []
  let p = b
  for (let i = 0; i < n; i++) {
    const vol   = 0.012 + Math.random() * 0.010
    const chg   = (Math.random() - 0.50) * vol
    const close = p
    const open  = p * (1 - chg)
    raw.push({
      open:  Math.max(open,  b * 0.3),
      close: Math.max(close, b * 0.3),
      hi:    Math.max(open, close) * (1 + Math.random() * 0.005),
      lo:    Math.min(open, close) * (1 - Math.random() * 0.005),
    })
    p = open
  }
  raw.reverse()
  return raw.map((r, i) => ({
    date:   new Date(Date.now() - (n - 1 - i) * 86400000),
    open:   +r.open.toFixed(2),
    close:  +r.close.toFixed(2),
    high:   +r.hi.toFixed(2),
    low:    +r.lo.toFixed(2),
    volume: Math.floor(10000 + Math.random() * 80000),
    isPlaceholder: true,
  }))
}

/* ── 全域快取 ───────────────────────────────────────────── */
export const CANDLES_CACHE = {}

export function initCandleCache(sectors) {
  Object.values(sectors).forEach(sec =>
    (sec.stocks || []).forEach(st => {
      if (!CANDLES_CACHE[st.code])
        CANDLES_CACHE[st.code] = generateCandles(st.base || 50, st.code)
    })
  )
}

/* ════════════════════════════════════════════════════════
   資料來源 1 — WantGoo
   端點：/stock/51/{code}/daily-trades
════════════════════════════════════════════════════════ */
async function fetchFromWantGoo(code) {
  const end   = new Date()
  const start = new Date(end - 90 * 86400000)
  const fmt   = d => d.toISOString().slice(0, 10)
  const url   = `https://www.wantgoo.com/stock/51/${code}/daily-trades?startDate=${fmt(start)}&endDate=${fmt(end)}`

  const res = await fetch(url, {
    signal:  AbortSignal.timeout(8000),
    headers: {
      'Accept':           'application/json, text/plain, */*',
      'Accept-Language':  'zh-TW,zh;q=0.9',
      'Referer':          `https://www.wantgoo.com/stock/${code}`,
    },
    credentials: 'omit',
  })
  if (!res.ok) throw new Error(`WantGoo ${res.status}`)
  const data = await res.json()

  // WantGoo 格式：[{ date, openPrice, highPrice, lowPrice, closePrice, tradeVolume }]
  if (!Array.isArray(data) || data.length < 5) throw new Error('WantGoo empty')
  return data
    .map(d => ({
      date:   new Date(d.date || d.tradingDate || d.Date),
      open:   +(d.openPrice  || d.open  || d.Open  || 0),
      high:   +(d.highPrice  || d.high  || d.High  || 0),
      low:    +(d.lowPrice   || d.low   || d.Low   || 0),
      close:  +(d.closePrice || d.close || d.Close || 0),
      volume: +(d.tradeVolume|| d.volume|| d.Volume|| 0),
    }))
    .filter(c => c.close > 0)
    .slice(-60)
}

/* ════════════════════════════════════════════════════════
   資料來源 2 — FinMind API（台灣金融資料平台）
════════════════════════════════════════════════════════ */
async function fetchFromFinMind(code) {
  const start = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
  const url   = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${code}&start_date=${start}`

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`FinMind ${res.status}`)
  const data = await res.json()

  const records = data?.data
  if (!Array.isArray(records) || records.length < 5) throw new Error('FinMind empty')
  return records
    .map(d => ({
      date:   new Date(d.date),
      open:   +d.open,
      high:   +d.max,
      low:    +d.min,
      close:  +d.close,
      volume: +d.Trading_Volume || 0,
    }))
    .filter(c => c.close > 0)
    .slice(-60)
}

/* ════════════════════════════════════════════════════════
   資料來源 3 — TWSE OpenAPI（證交所）
════════════════════════════════════════════════════════ */
async function fetchFromTWSE(code) {
  // 抓最近兩個月日期
  const months = []
  for (let i = 0; i <= 2; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}01`)
  }

  const candles = []
  for (const dateStr of months) {
    try {
      const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${dateStr}&stockNo=${code}`
      const res = await fetch(url, {
        signal: AbortSignal.timeout(6000),
        headers: { 'Accept': 'application/json', 'Referer': 'https://www.twse.com.tw/' },
      })
      if (!res.ok) continue
      const data = await res.json()
      if (data.stat !== 'OK' || !data.data) continue

      for (const row of data.data) {
        // row: [日期, 成交股數, 成交金額, 開盤價, 最高價, 最低價, 收盤價, 漲跌價差, 成交筆數]
        const [dateRaw,,, open, high, low, close,,] = row
        const [y, m, dd] = dateRaw.replace(/\//g,'-').split('-')
        const year = parseInt(y) + 1911  // 民國年 → 西元
        candles.push({
          date:   new Date(`${year}-${m}-${dd}`),
          open:   +open.replace(/,/g,''),
          high:   +high.replace(/,/g,''),
          low:    +low.replace(/,/g,''),
          close:  +close.replace(/,/g,''),
          volume: 0,
        })
      }
    } catch {}
  }

  if (candles.length < 5) throw new Error('TWSE empty')
  return candles.filter(c => c.close > 0).sort((a,b)=>a.date-b.date).slice(-60)
}

/* ════════════════════════════════════════════════════════
   資料來源 4 — Yahoo Finance（CORS Proxy）
════════════════════════════════════════════════════════ */
async function fetchFromYahoo(code, isOTC) {
  const PROXIES = [
    u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  ]
  const suffixes = isOTC ? ['TWO','TW'] : ['TW','TWO']
  for (const suf of suffixes) {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.${suf}?interval=1d&range=3mo`
    for (const makeProxy of PROXIES) {
      try {
        const res = await fetch(makeProxy(yahooUrl), { signal: AbortSignal.timeout(8000) })
        if (!res.ok) continue
        let text = await res.text()
        try { const w = JSON.parse(text); if (w.contents) text = w.contents } catch {}
        const data = JSON.parse(text)
        const r = data?.chart?.result?.[0]
        if (!r) continue
        const { timestamp, indicators } = r
        const q = indicators.quote[0]
        const cs = timestamp.map((ts, i) => ({
          date:   new Date(ts * 1000),
          open:   +((q.open[i]  || 0).toFixed(2)),
          high:   +((q.high[i]  || 0).toFixed(2)),
          low:    +((q.low[i]   || 0).toFixed(2)),
          close:  +((q.close[i] || 0).toFixed(2)),
          volume: q.volume[i] || 0,
        })).filter(c => c.close > 0)
        if (cs.length >= 5) return cs.slice(-60)
      } catch {}
    }
  }
  throw new Error('Yahoo failed')
}

/* ── 主要抓取函式（多來源容錯）──────────────────────────── */
export async function fetchRealCandles(code, isOTC = false) {
  // 依序嘗試各資料來源
  const sources = [
    { name: 'WantGoo',  fn: () => fetchFromWantGoo(code) },
    { name: 'FinMind',  fn: () => fetchFromFinMind(code) },
    { name: 'TWSE',     fn: () => fetchFromTWSE(code)  },
    { name: 'Yahoo',    fn: () => fetchFromYahoo(code, isOTC) },
  ]
  for (const src of sources) {
    try {
      const cs = await src.fn()
      if (cs && cs.length >= 5) {
        console.log(`✅ ${code} 來自 ${src.name}，${cs.length} 根`)
        return cs
      }
    } catch (e) {
      console.log(`⚠️ ${code} ${src.name}: ${e.message}`)
    }
  }
  return null
}

export async function loadRealCandlesForSector(stocks) {
  await Promise.allSettled(
    stocks.map(async st => {
      const cs = await fetchRealCandles(st.code, st.otc === true)
      if (cs && cs.length >= 5) CANDLES_CACHE[st.code] = cs
    })
  )
}

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
  const ag = g/period, al = l/period
  return al === 0 ? 100 : 100 - 100/(1+ag/al)
}
