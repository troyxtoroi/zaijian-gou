/**
 * 本地 K 線技術分析引擎 + 市場情境
 * 修正：停損/目標價方向絕對保證正確
 */
import { getMarketSentimentBonus, getStockRating } from '../data/marketContext.js'

/* ── 指標 ──────────────────────────────────────────────── */
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

export function calcBollinger(candles, period = 20) {
  if (!candles || candles.length < period) return null
  const slice = candles.slice(-period)
  const ma = slice.reduce((s, c) => s + c.close, 0) / period
  const std = Math.sqrt(slice.reduce((s, c) => s + (c.close - ma) ** 2, 0) / period)
  return { upper: +(ma + 2 * std).toFixed(2), middle: +ma.toFixed(2), lower: +(ma - 2 * std).toFixed(2) }
}

/* ── K 線型態 ───────────────────────────────────────────── */
function body(c) { return Math.abs(c.close - c.open) }
function rng(c)  { return c.high - c.low }
function upWick(c) { return c.high - Math.max(c.open, c.close) }
function dnWick(c) { return Math.min(c.open, c.close) - c.low }
const isBull = c => c.close > c.open
const isBear = c => c.close < c.open

function detectPattern(candles) {
  const n = candles.length
  if (n < 3) return { name: '資料不足', type: 'neutral', strength: 40 }
  const c0 = candles[n-1], c1 = candles[n-2], c2 = candles[n-3]
  const b0 = body(c0), b1 = body(c1), b2 = body(c2)
  const r0 = rng(c0),  r1 = rng(c1)

  if (b0 < r0 * 0.1 && r0 > 0) {
    if (upWick(c0) > b0 * 2 && dnWick(c0) < b0) return { name: '流星線', type: 'bearish', strength: 70 }
    if (dnWick(c0) > b0 * 2 && upWick(c0) < b0) return { name: '倒錘線', type: 'bullish', strength: 65 }
    return { name: '十字線', type: 'neutral', strength: 50 }
  }
  if (isBull(c0) && dnWick(c0) > b0 * 2 && upWick(c0) < b0 * 0.5) return { name: '錘子線', type: 'bullish', strength: 78 }
  if (isBear(c0) && dnWick(c0) > b0 * 2 && upWick(c0) < b0 * 0.5) return { name: '吊人線', type: 'bearish', strength: 65 }
  if (isBear(c0) && upWick(c0) > b0 * 2 && dnWick(c0) < b0 * 0.3) return { name: '射擊之星', type: 'bearish', strength: 72 }
  if (isBear(c1) && isBull(c0) && c0.open < c1.close && c0.close > c1.open && b0 > b1) return { name: '多方吞噬', type: 'bullish', strength: 82 }
  if (isBull(c1) && isBear(c0) && c0.open > c1.close && c0.close < c1.open && b0 > b1) return { name: '空方吞噬', type: 'bearish', strength: 82 }
  if (isBear(c2) && b1 < b2 * 0.4 && isBull(c0) && b0 > b2 * 0.6 && c0.close > (c2.open + c2.close) / 2) return { name: '晨星', type: 'bullish', strength: 87 }
  if (isBull(c2) && b1 < b2 * 0.4 && isBear(c0) && b0 > b2 * 0.6 && c0.close < (c2.open + c2.close) / 2) return { name: '夜星', type: 'bearish', strength: 87 }
  if (isBull(c0) && isBull(c1) && isBull(c2) && c0.close > c1.close && c1.close > c2.close && b0 > r0 * 0.6 && b1 > r1 * 0.6) return { name: '三白兵', type: 'bullish', strength: 90 }
  if (isBear(c0) && isBear(c1) && isBear(c2) && c0.close < c1.close && c1.close < c2.close && b0 > r0 * 0.6 && b1 > r1 * 0.6) return { name: '三烏鴉', type: 'bearish', strength: 90 }
  if (b0 < r0 * 0.3 && upWick(c0) > b0 && dnWick(c0) > b0) return { name: '紡錘線', type: 'neutral', strength: 45 }
  if (isBull(c0) && b0 > r0 * 0.7) return { name: '長陽線', type: 'bullish', strength: 68 }
  if (isBear(c0) && b0 > r0 * 0.7) return { name: '長陰線', type: 'bearish', strength: 68 }
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

/* ── 主分析函式 ─────────────────────────────────────────── */
export function analyzeLocally({ stock, candles, ma5, ma10, ma20, sectorKey }) {
  if (!candles || candles.length < 5) {
    return { pattern:'資料不足', trend:'—', signal:'觀望', confidence:0, analysis:'K線資料不足', error:true }
  }

  const last = candles[candles.length - 1]
  const rsi14 = calcRSI(candles, 14)
  const boll  = calcBollinger(candles, 20)
  const pat   = detectPattern(candles)
  const trend = detectTrend(candles, ma5, ma10, ma20)

  const vol5avg    = candles.slice(-6, -1).reduce((s, c) => s + c.volume, 0) / 5 || 1
  const volRatio   = last.volume / vol5avg
  const volConfirm = volRatio > 1.3

  let bullScore = 0, bearScore = 0

  if (pat.type === 'bullish') bullScore += pat.strength
  if (pat.type === 'bearish') bearScore += pat.strength
  if (trend.trend === '上漲') bullScore += trend.strength
  if (trend.trend === '下跌') bearScore += trend.strength

  if (rsi14 !== null) {
    if (rsi14 < 30) bullScore += 65
    if (rsi14 > 70) bearScore += 60
    if (rsi14 < 40) bullScore += 20
    if (rsi14 > 60) bearScore += 20
  }

  if (boll) {
    if (last.close < boll.lower) bullScore += 55
    if (last.close > boll.upper) bearScore += 55
    if (last.close > boll.middle && trend.trend === '上漲') bullScore += 20
  }

  if (volConfirm) {
    if (pat.type === 'bullish') bullScore += 25
    if (pat.type === 'bearish') bearScore += 25
  }

  // 市場情境加分
  const mktBonus    = getMarketSentimentBonus(sectorKey || '')
  const stockRating = getStockRating(stock.code)
  bullScore += Math.round(mktBonus.totalBonus * 0.8)

  if (stockRating) {
    if (stockRating.rating.includes('強力買進')) bullScore += 35
    else if (stockRating.rating.includes('買進')) bullScore += 20
    else if (stockRating.rating.includes('賣出')) bearScore += 25
  }

  // ── 信號判斷 ──────────────────────────────────────────
  const total  = bullScore + bearScore || 1
  let signal   = '觀望'
  let confidence = 50
  if (bullScore > bearScore * 1.2) {
    signal     = '買入'
    confidence = Math.min(95, Math.round(50 + (bullScore / total) * 50))
  } else if (bearScore > bullScore * 1.3) {
    signal     = '賣出'
    confidence = Math.min(95, Math.round(50 + (bearScore / total) * 50))
  } else {
    confidence = Math.round(40 + Math.abs(bullScore - bearScore) / total * 20)
  }

  // ── 停損/目標（方向絕對保證正確）─────────────────────
  const atr   = candles.slice(-14).reduce((s, c) => s + (c.high - c.low), 0) / 14 || last.close * 0.03
  const entry = last.close
  const recentLow  = Math.min(...candles.slice(-5).map(c => c.low))
  const recentHigh = Math.max(...candles.slice(-5).map(c => c.high))

  let stopLoss, target

  if (signal === '買入') {
    // 停損：必定低於進場，取近5日低點再往下一個 ATR
    stopLoss = +Math.min(recentLow - atr * 0.5, entry * 0.95).toFixed(2)
    // 目標：若有外資目標價且高於現價，取一半的路程；否則用 ATR
    if (stockRating && stockRating.target > entry) {
      target = +(entry + Math.min((stockRating.target - entry) * 0.6, atr * 3.5)).toFixed(2)
    } else {
      target = +(entry + atr * 2.2).toFixed(2)
    }
    // 保險：目標必須比進場高至少 5%
    if (target <= entry) target = +(entry * 1.08).toFixed(2)
    if (stopLoss >= entry) stopLoss = +(entry * 0.93).toFixed(2)

  } else if (signal === '賣出') {
    // 停損：必定高於進場
    stopLoss = +Math.max(recentHigh + atr * 0.5, entry * 1.05).toFixed(2)
    target   = +(entry - atr * 2.2).toFixed(2)
    if (target >= entry) target   = +(entry * 0.90).toFixed(2)
    if (stopLoss <= entry) stopLoss = +(entry * 1.07).toFixed(2)

  } else {
    // 觀望：給一個保守的參考
    stopLoss = +(entry * 0.95).toFixed(2)
    target   = +(entry * 1.08).toFixed(2)
  }

  const riskLevel = confidence >= 75 ? '低' : confidence >= 60 ? '中' : '高'
  const timeframe = confidence >= 75 ? '短線3-5天' : '中線2-4週'

  const rsiText   = rsi14 ? `RSI ${rsi14.toFixed(0)}${rsi14 < 30 ? '超賣' : rsi14 > 70 ? '超買' : ''}` : ''
  const maText    = ma5 && ma10 ? (ma5 > ma10 ? '均線多頭排列' : '均線空頭排列') : ''
  const mktText   = `市場情境${mktBonus.sectorScore}/10`
  const ratingText = stockRating ? `・外資${stockRating.rating}(目標${stockRating.target})` : ''
  const analysis  = `【${pat.name}】${trend.trend}趨勢，${rsiText}，${maText}，${mktText}${ratingText}。`

  return {
    pattern: pat.name,
    trend: trend.trend,
    signal,
    confidence,
    analysis,
    marketSentiment: mktBonus.sectorScore >= 8 ? '正面' : mktBonus.sectorScore >= 6 ? '中性' : '負面',
    computexCatalyst: `Computex相關度：${['thermal','ai','packaging'].includes(sectorKey) ? '高' : '中'}`,
    entry:    +entry.toFixed(2),
    stopLoss,
    target,
    timeframe,
    risk:         riskLevel,
    analystRating: stockRating?.rating || '無評等',
    indicators:   { rsi: rsi14 ? +rsi14.toFixed(1) : null, volRatio: +volRatio.toFixed(2) },
  }
}
