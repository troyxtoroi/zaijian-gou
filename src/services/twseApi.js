/**
 * TWSE 台灣證交所公開資料 API
 * 三大法人買賣超、融資融券餘額、月營收
 * 透過 CORS Proxy 存取
 */

const PROXIES = [
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

async function fetchTWSE(url) {
  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(url), { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue
      let text = await res.text()
      try { const w = JSON.parse(text); if (w.contents) text = w.contents } catch {}
      const data = JSON.parse(text)
      if (data.stat === 'OK' || data.status === 'OK' || Array.isArray(data.data)) return data
    } catch {}
  }
  return null
}

/** 格式化日期 YYYYMMDD */
function toDateStr(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

/* ── 三大法人買賣超（外資/投信/自營）───────────────────── */
export async function fetchInstitutional(stockCode, days = 5) {
  const today = toDateStr()
  const url   = `https://www.twse.com.tw/fund/TWT38U?response=json&date=${today}&stockNo=${stockCode}`
  const data  = await fetchTWSE(url)
  if (!data?.data) return null

  // data.data 每列：日期, 外資買, 外資賣, 外資買賣超, 投信買, 投信賣, 投信買賣超, 自營買, 自營賣, 自營買賣超, 三大合計
  const rows = data.data.slice(-days).map(row => ({
    date:    row[0],
    foreign: { buy: +row[1]?.replace(/,/g,''), sell: +row[2]?.replace(/,/g,''), net: +row[3]?.replace(/,/g,'') },
    trust:   { buy: +row[4]?.replace(/,/g,''), sell: +row[5]?.replace(/,/g,''), net: +row[6]?.replace(/,/g,'') },
    dealer:  { buy: +row[7]?.replace(/,/g,''), sell: +row[8]?.replace(/,/g,''), net: +row[9]?.replace(/,/g,'') },
    total:   +row[10]?.replace(/,/g,''),
  }))

  const latest = rows[rows.length - 1]
  const fiveDayForeign = rows.reduce((s, r) => s + (r.foreign.net || 0), 0)
  return { rows, latest, fiveDayForeign, stockCode }
}

/* ── 融資融券（保證金餘額）──────────────────────────────── */
export async function fetchMarginBalance(stockCode) {
  const today = toDateStr()
  const url   = `https://www.twse.com.tw/exchangeReport/MI_MARGN?response=json&date=${today}&selectType=stock&stockNo=${stockCode}`
  const data  = await fetchTWSE(url)
  if (!data?.data?.length) return null

  const latest = data.data[data.data.length - 1]
  return {
    date:          latest[0],
    marginBuy:     +latest[2]?.replace(/,/g,''),   // 融資買入
    marginSell:    +latest[3]?.replace(/,/g,''),   // 融資賣出
    marginBalance: +latest[4]?.replace(/,/g,''),   // 融資餘額
    shortSell:     +latest[8]?.replace(/,/g,''),   // 融券賣出
    shortBalance:  +latest[10]?.replace(/,/g,''),  // 融券餘額
    offset:        +latest[12]?.replace(/,/g,''),  // 資券相抵
  }
}

/* ── 月營收（TWSE 上市 / TPEX 上櫃）───────────────────── */
export async function fetchMonthlyRevenue(stockCode, isOTC = false) {
  // 取近3個月
  const now  = new Date()
  const results = []

  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year  = d.getFullYear()
    const month = d.getMonth() + 1

    let url
    if (isOTC) {
      // 上櫃使用 TPEX
      url = `https://www.tpex.org.tw/web/stock/financial/zsmk/zsmk_result.php?l=zh-tw&o=json&d=${year-1911}/${String(month).padStart(2,'0')}&s=${stockCode}`
    } else {
      url = `https://www.twse.com.tw/exchangeReport/BWIBBU_d?response=json&date=${year}${String(month).padStart(2,'0')}01&selectType=MS`
    }

    try {
      const data = await fetchTWSE(url)
      if (data?.data) {
        const row = data.data.find(r => r[0] === stockCode || r[1] === stockCode)
        if (row) results.push({ year, month, revenue: row })
      }
    } catch {}
  }
  return results
}
