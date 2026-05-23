/**
 * Stock data service.
 * Currently uses deterministic simulation.
 * Replace fetchCandles() with a real API call (e.g. FinMind, Yahoo Finance)
 * when you have a backend proxy to avoid CORS.
 *
 * Real FinMind endpoint (needs token):
 *   GET https://api.finmind.tw/api/latest/taiwan/TaiwanStockPrice
 *     ?dataset=TaiwanStockPrice&data_id={code}&start_date=YYYY-MM-DD&token=YOUR_TOKEN
 */

function seededRandom(seed) {
  let s = seed >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = s ^ (s >>> 16)
    return (s >>> 0) / 0xffffffff
  }
}

export function generateCandles(base, code, n = 30) {
  const r = seededRandom(parseInt(code.slice(-3)) || 42)
  const candles = []
  let price = base * (0.93 + r() * 0.07)
  const bullish = r() > 0.38
  const trend = bullish ? 0.0012 : -0.0006

  for (let i = 0; i < n; i++) {
    const open = price
    const vol = 0.022 + r() * 0.018
    const move = (r() - 0.47 + trend) * price * vol
    const close = Math.max(price * 0.4, price + move)
    const wUp = r() * price * vol * 0.7
    const wDn = r() * price * vol * 0.7
    candles.push({
      open:   +open.toFixed(2),
      close:  +close.toFixed(2),
      high:   +(Math.max(open, close) + wUp).toFixed(2),
      low:    +(Math.min(open, close) - wDn).toFixed(2),
      volume: Math.floor((0.2 + r() * 0.8) * 60000),
      date:   new Date(2026, 3, i + 22),
    })
    price = close
  }
  return candles
}

/** Pre-built cache — generated once on import */
export const CANDLES_CACHE = {}

export function initCandleCache(sectors) {
  Object.values(sectors).forEach(s =>
    s.stocks.forEach(st => {
      CANDLES_CACHE[st.code] = generateCandles(st.base, st.code)
    })
  )
}

export function calcMA(candles, period) {
  if (candles.length < period) return null
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
