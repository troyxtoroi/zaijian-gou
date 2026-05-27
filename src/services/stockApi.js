/**
 * 股價資料服務 v6
 * 主力：FinMind（歷史K線）+ TWSE mis（即時報價）
 * 備援：TWSE 月報 → Yahoo Finance → 佔位資料
 */

/* ── 佔位 K 線（從基準價往回推，最後一根=基準價）────────── */
export function generateCandles(base, code, n = 60) {
  const b = Math.max(base || 10, 1)
  const raw = []
  let p = b
  for (let i = 0; i < n; i++) {
    const vol  = 0.010 + Math.random() * 0.012
    const chg  = (Math.random() - 0.50) * vol
    const cls  = p
    const opn  = p * (1 - chg)
    raw.push({ opn, cls, hi: Math.max(opn,cls)*(1+Math.random()*0.004), lo: Math.min(opn,cls)*(1-Math.random()*0.004) })
    p = opn
  }
  raw.reverse()
  return raw.map((r,i) => ({
    date:   new Date(Date.now() - (n-1-i)*86400000),
    open:   +r.opn.toFixed(2), close: +r.cls.toFixed(2),
    high:   +r.hi.toFixed(2),  low:   +r.lo.toFixed(2),
    volume: Math.floor(10000 + Math.random()*80000),
    isPlaceholder: true,
  }))
}

/* ── 全域快取 ───────────────────────────────────────────── */
export const CANDLES_CACHE = {}

export function initCandleCache(sectors) {
  Object.values(sectors).forEach(sec =>
    (sec.stocks||[]).forEach(st => {
      if (!CANDLES_CACHE[st.code])
        CANDLES_CACHE[st.code] = generateCandles(st.base||50, st.code)
    })
  )
}

/* ════════════════════════════════════════════════════════
   來源 1 — FinMind 歷史日K（免費，無需 Token）
   https://api.finmindtrade.com/api/v4/data
════════════════════════════════════════════════════════ */
async function fetchFinMindHistory(code) {
  const start = new Date(Date.now() - 100*86400000).toISOString().slice(0,10)
  const url   = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${code}&start_date=${start}`
  const res   = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`FinMind ${res.status}`)
  const json  = await res.json()
  const rows  = json?.data
  if (!Array.isArray(rows) || rows.length < 5) throw new Error('FinMind: no data')
  return rows.map(d => ({
    date:   new Date(d.date),
    open:   +d.open,
    high:   +d.max,
    low:    +d.min,
    close:  +d.close,
    volume: +(d.Trading_Volume || d.volume || 0),
  })).filter(c => c.close > 0).slice(-60)
}

/* ════════════════════════════════════════════════════════
   來源 2A — TWSE 即時報價（盤中用）
   mis.twse.com.tw — 上市股
   mis.twse.com.tw — 上櫃股 (otc_)
════════════════════════════════════════════════════════ */
async function fetchTWSERealTime(code, isOTC) {
  const ex  = isOTC ? 'otc' : 'tse'
  const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${ex}_${code}.tw&json=1&delay=0`
  const res = await fetch(url, {
    signal:  AbortSignal.timeout(8000),
    headers: { 'Referer': 'https://mis.twse.com.tw/' },
  })
  if (!res.ok) throw new Error(`TWSE-RT ${res.status}`)
  const json = await res.json()
  const d    = json?.msgArray?.[0]
  if (!d) throw new Error('TWSE-RT: no data')
  // z=即時成交, o=開盤, h=最高, l=最低, y=昨收, v=成交量
  const price = parseFloat(d.z || d.y || '0')
  if (!price) throw new Error('TWSE-RT: no price')
  return {
    price,
    open:   parseFloat(d.o || '0'),
    high:   parseFloat(d.h || '0'),
    low:    parseFloat(d.l || '0'),
    volume: parseInt((d.v || '0').replace(/,/g,'')),
    name:   d.n || '',
    isOpen: d.z && d.z !== '-',  // z = '-' 表示未開盤
  }
}

/* ════════════════════════════════════════════════════════
   來源 2B — TWSE 月報歷史資料（上市股備援）
   www.twse.com.tw/exchangeReport/STOCK_DAY
════════════════════════════════════════════════════════ */
async function fetchTWSEMonthly(code) {
  const candles = []
  for (let i = 0; i <= 2; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}01`
    try {
      const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${dateStr}&stockNo=${code}`
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: { Referer: 'https://www.twse.com.tw/' },
      })
      if (!res.ok) continue
      const json = await res.json()
      if (json.stat !== 'OK' || !json.data?.length) continue
      for (const row of json.data) {
        const [dateRaw,,, open, high, low, close] = row
        const parts = dateRaw.replace(/\//g,'-').split('-')
        const year  = parseInt(parts[0]) + 1911
        candles.push({
          date:   new Date(`${year}-${parts[1]}-${parts[2]}`),
          open:   +open.replace(/,/g,''),
          high:   +high.replace(/,/g,''),
          low:    +low.replace(/,/g,''),
          close:  +close.replace(/,/g,''),
          volume: 0,
        })
      }
    } catch {}
  }
  if (candles.length < 5) throw new Error('TWSE monthly: insufficient data')
  return candles.filter(c=>c.close>0).sort((a,b)=>a.date-b.date).slice(-60)
}

/* ════════════════════════════════════════════════════════
   來源 2C — TPEX 月報歷史資料（上櫃股備援）
   www.tpex.org.tw
════════════════════════════════════════════════════════ */
async function fetchTPEXMonthly(code) {
  const candles = []
  for (let i = 0; i <= 2; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const roc  = `${d.getFullYear()-1911}/${String(d.getMonth()+1).padStart(2,'0')}`
    try {
      const url = `https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_info/st43_result.php?l=zh-tw&d=${roc}&stkno=${code}&o=json`
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue
      const json = await res.json()
      const rows = json?.aaData
      if (!Array.isArray(rows) || !rows.length) continue
      for (const row of rows) {
        // [日期, 成交股數, 成交金額, 開盤, 最高, 最低, 收盤, ...]
        const [dateRaw,,, open, high, low, close] = row
        const parts = dateRaw.trim().split('/')
        const year  = parseInt(parts[0]) + 1911
        candles.push({
          date:   new Date(`${year}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`),
          open:   +open.replace(/,/g,''),
          high:   +high.replace(/,/g,''),
          low:    +low.replace(/,/g,''),
          close:  +close.replace(/,/g,''),
          volume: 0,
        })
      }
    } catch {}
  }
  if (candles.length < 5) throw new Error('TPEX monthly: insufficient data')
  return candles.filter(c=>c.close>0).sort((a,b)=>a.date-b.date).slice(-60)
}

/* ════════════════════════════════════════════════════════
   來源 3 — Yahoo Finance（CORS Proxy 備援）
════════════════════════════════════════════════════════ */
async function fetchYahoo(code, isOTC) {
  const suffixes = isOTC ? ['TWO','TW'] : ['TW','TWO']
  const proxies  = [
    u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  ]
  for (const suf of suffixes) {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.${suf}?interval=1d&range=3mo`
    for (const mkProxy of proxies) {
      try {
        const res = await fetch(mkProxy(yahooUrl), { signal: AbortSignal.timeout(8000) })
        if (!res.ok) continue
        let text = await res.text()
        try { const w = JSON.parse(text); if (w.contents) text = w.contents } catch {}
        const data = JSON.parse(text)
        const r = data?.chart?.result?.[0]
        if (!r) continue
        const { timestamp, indicators } = r
        const q = indicators.quote[0]
        const cs = timestamp.map((ts,i) => ({
          date:   new Date(ts*1000),
          open:   +((q.open[i]  ||0).toFixed(2)),
          high:   +((q.high[i]  ||0).toFixed(2)),
          low:    +((q.low[i]   ||0).toFixed(2)),
          close:  +((q.close[i] ||0).toFixed(2)),
          volume: q.volume[i]||0,
        })).filter(c=>c.close>0)
        if (cs.length >= 5) return cs.slice(-60)
      } catch {}
    }
  }
  throw new Error('Yahoo: all failed')
}

/* ── 主要抓取：歷史日K ──────────────────────────────────── */
export async function fetchRealCandles(code, isOTC = false) {
  const sources = [
    { name: 'FinMind',    fn: () => fetchFinMindHistory(code) },
    { name: isOTC?'TPEX':'TWSE', fn: () => isOTC ? fetchTPEXMonthly(code) : fetchTWSEMonthly(code) },
    { name: 'Yahoo',      fn: () => fetchYahoo(code, isOTC) },
  ]
  for (const src of sources) {
    try {
      const cs = await src.fn()
      if (cs?.length >= 5) {
        console.log(`✅ ${code} ← ${src.name} (${cs.length}根)`)
        return cs
      }
    } catch (e) {
      console.log(`⚠️ ${code} ${src.name}: ${e.message}`)
    }
  }
  return null
}

/* ── 即時報價：單股更新（備用）─────────────────────────── */
export async function updateRealTimePrice(code, isOTC) {
  try {
    const rt = await fetchTWSERealTime(code, isOTC)
    if (!rt?.price) return false
    applyRealTimeToCache(code, rt)
    return true
  } catch { return false }
}

/* ── 即時報價：批次更新所有股票（一次 API 搞定）──────────── */
export async function updateAllRealTime(stocks) {
  if (!stocks?.length) return

  // 上市/上櫃分開，各用一個 API call
  const listed = stocks.filter(s => !s.otc)
  const otc    = stocks.filter(s =>  s.otc)

  async function batchFetch(list, exchange) {
    if (!list.length) return
    try {
      const ex_ch = list.map(s => `${exchange}_${s.code}.tw`).join('|')
      const url   = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${ex_ch}&json=1&delay=0`
      const res   = await fetch(url, {
        signal:  AbortSignal.timeout(6000),
        headers: { Referer: 'https://mis.twse.com.tw/' },
      })
      if (!res.ok) return
      const json = await res.json()
      for (const d of (json?.msgArray || [])) {
        const code  = d.c
        const price = parseFloat(d.z || d.y || '0')
        if (!code || !price) continue
        applyRealTimeToCache(code, {
          price,
          open:   parseFloat(d.o || '0'),
          high:   parseFloat(d.h || '0'),
          low:    parseFloat(d.l || '0'),
          volume: parseInt((d.v||'0').replace(/,/g,'')),
        })
      }
    } catch {}
  }

  await Promise.all([
    batchFetch(listed, 'tse'),
    batchFetch(otc,    'otc'),
  ])
}

function applyRealTimeToCache(code, rt) {
  const cs = CANDLES_CACHE[code]
  if (!cs?.length) return
  const last    = cs[cs.length - 1]
  const today   = new Date(); today.setHours(0,0,0,0)
  const lastDay = new Date(last.date); lastDay.setHours(0,0,0,0)
  if (lastDay.getTime() === today.getTime()) {
    if (rt.price > 0) last.close = rt.price
    if (rt.high  > 0) last.high  = Math.max(last.high, rt.high)
    if (rt.low   > 0 && rt.low < last.low) last.low = rt.low
    if (rt.open  > 0) last.open  = rt.open
  }
}

/* ── 批次載入族群 ───────────────────────────────────────── */
export async function loadRealCandlesForSector(stocks) {
  // 5筆並發，不塞爆 API
  const BATCH = 5
  for (let i = 0; i < stocks.length; i += BATCH) {
    await Promise.allSettled(
      stocks.slice(i, i+BATCH).map(async st => {
        const cs = await fetchRealCandles(st.code, st.otc === true)
        if (cs?.length >= 5) CANDLES_CACHE[st.code] = cs
      })
    )
    if (i + BATCH < stocks.length) await new Promise(r => setTimeout(r, 200))
  }
}

/* ── 盤中即時更新所有當前族群 ────────────────────────────── */
export async function refreshCurrentSector(stocks) {
  await Promise.allSettled(
    stocks.map(st => updateRealTimePrice(st.code, st.otc === true))
  )
}

export function isTWMarketOpen() {
  const tw  = new Date(Date.now() + 8*3600000)
  const day = tw.getUTCDay()
  if (day === 0 || day === 6) return false
  const m = tw.getUTCHours()*60 + tw.getUTCMinutes()
  return m >= 540 && m <= 810
}

/* ── 技術指標 ──────────────────────────────────────────── */
export function calcMA(candles, period) {
  if (!candles || candles.length < period) return null
  return candles.slice(-period).reduce((s,c) => s+c.close, 0) / period
}
export function calcRSI(candles, period = 14) {
  const sl = candles.slice(-(period+1))
  if (sl.length < period+1) return null
  let g = 0, l = 0
  for (let i = 1; i < sl.length; i++) {
    const d = sl[i].close - sl[i-1].close
    d > 0 ? (g += d) : (l -= d)
  }
  const ag = g/period, al = l/period
  return al === 0 ? 100 : 100 - 100/(1+ag/al)
}
