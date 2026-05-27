/**
 * 本地K線技術分析 — 全面修正版
 * 信號：相對低點 + 1根漲停潛力 + 多方K線型態
 */
import { getMarketSentimentBonus, getStockRating } from '../data/marketContext.js'

/* ── 指標 ──────────────────────────────────────────────── */
export function calcMA(candles, period) {
  if (!candles || candles.length < period) return null
  return candles.slice(-period).reduce((s,c) => s+c.close, 0) / period
}
export function calcRSI(candles, period=14) {
  const sl = candles.slice(-(period+1))
  if (sl.length < period+1) return null
  let g=0, l=0
  for (let i=1; i<sl.length; i++) {
    const d = sl[i].close - sl[i-1].close
    d>0 ? (g+=d) : (l-=d)
  }
  const ag=g/period, al=l/period
  return al===0 ? 100 : 100 - 100/(1+ag/al)
}
export function calcBollinger(candles, period=20) {
  if (!candles || candles.length < period) return null
  const sl = candles.slice(-period)
  const ma = sl.reduce((s,c)=>s+c.close,0)/period
  const std = Math.sqrt(sl.reduce((s,c)=>s+(c.close-ma)**2,0)/period)
  return { upper:+(ma+2*std).toFixed(2), middle:+ma.toFixed(2), lower:+(ma-2*std).toFixed(2) }
}
function calcKD(candles, period=9) {
  const result = []
  for (let i=0; i<candles.length; i++) {
    if (i<period-1) { result.push({k:50,d:50}); continue }
    const sl  = candles.slice(i-period+1, i+1)
    const lo  = Math.min(...sl.map(c=>c.low))
    const hi  = Math.max(...sl.map(c=>c.high))
    const rsv = hi===lo ? 50 : (candles[i].close-lo)/(hi-lo)*100
    const pk  = result[i-1]?.k ?? 50
    const pd  = result[i-1]?.d ?? 50
    const k   = (2/3)*pk + (1/3)*rsv
    const d   = (2/3)*pd + (1/3)*k
    result.push({k:+k.toFixed(1), d:+d.toFixed(1)})
  }
  return result
}

/* ── K線型態 ─────────────────────────────────────────────  */
function detectPattern(candles) {
  const n=candles.length; if(n<3) return {name:'資料不足',type:'neutral',strength:40}
  const c0=candles[n-1], c1=candles[n-2], c2=candles[n-3]
  const b0=Math.abs(c0.close-c0.open), b1=Math.abs(c1.close-c1.open), b2=Math.abs(c2.close-c2.open)
  const r0=c0.high-c0.low
  const uw=c=>c.high-Math.max(c.open,c.close), dw=c=>Math.min(c.open,c.close)-c.low
  const bull=c=>c.close>c.open, bear=c=>c.close<c.open

  if(b0<r0*0.1&&r0>0){
    if(uw(c0)>b0*2&&dw(c0)<b0) return{name:'流星線',type:'bearish',strength:70}
    if(dw(c0)>b0*2&&uw(c0)<b0) return{name:'倒錘線',type:'bullish',strength:68}
    return{name:'十字線',type:'neutral',strength:50}
  }
  if(bull(c0)&&dw(c0)>b0*2&&uw(c0)<b0*0.5) return{name:'錘子線',  type:'bullish',strength:82}
  if(bear(c0)&&dw(c0)>b0*2&&uw(c0)<b0*0.5) return{name:'吊人線',  type:'bearish',strength:65}
  if(bear(c0)&&uw(c0)>b0*2&&dw(c0)<b0*0.3) return{name:'射擊之星',type:'bearish',strength:72}
  if(bear(c1)&&bull(c0)&&c0.open<c1.close&&c0.close>c1.open&&b0>b1) return{name:'多方吞噬',type:'bullish',strength:85}
  if(bull(c1)&&bear(c0)&&c0.open>c1.close&&c0.close<c1.open&&b0>b1) return{name:'空方吞噬',type:'bearish',strength:85}
  if(bear(c2)&&b1<b2*0.4&&bull(c0)&&b0>b2*0.6&&c0.close>(c2.open+c2.close)/2) return{name:'晨星',type:'bullish',strength:90}
  if(bull(c2)&&b1<b2*0.4&&bear(c0)&&b0>b2*0.6&&c0.close<(c2.open+c2.close)/2) return{name:'夜星',type:'bearish',strength:90}
  if(bull(c0)&&bull(c1)&&bull(c2)&&c0.close>c1.close&&c1.close>c2.close&&b0>r0*0.6) return{name:'三白兵',type:'bullish',strength:92}
  if(bear(c0)&&bear(c1)&&bear(c2)&&c0.close<c1.close&&c1.close<c2.close&&b0>r0*0.6) return{name:'三烏鴉',type:'bearish',strength:92}
  if(bull(c0)&&b0>r0*0.7) return{name:'長陽線',type:'bullish',strength:70}
  if(bear(c0)&&b0>r0*0.7) return{name:'長陰線',type:'bearish',strength:70}
  return{name:'一般K棒',type:'neutral',strength:40}
}

/* ── 相對低點 ────────────────────────────────────────────── */
function isRelativeLow(candles, rsi14, kd) {
  const last = candles[candles.length-1].close
  const lo20 = Math.min(...candles.slice(-20).map(c=>c.low))
  const hi20 = Math.max(...candles.slice(-20).map(c=>c.high))
  const pct  = (last-lo20) / (Math.max(hi20-lo20, 1))
  const conds = {
    nearLow:  pct < 0.30,
    rsiLow:   rsi14!==null && rsi14 < 45,
    kdLow:    kd?.k !== undefined && kd.k < 35,
    veryLow:  pct < 0.10,  // 額外加分
  }
  const count = [conds.nearLow, conds.rsiLow, conds.kdLow].filter(Boolean).length
  return { isLow: count >= 2, pct, count, conds }
}

/* ── 漲停潛力 ────────────────────────────────────────────── */
function assessLimitUpPotential(candles, ma5, ma10, ma20, rsi14, kd, boll, volRatio, sectorScore, stockRating) {
  const n   = candles.length
  const last= candles[n-1]
  const atr = candles.slice(-14).reduce((s,c)=>s+(c.high-c.low),0)/14
  const atrPct = atr / last.close

  // KD 金叉（修正版）
  const kdAll  = calcKD(candles)
  const curKD  = kdAll[kdAll.length-1]
  const prevKD = kdAll[kdAll.length-2]
  const kdGoldenCross = prevKD && curKD &&
    prevKD.k <= prevKD.d &&  // 前一天 K < D
    curKD.k  >  curKD.d  &&  // 今天 K > D（金叉）
    curKD.k  < 50             // 在中低位置

  // MACD（簡化計算）
  const closes = candles.map(c=>c.close)
  function ema(arr, p) {
    const k=2/(p+1); let e=arr.slice(0,p).reduce((a,b)=>a+b,0)/p
    return arr.map((v,i)=>{ if(i<p-1)return null; if(i===p-1)return e; e=v*k+e*(1-k); return e })
  }
  const macdArr = closes.length>=26 ?
    closes.map((_,i)=>{ const e12=ema(closes,12)[i]; const e26=ema(closes,26)[i]; return e12&&e26?e12-e26:null }) : []
  const curHist  = macdArr[macdArr.length-1]   || 0
  const prevHist = macdArr[macdArr.length-2]   || 0
  const macdTurnBull = prevHist <= 0 && curHist > 0

  const signals = {
    highVolatility:  atrPct > 0.03,         // ✅ 降低門檻：3%（原5%）
    macdTurnBull:    macdTurnBull,
    kdGoldenCross:   kdGoldenCross,
    strongSector:    sectorScore >= 8,
    volumeBreakout:  volRatio > 1.8,
    highUpside:      stockRating?.target ? (stockRating.target - last.close)/last.close > 0.12 : false,
    deepRebound:     (() => { const hi20=Math.max(...candles.slice(-20).map(c=>c.high)); return (hi20-last.close)/hi20 > 0.15 })(),
    breakout:        last.close > Math.max(...candles.slice(-10,-1).map(c=>c.high)),
  }
  const points     = Object.values(signals).filter(Boolean).length
  const can1LimitUp = signals.highVolatility && points >= 2
  return { signals, points, can1LimitUp, atrPct }
}

/* ── 主分析 ──────────────────────────────────────────────── */
export function analyzeLocally({ stock, candles, ma5, ma10, ma20, sectorKey }) {
  if (!candles || candles.length < 5)
    return { pattern:'資料不足', trend:'—', signal:'觀望', confidence:0, analysis:'K線資料不足', error:true }

  const last  = candles[candles.length-1]
  const rsi14 = calcRSI(candles, 14)
  const boll  = calcBollinger(candles, 20)
  const pat   = detectPattern(candles)
  const kdAll = calcKD(candles)
  const curKD = kdAll[kdAll.length-1]

  const vol5avg   = candles.slice(-6,-1).reduce((s,c)=>s+c.volume,0)/5 || 1
  const volRatio  = last.volume / vol5avg
  const trendUp   = ma5&&ma10&&ma20 && last.close>ma5 && ma5>ma10
  const trendDown = ma5&&ma10&&ma20 && last.close<ma5 && ma5<ma10
  const trend     = trendUp?'上漲':trendDown?'下跌':'盤整'

  const mktBonus    = getMarketSentimentBonus(sectorKey||'')
  const stockRating = getStockRating(stock.code)
  const lowInfo     = isRelativeLow(candles, rsi14, curKD)
  const limitUpInfo = assessLimitUpPotential(candles, ma5, ma10, ma20, rsi14, curKD, boll, volRatio, mktBonus.sectorScore, stockRating)

  // ── 信號 ──────────────────────────────────────────────────
  let signal='觀望', confidence=45, limitUpSignal=false

  if (lowInfo.isLow && limitUpInfo.can1LimitUp && pat.type==='bullish') {
    // ✅ 主力信號：相對低點 + 漲停潛力 + 多方型態
    signal = '買入'; limitUpSignal = true
    let sc = 55
    if (lowInfo.pct < 0.20)                   sc += 12
    if (lowInfo.pct < 0.10)                   sc += 8
    if (pat.strength >= 85)                   sc += 10
    if (limitUpInfo.signals.macdTurnBull)     sc += 8
    if (limitUpInfo.signals.kdGoldenCross)    sc += 10
    if (limitUpInfo.signals.volumeBreakout)   sc += 8
    if (limitUpInfo.signals.breakout)         sc += 10
    if (limitUpInfo.signals.deepRebound)      sc += 8
    if (mktBonus.sectorScore >= 8)            sc += 8
    if (stockRating?.rating?.includes('買進')) sc += 5
    confidence = Math.min(93, sc)

  } else if (pat.type==='bearish' && (trendDown || (rsi14&&rsi14>72) || curKD?.k>80)) {
    // 賣出信號
    signal = '賣出'
    let sc = 52
    if (pat.strength>=80) sc+=10
    if (rsi14&&rsi14>70)  sc+=10
    if (curKD?.k>80)      sc+=8
    if (trendDown)        sc+=12
    confidence = Math.min(88, sc)
  }

  // ── 停損/目標（絕對方向保證）──────────────────────────────
  const atr       = candles.slice(-14).reduce((s,c)=>s+(c.high-c.low),0)/14 || last.close*0.03
  const entry     = last.close
  const recentLow = Math.min(...candles.slice(-5).map(c=>c.low))
  const recentHi  = Math.max(...candles.slice(-5).map(c=>c.high))
  let stopLoss, target

  if (signal==='買入') {
    stopLoss = +Math.min(recentLow-atr*0.5, entry*0.95).toFixed(2)
    target   = stockRating?.target > entry
      ? +(entry + Math.min((stockRating.target-entry)*0.6, atr*4)).toFixed(2)
      : +(entry*1.12).toFixed(2)
    if (target   <= entry)    target   = +(entry*1.12).toFixed(2)
    if (stopLoss >= entry)    stopLoss = +(entry*0.93).toFixed(2)
  } else if (signal==='賣出') {
    stopLoss = +Math.max(recentHi+atr*0.5, entry*1.05).toFixed(2)
    target   = +(entry*0.90).toFixed(2)
    if (target   >= entry)    target   = +(entry*0.90).toFixed(2)
    if (stopLoss <= entry)    stopLoss = +(entry*1.07).toFixed(2)
  } else {
    stopLoss = +(entry*0.95).toFixed(2)
    target   = +(entry*1.08).toFixed(2)
  }

  // ── 分析說明 ──────────────────────────────────────────────
  const riskLevel = confidence>=75?'低':confidence>=60?'中':'高'
  let analysis = ''
  if (limitUpSignal) {
    const metList = Object.entries(limitUpInfo.signals).filter(([,v])=>v)
      .map(([k])=>({highVolatility:'高波動',macdTurnBull:'MACD翻多',kdGoldenCross:'KD金叉',
        strongSector:'強族群',volumeBreakout:'放量突破',highUpside:'目標高',deepRebound:'跌深反彈',breakout:'突破壓力'}[k]))
      .filter(Boolean)
    analysis = `✨ 低點買入！【${pat.name}】位置${(lowInfo.pct*100).toFixed(0)}%，漲停條件${limitUpInfo.points}/8（${metList.slice(0,4).join('、')}）`
  } else if (signal==='賣出') {
    analysis = `⚠️ 【${pat.name}】${trend}，RSI ${rsi14?.toFixed(0)}，建議觀望`
  } else {
    const why = !lowInfo.isLow
      ? `位置偏高（近20日${(lowInfo.pct*100).toFixed(0)}%）`
      : !limitUpInfo.can1LimitUp
      ? `漲停條件不足（${limitUpInfo.points}/8，波動率${(limitUpInfo.atrPct*100).toFixed(1)}%<3%需調整）`
      : `等待多方K線確認（目前：${pat.name}）`
    analysis = `觀望 — ${why}`
  }

  return {
    pattern: pat.name, trend, signal, confidence,
    analysis, limitUpSignal,
    limitUpInfo: { potential: limitUpInfo.points>=4?'高':limitUpInfo.points>=2?'中':'低',
      points: limitUpInfo.points, can1LimitUp: limitUpInfo.can1LimitUp,
      signals: limitUpInfo.signals, atrPct: +limitUpInfo.atrPct.toFixed(4) },
    lowInfo: { isLow: lowInfo.isLow, pct: +lowInfo.pct.toFixed(3), count: lowInfo.count },
    marketSentiment: mktBonus.sectorScore>=8?'正面':mktBonus.sectorScore>=6?'中性':'負面',
    computexCatalyst: `Computex相關度：${['thermal','ai','packaging'].includes(sectorKey)?'高':'中'}`,
    entry: +entry.toFixed(2), stopLoss, target,
    timeframe: '短線3-5天', risk: riskLevel,
    analystRating: stockRating?.rating||'無評等',
    indicators: { rsi: rsi14?+rsi14.toFixed(1):null, volRatio:+volRatio.toFixed(2),
                  kdK: curKD?.k, kdD: curKD?.d },
  }
}
