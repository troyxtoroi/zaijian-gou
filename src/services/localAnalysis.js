/**
 * 本地 K 線技術分析引擎 + 市場情境加分
 */
import { getMarketSentimentBonus, getStockRating } from '../data/marketContext.js'

/* ── 指標計算 ───────────────────────────────────────────── */
export function calcMA(candles, period) {
  if (candles.length < period) return null
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

export function calcBollinger(candles, period = 20) {
  if (candles.length < period) return null
  const slice = candles.slice(-period)
  const ma = slice.reduce((s, c) => s + c.close, 0) / period
  const std = Math.sqrt(slice.reduce((s, c) => s + (c.close - ma) ** 2, 0) / period)
  return { upper: ma + 2 * std, middle: ma, lower: ma - 2 * std }
}

/* ── K 線型態識別 ───────────────────────────────────────── */
function body(c) { return Math.abs(c.close - c.open) }
function range(c) { return c.high - c.low }
function upperWick(c) { return c.high - Math.max(c.open, c.close) }
function lowerWick(c) { return Math.min(c.open, c.close) - c.low }
function isBull(c) { return c.close > c.open }
function isBear(c) { return c.close < c.open }

function detectPattern(candles) {
  const n = candles.length
  if (n < 3) return { name: '資料不足', type: 'neutral', strength: 40 }
  const c0 = candles[n-1], c1 = candles[n-2], c2 = candles[n-3]
  const body0 = body(c0), body1 = body(c1), body2 = body(c2)
  const range0 = range(c0), range1 = range(c1)

  if (body0 < range0 * 0.1 && range0 > 0) {
    if (upperWick(c0) > body0 * 2 && lowerWick(c0) < body0) return { name: '流星線', type: 'bearish', strength: 70 }
    if (lowerWick(c0) > body0 * 2 && upperWick(c0) < body0) return { name: '倒錘線', type: 'bullish', strength: 65 }
    return { name: '十字線', type: 'neutral', strength: 50 }
  }
  if (isBull(c0) && lowerWick(c0) > body0 * 2 && upperWick(c0) < body0 * 0.5) return { name: '錘子線', type: 'bullish', strength: 78 }
  if (isBear(c0) && lowerWick(c0) > body0 * 2 && upperWick(c0) < body0 * 0.5) return { name: '吊人線', type: 'bearish', strength: 65 }
  if (isBear(c0) && upperWick(c0) > body0 * 2 && lowerWick(c0) < body0 * 0.3) return { name: '射擊之星', type: 'bearish', strength: 72 }
  if (isBear(c1) && isBull(c0) && c0.open < c1.close && c0.close > c1.open && body0 > body1) return { name: '多方吞噬', type: 'bullish', strength: 82 }
  if (isBull(c1) && isBear(c0) && c0.open > c1.close && c0.close < c1.open && body0 > body1) return { name: '空方吞噬', type: 'bearish', strength: 82 }
  if (isBear(c2) && body1 < body2 * 0.4 && isBull(c0) && body0 > body2 * 0.6 && c0.close > (c2.open + c2.close) / 2) return { name: '晨星', type: 'bullish', strength: 87 }
  if (isBull(c2) && body1 < body2 * 0.4 && isBear(c0) && body0 > body2 * 0.6 && c0.close < (c2.open + c2.close) / 2) return { name: '夜星', type: 'bearish', strength: 87 }
  if (isBull(c0) && isBull(c1) && isBull(c2) && c0.close > c1.close && c1.close > c2.close && body0 > range0 * 0.6 && body1 > range1 * 0.6) return { name: '三白兵', type: 'bullish', strength: 90 }
  if (isBear(c0) && isBear(c1) && isBear(c2) && c0.close < c1.close && c1.close < c2.close && body0 > range0 * 0.6 && body1 > range1 * 0.6) return { name: '三烏鴉', type: 'bearish', strength: 90 }
  if (body0 < range0 * 0.3 && upperWick(c0) > body0 && lowerWick(c0) > body0) return { name: '紡錘線', type: 'neutral', strength: 45 }
  if (isBull(c0) && body0 > range0 * 0.7) return { name: '長陽線', type: 'bullish', strength: 68 }
  if (isBear(c0) && body0 > range0 * 0.7) return { name: '長陰線', type: 'bearish', strength: 68 }
  return { name: '一般K棒', type: 'neutral', strength: 40 }
}

function detectTrend(candles, ma5, ma10, ma20) {
  if (!ma5 || !ma10 || !ma20) return { trend: '盤整', strength: 30 }
  const last = candles[candles.length - 1].close
  if (last > ma5 && ma5 > ma10 && ma10 > ma20) return { trend: '上漲', strength: 82 }
  if (last < ma5 && ma5 < ma10 && ma10 < ma20) return { trend: '下跌', strength: 82 }
  if (ma5 > ma10 && last > ma20) return { trend: '上漲', strength: 65 }
  if (ma5 < ma10 && last < ma20) return { trend: '下跌', strength: 65 }
  return { trend: '盤整', strength: 40 }
}

/* ── 綜合分析（含市場情境）──────────────────────────────── */
export function analyzeLocally({ stock, candles, ma5, ma10, ma20, sectorKey }) {
  if (!candles || candles.length < 5) {
    return { pattern:'資料不足', trend:'—', signal:'觀望', confidence:0, analysis:'K線資料不足', error:true }
  }

  const last    = candles[candles.length - 1]
  const rsi14   = calcRSI(candles, 14)
  const boll    = calcBollinger(candles, 20)
  const pattern = detectPattern(candles)
  const trendInfo = detectTrend(candles, ma5, ma10, ma20)

  const vol5avg   = candles.slice(-6, -1).reduce((s, c) => s + c.volume, 0) / 5
  const volRatio  = last.volume / (vol5avg || 1)
  const volConfirm = volRatio > 1.3

  let bullScore = 0, bearScore = 0

  // K線型態
  if (pattern.type === 'bullish') bullScore += pattern.strength
  if (pattern.type === 'bearish') bearScore += pattern.strength

  // 趨勢
  if (trendInfo.trend === '上漲') bullScore += trendInfo.strength
  if (trendInfo.trend === '下跌') bearScore += trendInfo.strength

  // RSI
  if (rsi14 !== null) {
    if (rsi14 < 30) bullScore += 65
    if (rsi14 > 70) bearScore += 60
    if (rsi14 < 40) bullScore += 20
    if (rsi14 > 60) bearScore += 20
  }

  // 布林通道
  if (boll) {
    if (last.close < boll.lower) bullScore += 55
    if (last.close > boll.upper) bearScore += 55
    if (last.close > boll.middle && trendInfo.trend === '上漲') bullScore += 20
  }

  // 放量加分
  if (volConfirm) {
    if (pattern.type === 'bullish') bullScore += 25
    if (pattern.type === 'bearish') bearScore += 25
  }

  // ── 市場情境加分（Computex + 外資評等）────────────────
  const marketBonus = getMarketSentimentBonus(sectorKey || '')
  const stockRating = getStockRating(stock.code)

  // 市場情境分數（越高 AI bull 越強）
  const mktBull = marketBonus.totalBonus  // 0-30
  bullScore += Math.round(mktBull * 0.8)  // 市場正面加分

  // 外資評等加分
  if (stockRating) {
    if (stockRating.rating.includes('強力買進')) { bullScore += 35 }
    else if (stockRating.rating.includes('買進')) { bullScore += 20 }
    else if (stockRating.rating.includes('賣出')) { bearScore += 25 }
  }

  // 計算信號與信心度
  const total = bullScore + bearScore || 1
  let signal = '觀望', confidence = 50
  if (bullScore > bearScore * 1.2) {
    signal = '買入'
    confidence = Math.min(95, Math.round(50 + (bullScore / total) * 50))
  } else if (bearScore > bullScore * 1.3) {
    signal = '賣出'
    confidence = Math.min(95, Math.round(50 + (bearScore / total) * 50))
  } else {
    confidence = Math.round(40 + Math.abs(bullScore - bearScore) / total * 20)
  }

  // 進場、停損、目標
  const atr      = candles.slice(-14).reduce((s, c) => s + (c.high - c.low), 0) / 14
  const entry    = last.close
  const stopLoss = signal === '買入' ? +(last.low - atr * 0.5).toFixed(2) : +(last.high + atr * 0.5).toFixed(2)
  const target   = signal === '買入'
    ? +(last.close + (stockRating ? Math.min(atr * 3, (stockRating.target - last.close) * 0.5) : atr * 2)).toFixed(2)
    : +(last.close - atr * 2).toFixed(2)

  const riskLevel = confidence >= 75 ? '低' : confidence >= 60 ? '中' : '高'
  const timeframe = confidence >= 75 ? '短線3-5天' : '中線2-4週'

  // 分析摘要（含市場情境）
  const rsiText   = rsi14 ? `RSI ${rsi14.toFixed(0)}${rsi14 < 30 ? '超賣' : rsi14 > 70 ? '超買' : ''}` : ''
  const maText    = ma5 && ma10 ? (ma5 > ma10 ? '均線多頭排列' : '均線空頭排列') : ''
  const mktText   = `市場情境分${marketBonus.sectorScore}/10（Computex前催化）`
  const ratingText = stockRating ? `外資${stockRating.rating}(目標${stockRating.target}元)` : ''

  const analysis = [
    `【${pattern.name}】`,
    trendInfo.trend + '趨勢，',
    rsiText + '，',
    maText + '。',
    mktText + '。',
    ratingText,
  ].filter(Boolean).join('')

  return {
    pattern: pattern.name,
    trend: trendInfo.trend,
    signal,
    confidence,
    analysis,
    marketSentiment: marketBonus.sectorScore >= 8 ? '正面' : marketBonus.sectorScore >= 6 ? '中性' : '負面',
    computexCatalyst: `Computex相關度：${['thermal','ai','packaging'].includes(sectorKey) ? '高' : '中'}`,
    entry: +entry.toFixed(2),
    stopLoss,
    target,
    timeframe,
    risk: riskLevel,
    analystRating: stockRating?.rating || '無評等',
    indicators: { rsi: rsi14 ? +rsi14.toFixed(1) : null, volRatio: +volRatio.toFixed(2) },
  }
}
