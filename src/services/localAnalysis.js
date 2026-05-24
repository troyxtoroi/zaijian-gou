/**
 * 本地K線技術分析引擎
 * 信號邏輯：相對低點 + 具備至少2根漲停潛力 → 才發買入信號
 */
import { getMarketSentimentBonus, getStockRating } from '../data/marketContext.js'

/* ── 指標計算 ───────────────────────────────────────────── */
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
  const sl = candles.slice(-period)
  const ma = sl.reduce((s, c) => s + c.close, 0) / period
  const std = Math.sqrt(sl.reduce((s, c) => s + (c.close - ma) ** 2, 0) / period)
  return { upper: +(ma + 2*std).toFixed(2), middle: +ma.toFixed(2), lower: +(ma - 2*std).toFixed(2) }
}

function calcKD(candles, period = 9) {
  const result = []
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { result.push({ k: 50, d: 50 }); continue }
    const sl = candles.slice(i - period + 1, i + 1)
    const lo = Math.min(...sl.map(c => c.low))
    const hi = Math.max(...sl.map(c => c.high))
    const rsv = hi === lo ? 50 : (candles[i].close - lo) / (hi - lo) * 100
    const pk = result[i-1]?.k ?? 50, pd = result[i-1]?.d ?? 50
    const k = (2/3)*pk + (1/3)*rsv, d = (2/3)*pd + (1/3)*k
    result.push({ k: +k.toFixed(1), d: +d.toFixed(1) })
  }
  return result
}

function calcMACDLine(candles) {
  if (candles.length < 26) return null
  const closes = candles.map(c => c.close)
  const ema = (arr, p) => {
    const k = 2/(p+1); let e = arr.slice(0,p).reduce((a,b)=>a+b,0)/p
    return arr.map((v,i) => { if(i<p-1) return null; if(i===p-1) return e; e=v*k+e*(1-k); return +e.toFixed(4) })
  }
  const e12 = ema(closes, 12), e26 = ema(closes, 26)
  const macdArr = closes.map((_,i) => e12[i]&&e26[i] ? +(e12[i]-e26[i]).toFixed(4) : null)
  const sig = ema(macdArr.map(v=>v??0), 9)
  return macdArr.map((m,i) => ({ macd: m, signal: sig[i], hist: m&&sig[i] ? +(m-sig[i]).toFixed(4) : null }))
}

/* ── K線型態 ────────────────────────────────────────────── */
function detectPattern(candles) {
  const n = candles.length
  if (n < 3) return { name: '資料不足', type: 'neutral', strength: 40 }
  const c0=candles[n-1], c1=candles[n-2], c2=candles[n-3]
  const b0=Math.abs(c0.close-c0.open), b1=Math.abs(c1.close-c1.open), b2=Math.abs(c2.close-c2.open)
  const r0=c0.high-c0.low
  const uw0=c0.high-Math.max(c0.open,c0.close), dw0=Math.min(c0.open,c0.close)-c0.low
  const bull=c=>c.close>c.open, bear=c=>c.close<c.open

  if (b0 < r0*0.1 && r0>0) {
    if (uw0>b0*2&&dw0<b0) return {name:'流星線',type:'bearish',strength:70}
    if (dw0>b0*2&&uw0<b0) return {name:'倒錘線',type:'bullish',strength:68}
    return {name:'十字線',type:'neutral',strength:50}
  }
  if (bull(c0)&&dw0>b0*2&&uw0<b0*0.5)    return {name:'錘子線',type:'bullish',strength:82}
  if (bear(c0)&&dw0>b0*2&&uw0<b0*0.5)    return {name:'吊人線',type:'bearish',strength:65}
  if (bear(c0)&&uw0>b0*2&&dw0<b0*0.3)    return {name:'射擊之星',type:'bearish',strength:72}
  if (bear(c1)&&bull(c0)&&c0.open<c1.close&&c0.close>c1.open&&b0>b1) return {name:'多方吞噬',type:'bullish',strength:85}
  if (bull(c1)&&bear(c0)&&c0.open>c1.close&&c0.close<c1.open&&b0>b1) return {name:'空方吞噬',type:'bearish',strength:85}
  if (bear(c2)&&b1<b2*0.4&&bull(c0)&&b0>b2*0.6&&c0.close>(c2.open+c2.close)/2) return {name:'晨星',type:'bullish',strength:90}
  if (bull(c2)&&b1<b2*0.4&&bear(c0)&&b0>b2*0.6&&c0.close<(c2.open+c2.close)/2) return {name:'夜星',type:'bearish',strength:90}
  if (bull(c0)&&bull(c1)&&bull(c2)&&c0.close>c1.close&&c1.close>c2.close&&b0>r0*0.6) return {name:'三白兵',type:'bullish',strength:92}
  if (bear(c0)&&bear(c1)&&bear(c2)&&c0.close<c1.close&&c1.close<c2.close&&b0>r0*0.6) return {name:'三烏鴉',type:'bearish',strength:92}
  if (bull(c0)&&b0>r0*0.7) return {name:'長陽線',type:'bullish',strength:70}
  if (bear(c0)&&b0>r0*0.7) return {name:'長陰線',type:'bearish',strength:70}
  return {name:'一般K棒',type:'neutral',strength:40}
}

/* ── 相對低點判斷 ────────────────────────────────────────── */
function isRelativeLow(candles, rsi14, kd) {
  const n    = candles.length
  const last = candles[n - 1].close
  const lo20 = Math.min(...candles.slice(-20).map(c => c.low))
  const hi20 = Math.max(...candles.slice(-20).map(c => c.high))
  const pct  = (last - lo20) / (hi20 - lo20 || 1)  // 0=最低 1=最高

  const score = {
    nearLow:   pct < 0.30,    // 位於近20日區間底部30%
    rsiLow:    rsi14 !== null && rsi14 < 45,
    kdLow:     kd?.k < 35,
    belowMA20: false,         // 計算後填入
  }
  // 滿足2個以上條件才算相對低點
  const count = Object.values(score).filter(Boolean).length
  return { isLow: count >= 2, pct, score, count }
}

/* ── 漲停潛力評估（至少2根漲停的潛力）──────────────────── */
function assessLimitUpPotential(candles, ma5, ma10, ma20, rsi14, kd, boll,
                                 volRatio, sectorScore, stockRating) {
  const n    = candles.length
  const last = candles[n - 1]
  const atr  = candles.slice(-14).reduce((s, c) => s + (c.high - c.low), 0) / 14
  const atrPct = atr / last.close  // ATR 佔股價比例（高=波動大=漲停機率高）

  const macdData = calcMACDLine(candles)
  const curMACD  = macdData?.[macdData.length - 1]
  const prevMACD = macdData?.[macdData.length - 2]

  const signals = {
    // 1. 高波動性（ATR > 5% = 有漲停能力）
    highVolatility: atrPct > 0.05,

    // 2. MACD 翻多（由負轉正）
    macdTurnBull: curMACD?.hist !== null && prevMACD?.hist !== null &&
                  (prevMACD?.hist || 0) <= 0 && (curMACD?.hist || 0) > 0,

    // 3. KD 低檔黃金交叉（K由下往上穿D，且在低位）
    kdGoldenCross: kd?.k < 50 &&
                   (candles[n-2] ? calcKD(candles.slice(0,-1))[calcKD(candles.slice(0,-1)).length-1]?.k : 999) > (kd?.k || 999) === false &&
                   kd?.k > (kd?.d || 0),

    // 4. 強族群催化劑
    strongSector: sectorScore >= 8,

    // 5. 放量突破
    volumeBreakout: volRatio > 1.8,

    // 6. 外資目標價遠高於現價（>15% 空間）
    highUpside: stockRating?.target ? (stockRating.target - last.close) / last.close > 0.15 : false,

    // 7. 跌深反彈（近20日跌幅>20%）
    deepRebound: (() => {
      const hi20 = Math.max(...candles.slice(-20).map(c => c.high))
      return (hi20 - last.close) / hi20 > 0.20
    })(),

    // 8. 突破壓力位（突破近期高點）
    breakout: last.close > Math.max(...candles.slice(-10, -1).map(c => c.high)),
  }

  const points = Object.values(signals).filter(Boolean).length
  const potential = points >= 4 ? '高' : points >= 2 ? '中' : '低'

  // 至少2根漲停潛力：需要高波動 + 至少3個其他正面信號
  const can2LimitUp = signals.highVolatility && points >= 3

  return { signals, points, potential, can2LimitUp, atrPct }
}

/* ── 主分析函式 ─────────────────────────────────────────── */
export function analyzeLocally({ stock, candles, ma5, ma10, ma20, sectorKey }) {
  if (!candles || candles.length < 5) {
    return { pattern:'資料不足', trend:'—', signal:'觀望', confidence:0, analysis:'K線資料不足', error:true }
  }

  const last    = candles[candles.length - 1]
  const rsi14   = calcRSI(candles, 14)
  const boll    = calcBollinger(candles, 20)
  const pat     = detectPattern(candles)
  const kdData  = calcKD(candles)
  const curKD   = kdData[kdData.length - 1]

  const vol5avg   = candles.slice(-6,-1).reduce((s,c)=>s+c.volume,0)/5 || 1
  const volRatio  = last.volume / vol5avg

  // 趨勢判斷
  const trendUp = ma5 && ma10 && ma20 && last.close > ma5 && ma5 > ma10
  const trendDown = ma5 && ma10 && ma20 && last.close < ma5 && ma5 < ma10
  const trend = trendUp ? '上漲' : trendDown ? '下跌' : '盤整'

  // 市場情境
  const mktBonus    = getMarketSentimentBonus(sectorKey || '')
  const stockRating = getStockRating(stock.code)

  // ── 相對低點判斷 ──────────────────────────────────────
  const lowInfo = isRelativeLow(candles, rsi14, curKD)

  // ── 漲停潛力評估 ──────────────────────────────────────
  const limitUpInfo = assessLimitUpPotential(
    candles, ma5, ma10, ma20, rsi14, curKD, boll,
    volRatio, mktBonus.sectorScore, stockRating
  )

  // ── 信號決策（嚴格版）──────────────────────────────────
  // 買入條件：相對低點 AND 漲停潛力 AND K線多方型態
  const isBullishPattern = pat.type === 'bullish'
  const isOversoldRSI    = rsi14 !== null && rsi14 < 45
  const isOversoldKD     = curKD?.k < 35

  let signal = '觀望'
  let confidence = 45
  let limitUpSignal = false

  if (lowInfo.isLow && limitUpInfo.can2LimitUp && pat.type === 'bullish') {
    signal = '買入'
    // 信心度計算：多個指標加分
    let score = 50
    if (lowInfo.pct < 0.20)          score += 15  // 非常接近低點
    if (pat.strength >= 85)           score += 10  // 強烈多方型態
    if (limitUpInfo.signals.macdTurnBull) score += 8
    if (limitUpInfo.signals.kdGoldenCross) score += 8
    if (limitUpInfo.signals.volumeBreakout) score += 8
    if (limitUpInfo.signals.breakout)  score += 10
    if (limitUpInfo.signals.deepRebound) score += 8
    if (mktBonus.sectorScore >= 8)    score += 8
    if (stockRating?.rating?.includes('買進')) score += 5
    confidence = Math.min(92, score)
    limitUpSignal = true

  } else if (!lowInfo.isLow && pat.type === 'bullish' && isBullishPattern) {
    // 非低點但有買入型態 → 觀望（不發信號，避免追高）
    signal = '觀望'
    confidence = 38

  } else if (pat.type === 'bearish') {
    signal = '賣出'
    let score = 50
    if (pat.strength >= 80) score += 10
    if (rsi14 && rsi14 > 70) score += 10
    if (curKD?.k > 80) score += 8
    if (trendDown) score += 12
    confidence = Math.min(88, score)
  }

  // ── 停損/目標（方向保證正確）────────────────────────────
  const atr = candles.slice(-14).reduce((s, c) => s + (c.high - c.low), 0) / 14 || last.close * 0.03
  const recentLow  = Math.min(...candles.slice(-5).map(c => c.low))
  const recentHigh = Math.max(...candles.slice(-5).map(c => c.high))
  const entry = last.close

  let stopLoss, target

  if (signal === '買入') {
    stopLoss = +Math.min(recentLow - atr * 0.5, entry * 0.95).toFixed(2)
    if (stockRating?.target > entry) {
      target = +(entry + Math.min((stockRating.target - entry) * 0.6, atr * 4)).toFixed(2)
    } else {
      // 預期至少2根漲停 = +10% * 2 = 20%
      target = +(entry * 1.20).toFixed(2)
    }
    if (target <= entry) target = +(entry * 1.20).toFixed(2)
    if (stopLoss >= entry) stopLoss = +(entry * 0.93).toFixed(2)

  } else if (signal === '賣出') {
    stopLoss = +Math.max(recentHigh + atr * 0.5, entry * 1.05).toFixed(2)
    target   = +(entry * 0.90).toFixed(2)
    if (target >= entry) target = +(entry * 0.90).toFixed(2)
    if (stopLoss <= entry) stopLoss = +(entry * 1.07).toFixed(2)

  } else {
    stopLoss = +(entry * 0.95).toFixed(2)
    target   = +(entry * 1.10).toFixed(2)
  }

  // ── 分析說明 ──────────────────────────────────────────
  const riskLevel = confidence >= 75 ? '低' : confidence >= 60 ? '中' : '高'
  const timeframe = '短線3-5天'

  let analysis = ''
  if (limitUpSignal) {
    const metSignals = Object.entries(limitUpInfo.signals).filter(([,v])=>v).map(([k]) => {
      const map = { highVolatility:'高波動', macdTurnBull:'MACD翻多', kdGoldenCross:'KD黃金交叉',
                    strongSector:'強族群', volumeBreakout:'放量突破', highUpside:'外資目標高',
                    deepRebound:'跌深反彈', breakout:'突破壓力' }
      return map[k]||k
    }).filter(Boolean)
    analysis = `✨ 低點買入信號！【${pat.name}】位於近20日低位${(lowInfo.pct*100).toFixed(0)}%，具${limitUpInfo.points}項漲停條件（${metSignals.slice(0,4).join('、')}），預期短線有機會出現2根漲停。`
  } else if (signal === '賣出') {
    analysis = `⚠️ 【${pat.name}】${trend}趨勢，RSI ${rsi14?.toFixed(0)}，建議停利或觀望。`
  } else {
    const reason = !lowInfo.isLow ? `尚未到達相對低點（位於近20日${(lowInfo.pct*100).toFixed(0)}%位置）` :
                   !limitUpInfo.can2LimitUp ? `漲停潛力不足（${limitUpInfo.points}/8項條件，需至少3項+高波動）` :
                   '等待更明確的多方型態確認'
    analysis = `觀望中 — ${reason}。${pat.name !== '一般K棒' ? '出現' + pat.name + '，' : ''}繼續觀察。`
  }

  return {
    pattern: pat.name,
    trend,
    signal,
    confidence,
    analysis,
    limitUpSignal,
    limitUpInfo: {
      potential: limitUpInfo.potential,
      points: limitUpInfo.points,
      can2LimitUp: limitUpInfo.can2LimitUp,
      signals: limitUpInfo.signals,
      atrPct: +limitUpInfo.atrPct.toFixed(4),
    },
    lowInfo: {
      isLow: lowInfo.isLow,
      pct: +lowInfo.pct.toFixed(3),
      count: lowInfo.count,
    },
    marketSentiment: mktBonus.sectorScore >= 8 ? '正面' : mktBonus.sectorScore >= 6 ? '中性' : '負面',
    computexCatalyst: `Computex相關度：${['thermal','ai','packaging'].includes(sectorKey) ? '高' : '中'}`,
    entry:    +entry.toFixed(2),
    stopLoss,
    target,
    timeframe,
    risk: riskLevel,
    analystRating: stockRating?.rating || '無評等',
    indicators: { rsi: rsi14 ? +rsi14.toFixed(1) : null, volRatio: +volRatio.toFixed(2),
                  kdK: curKD?.k, kdD: curKD?.d },
  }
}
