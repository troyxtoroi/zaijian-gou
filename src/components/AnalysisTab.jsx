import { useState } from 'react'
import { CANDLES_CACHE, calcMA, calcRSI } from '../services/stockApi.js'
import CandleChart from './CandleChart.jsx'
import MarketNewsPanel from './MarketNewsPanel.jsx'
import RiskCalculator  from './RiskCalculator.jsx'
import { AlertPanel }  from './PriceAlert.jsx'
import InstitutionalPanel from './InstitutionalPanel.jsx'
import { C, priceColor, sigColor, sigBg, sigBorder, sentColor } from '../utils/colors.js'

// 計算 KD
function calcKD(candles, period = 9) {
  const result = []
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { result.push({ k: 50, d: 50 }); continue }
    const slice = candles.slice(i - period + 1, i + 1)
    const low9  = Math.min(...slice.map(c => c.low))
    const high9 = Math.max(...slice.map(c => c.high))
    const rsv   = high9 === low9 ? 50 : (candles[i].close - low9) / (high9 - low9) * 100
    const prevK = result[i - 1]?.k ?? 50
    const prevD = result[i - 1]?.d ?? 50
    const k = (2 / 3) * prevK + (1 / 3) * rsv
    const d = (2 / 3) * prevD + (1 / 3) * k
    result.push({ k: +k.toFixed(1), d: +d.toFixed(1), j: +(3*k - 2*d).toFixed(1) })
  }
  return result
}

// 計算 MACD
function calcEMA(prices, period) {
  const k = 2 / (period + 1)
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
  return prices.map((p, i) => {
    if (i < period - 1) return null
    if (i === period - 1) return ema
    ema = p * k + ema * (1 - k)
    return +ema.toFixed(4)
  })
}
function calcMACD(candles) {
  const closes = candles.map(c => c.close)
  const e12 = calcEMA(closes, 12), e26 = calcEMA(closes, 26)
  const macdArr = closes.map((_, i) => e12[i] && e26[i] ? +(e12[i] - e26[i]).toFixed(4) : null)
  const signal  = calcEMA(macdArr.map(v => v ?? 0), 9)
  return macdArr.map((m, i) => ({ macd: m, signal: signal[i], hist: m && signal[i] ? +(m - signal[i]).toFixed(4) : null }))
}

// 支撐/壓力偵測
function detectSR(candles, count = 2) {
  if (!candles || candles.length < 10) return { supports: [], resistances: [] }
  const supports = [], resistances = []
  for (let i = 2; i < candles.length - 2; i++) {
    const c = candles[i]
    if (c.low  < candles[i-1].low  && c.low  < candles[i-2].low  && c.low  < candles[i+1].low  && c.low  < candles[i+2].low)  supports.push(+c.low.toFixed(2))
    if (c.high > candles[i-1].high && c.high > candles[i-2].high && c.high > candles[i+1].high && c.high > candles[i+2].high) resistances.push(+c.high.toFixed(2))
  }
  const cluster = arr => {
    if (!arr.length) return []
    arr.sort((a, b) => a - b)
    const clusters = []; let g = [arr[0]]
    for (let i = 1; i < arr.length; i++) {
      if ((arr[i] - g[0]) / g[0] < 0.05) g.push(arr[i])
      else { clusters.push(g.reduce((s, v) => s + v, 0) / g.length); g = [arr[i]] }
    }
    clusters.push(g.reduce((s, v) => s + v, 0) / g.length)
    return clusters.slice(-count).map(v => +v.toFixed(2))
  }
  return { supports: cluster(supports), resistances: cluster(resistances) }
}

// MACD 子圖
function MACDChart({ candles }) {
  if (!candles || candles.length < 26) return null
  const w = 560, h = 75, pad = { t: 4, r: 6, b: 14, l: 46 }
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b
  const data = calcMACD(candles)
  const hists = data.map(d => d.hist).filter(Boolean)
  if (!hists.length) return null
  const absMax = Math.max(...hists.map(Math.abs)) * 1.1 || 1
  const toY = v => pad.t + ch / 2 - (v / absMax) * (ch / 2)
  const sp = cw / candles.length, bw = Math.max(1, sp * 0.6), cx = i => pad.l + i * sp + sp / 2
  const zY = toY(0)
  const linePoints = (key, color) => {
    const pts = data.map((d, i) => d[key] ? `${cx(i).toFixed(1)},${toY(d[key]).toFixed(1)}` : null).filter(Boolean)
    return pts.length > 1 ? <polyline key={key} points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.2} /> : null
  }
  const cur = data[data.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
      <text x={pad.l - 3} y={pad.t + 6} fontSize={8} fill="#475569" textAnchor="end">MACD</text>
      <line x1={pad.l} y1={zY} x2={pad.l + cw} y2={zY} stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
      {data.map((d, i) => { if (!d.hist) return null; const by = d.hist >= 0 ? toY(d.hist) : zY; const bh = Math.abs(toY(d.hist) - zY); return <rect key={i} x={cx(i)-bw/2} y={by} width={bw} height={Math.max(1,bh)} fill={d.hist >= 0 ? '#ef4444' : '#22c55e'} fillOpacity={0.7} /> })}
      {linePoints('macd', '#fbbf24')}{linePoints('signal', '#818cf8')}
      <text x={pad.l + 2} y={pad.t + 10} fontSize={8} fill="#fbbf24">MACD {cur?.macd?.toFixed(2)}</text>
      <text x={pad.l + 70} y={pad.t + 10} fontSize={8} fill="#818cf8">Signal</text>
      {[0, Math.floor(candles.length/2), candles.length-1].map(i => <text key={i} x={cx(i)} y={h-2} textAnchor="middle" fontSize={8} fill="rgba(148,163,184,0.5)">{`${candles[i]?.date ? new Date(candles[i].date).getMonth()+1 : ''}/${candles[i]?.date ? new Date(candles[i].date).getDate() : ''}`}</text>)}
    </svg>
  )
}

// KD 子圖
function KDChart({ candles }) {
  if (!candles || candles.length < 9) return null
  const w = 560, h = 75, pad = { t: 4, r: 6, b: 14, l: 46 }
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b
  const data = calcKD(candles)
  const toY = v => pad.t + ch - ((v - 0) / 100) * ch
  const sp = cw / candles.length, cx = i => pad.l + i * sp + sp / 2
  const line = (key, color) => {
    const pts = data.map((d, i) => `${cx(i).toFixed(1)},${toY(Math.min(100,Math.max(0,d[key]))).toFixed(1)}`).join(' ')
    return <polyline points={pts} fill="none" stroke={color} strokeWidth={1.2} />
  }
  const cur = data[data.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
      <text x={pad.l - 3} y={pad.t + 6} fontSize={8} fill="#475569" textAnchor="end">KD</text>
      {[[80,'#ef444433'],[50,'rgba(255,255,255,0.04)'],[20,'#22c55e33']].map(([v,col]) => <line key={v} x1={pad.l} y1={toY(v)} x2={pad.l+cw} y2={toY(v)} stroke={col} strokeWidth={v===50?0.5:1} />)}
      {line('k', '#f59e0b')}{line('d', '#818cf8')}
      <text x={pad.l+2}  y={pad.t+10} fontSize={8} fill="#f59e0b">K:{cur?.k}</text>
      <text x={pad.l+40} y={pad.t+10} fontSize={8} fill="#818cf8">D:{cur?.d}</text>
      <text x={pad.l+78} y={pad.t+10} fontSize={8} fill={cur?.k > 80 ? '#ef4444' : cur?.k < 20 ? '#22c55e' : '#475569'}>
        {cur?.k > 80 ? '⚠️超買' : cur?.k < 20 ? '💡超賣' : ''}
      </text>
      {[0, Math.floor(candles.length/2), candles.length-1].map(i => <text key={i} x={cx(i)} y={h-2} textAnchor="middle" fontSize={8} fill="rgba(148,163,184,0.5)">{`${candles[i]?.date ? new Date(candles[i].date).getMonth()+1 : ''}/${candles[i]?.date ? new Date(candles[i].date).getDate() : ''}`}</text>)}
    </svg>
  )
}

export default function AnalysisTab({ stock, sectorKey, allSectors, analysis, busy, onReanalyze,
    alerts = [], addAlert = ()=>{}, removeAlert = ()=>{}, cash = 100000 }) {
  const [indicator, setIndicator] = useState('macd')

  if (!stock) {
    return (
      <div style={{ textAlign: 'center', color: '#475569', padding: '70px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
        <div style={{ fontSize: 14, color: '#64748b' }}>從「市場概覽」選擇個股，點擊「分析」</div>
        <div style={{ fontSize: 12, marginTop: 8, color: '#374151' }}>整合 K 線 × KD × MACD × 市場消息 × 外資評等</div>
      </div>
    )
  }

  const cs = CANDLES_CACHE[stock.code]
  if (!cs || cs.length < 2) return (
    <div style={{ textAlign: 'center', color: '#475569', padding: '50px 0' }}>
      <div style={{ fontSize: 13 }}>⏳ K 線資料載入中...</div>
    </div>
  )

  const last  = cs[cs.length - 1], prev = cs[cs.length - 2]
  const chg   = (last.close - prev.close) / prev.close * 100
  const up    = chg >= 0
  const ma5   = calcMA(cs, 5), ma10 = calcMA(cs, 10), ma20 = calcMA(cs, 20)
  const rsi14 = calcRSI(cs, 14)
  const sec   = allSectors?.[sectorKey]
  const sColor = sec?.color || '#818cf8'
  const fmtP  = p => p >= 1000 ? p.toFixed(0) : p >= 100 ? p.toFixed(1) : p.toFixed(2)
  const isLimitUp   = chg >= 9.5
  const isLimitDown = chg <= -9.5

  // 指標計算
  const kdData   = calcKD(cs)
  const curKD    = kdData[kdData.length - 1]
  const macdData = calcMACD(cs)
  const curMACD  = macdData[macdData.length - 1]
  const { supports, resistances } = detectSR(cs)

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#e2e8f0' }}>{stock.name}</span>
          <span style={{ fontSize: 12, color: '#475569', marginLeft: 8 }}>{stock.code} · {sec?.name || sectorKey}</span>
        </div>
        <span style={{ fontSize: 17, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#e2e8f0' }}>
          {fmtP(last.close)}
        </span>
        <span style={{ fontSize: 12, color: priceColor(chg), fontWeight: 700 }}>
          {up ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
        </span>
        {isLimitUp   && <span style={{ padding:'2px 8px',borderRadius:6,fontSize:12,fontWeight:900,color:C.up,  border:`2px solid ${C.up}`,  background:C.upBg   }}>漲停</span>}
        {isLimitDown && <span style={{ padding:'2px 8px',borderRadius:6,fontSize:12,fontWeight:900,color:C.down,border:`2px solid ${C.down}`,background:C.downBg }}>跌停</span>}
        {analysis && !analysis.error && (
          <span style={{
            padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, marginLeft: 'auto',
            background: sigBg(analysis.signal), color: sigColor(analysis.signal),
            border: `1px solid ${sigBorder(analysis.signal)}`,
          }}>
            {analysis.signal} {analysis.confidence}%
            <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>{analysis.isLocal ? '📐' : '🤖'}</span>
          </span>
        )}
        <button onClick={() => onReanalyze(stock, sectorKey)} style={{
          padding: '5px 12px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
          fontFamily: 'inherit', background: '#151d35', border: '1px solid #1e2d4d', color: '#64748b',
          marginLeft: analysis ? 0 : 'auto',
        }}>🔄 重新分析</button>
      </div>

      {/* ── Indicator strip ── */}
      <div style={{ display: 'flex', gap: 12, fontSize: 11, marginBottom: 6, flexWrap: 'wrap' }}>
        {[['MA5',ma5],['MA10',ma10],['MA20',ma20]].map(([l, v]) => (
          <span key={l} style={{ color: v ? (last.close > v ? C.up : C.down) : '#475569', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: '#475569' }}>{l} </span>{v ? fmtP(v) : '—'}
          </span>
        ))}
        {rsi14 !== null && (
          <span style={{ color: rsi14 > 70 ? C.up : rsi14 < 30 ? C.down : '#94a3b8' }}>
            <span style={{ color: '#475569' }}>RSI </span>{rsi14.toFixed(1)}
            {rsi14 > 70 ? ' ⚠️超買' : rsi14 < 30 ? ' 💡超賣' : ''}
          </span>
        )}
        <span style={{ color: curKD?.k > 80 ? C.up : curKD?.k < 20 ? C.down : '#94a3b8' }}>
          <span style={{ color: '#475569' }}>KD </span>K:{curKD?.k} D:{curKD?.d}
        </span>
        <span style={{ color: (curMACD?.hist || 0) > 0 ? C.up : C.down }}>
          <span style={{ color: '#475569' }}>MACD </span>
          {(curMACD?.hist || 0) > 0 ? '多' : '空'} {curMACD?.hist?.toFixed(2) || '—'}
        </span>
      </div>

      {/* 支撐/壓力 */}
      {(supports.length > 0 || resistances.length > 0) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 11, flexWrap: 'wrap' }}>
          {resistances.length > 0 && <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ color: '#475569' }}>壓力：</span>
            {resistances.map(v => <span key={v} style={{ background: C.upBg, border: `1px solid ${C.up}44`, color: C.up, padding: '1px 6px', borderRadius: 4, fontVariantNumeric: 'tabular-nums' }}>{fmtP(v)}</span>)}
          </div>}
          {supports.length > 0 && <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ color: '#475569' }}>支撐：</span>
            {supports.map(v => <span key={v} style={{ background: C.downBg, border: `1px solid ${C.down}44`, color: C.down, padding: '1px 6px', borderRadius: 4, fontVariantNumeric: 'tabular-nums' }}>{fmtP(v)}</span>)}
          </div>}
        </div>
      )}

      {/* ── K線圖 ── */}
      <div style={{ background: '#090d1b', borderRadius: 10, padding: '10px 10px 4px', marginBottom: 4 }}>
        <CandleChart candles={cs} h={210} showMA showVolume />
      </div>

      {/* ── 指標切換 ── */}
      <div style={{ display: 'flex', gap: 6, padding: '4px 0', marginBottom: 4 }}>
        {[{k:'macd',l:'MACD'},{k:'kd',l:'KD指標'},{k:'none',l:'隱藏'}].map(m => (
          <button key={m.k} onClick={() => setIndicator(m.k)} style={{
            padding: '3px 10px', fontSize: 11, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
            background: indicator === m.k ? '#1e2d4d' : 'transparent',
            border: `1px solid ${indicator === m.k ? '#818cf8' : '#1e2d4d'}`,
            color: indicator === m.k ? '#818cf8' : '#475569', fontWeight: indicator === m.k ? 700 : 400,
          }}>{m.l}</button>
        ))}
      </div>

      {/* ── 指標子圖 ── */}
      {indicator !== 'none' && (
        <div style={{ background: '#090d1b', borderRadius: 10, padding: '8px 10px', marginBottom: 12 }}>
          {indicator === 'macd' ? <MACDChart candles={cs} /> : <KDChart candles={cs} />}
        </div>
      )}

      {busy && (
        <div style={{ textAlign: 'center', color: '#818cf8', padding: '20px 0', fontSize: 13 }}>
          ⏳ 整合技術面 + 市場面 + 外資評等分析中...
        </div>
      )}

      {analysis && !busy && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr) repeat(2,1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { l: 'K線型態', v: analysis.pattern, c: sColor },
              { l: '趨勢方向', v: analysis.trend, c: analysis.trend==='上漲' ? C.up : analysis.trend==='下跌' ? C.down : '#94a3b8' },
              { l: '操作信號', v: analysis.signal, c: sigColor(analysis.signal) },
              { l: '市場情緒', v: analysis.marketSentiment || '—', c: sentColor(analysis.marketSentiment) },
            ].map((x, i) => (
              <div key={i} style={{ background: '#090d1b', border: '1px solid #1e2d4d', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{x.l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: x.c }}>{x.v}</div>
              </div>
            ))}
          </div>

          {!analysis.error && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {analysis.computexCatalyst && (
                <div style={{ background: '#1e1b4b', border: '1px solid #818cf833', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>🎪 Computex關聯</div>
                  <div style={{ fontSize: 11, color: '#818cf8' }}>{analysis.computexCatalyst}</div>
                </div>
              )}
              {analysis.analystRating && analysis.analystRating !== '無評等' && (
                <div style={{ background: C.buyBg, border: `1px solid ${C.buyBorder}`, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>📋 外資評等</div>
                  <div style={{ fontSize: 11, color: C.buy, fontWeight: 700 }}>{analysis.analystRating}</div>
                </div>
              )}
            </div>
          )}

          {!analysis.error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
              {[
                { l: '建議進場', v: analysis.entry,    c: '#818cf8' },
                { l: '停損價',   v: analysis.stopLoss, c: '#22c55e' },
                { l: '目標價',   v: analysis.target,   c: '#ef4444' },
              ].map((x, i) => (
                <div key={i} style={{ background: '#090d1b', border: '1px solid #1e2d4d', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{x.l}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: x.c, fontVariantNumeric: 'tabular-nums' }}>
                    {typeof x.v === 'number' ? fmtP(x.v) : x.v || '—'}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: '#090d1b', border: '1px solid #1e2d4d', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 8 }}>
              {analysis.isLocal ? '📐 技術面 + 市場情境綜合分析（免費）' : '🤖 Claude AI 深度分析'}
            </div>
            <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, marginBottom: analysis.error ? 0 : 10 }}>
              {analysis.analysis}
            </div>
            {!analysis.error && (
              <>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#475569', marginBottom: 8 }}>
                  <span>⏱ {analysis.timeframe}</span><span>⚠️ 風險：{analysis.risk}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#475569', minWidth: 30 }}>信心</span>
                  <div style={{ flex: 1, height: 6, background: '#1e2d4d', borderRadius: 3 }}>
                    <div style={{ width: `${analysis.confidence}%`, height: '100%', borderRadius: 3, transition: 'width 0.8s',
                      background: analysis.confidence >= 70 ? C.buy : analysis.confidence >= 50 ? '#f59e0b' : C.sell }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 700 }}>{analysis.confidence}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <MarketNewsPanel sectorKey={sectorKey} stockCode={stock.code} />

      {/* 虛擬下單按鈕 */}
      {analysis && !analysis.error && analysis.signal === '買入' && (
        <button onClick={() => onOrder && onOrder({ stock, price: analysis.entry || last.close, analysis })} style={{
          width:'100%',padding:'12px',fontSize:14,borderRadius:10,cursor:'pointer',
          fontFamily:'inherit',fontWeight:800,marginTop:12,
          background:'#062020',border:'1px solid #0abab577',color:'#0abab5',
        }}>
          💹 虛擬下單 — 買入 {stock.name}
        </button>
      )}

      <RiskCalculator analysis={analysis} cash={cash} />
      <AlertPanel stock={stock} analysis={analysis} alerts={alerts} addAlert={addAlert} removeAlert={removeAlert} />
      <InstitutionalPanel stock={stock} />
    </div>
  )
}
