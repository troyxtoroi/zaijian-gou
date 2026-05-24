/**
 * 技術指標子圖：MACD / KD（隨機指標）
 * 台灣散戶最常用的兩大指標
 */

function calcKD(candles, period = 9, k_smooth = 3, d_smooth = 3) {
  const result = []
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { result.push({ k: 50, d: 50, j: 50 }); continue }
    const slice  = candles.slice(i - period + 1, i + 1)
    const low9   = Math.min(...slice.map(c => c.low))
    const high9  = Math.max(...slice.map(c => c.high))
    const rsv    = high9 === low9 ? 50 : (candles[i].close - low9) / (high9 - low9) * 100
    const prevK  = result[i - 1]?.k ?? 50
    const prevD  = result[i - 1]?.d ?? 50
    const k      = (2 / 3) * prevK + (1 / 3) * rsv
    const d      = (2 / 3) * prevD + (1 / 3) * k
    const j      = 3 * k - 2 * d
    result.push({ k: +k.toFixed(2), d: +d.toFixed(2), j: +j.toFixed(2), rsv: +rsv.toFixed(2) })
  }
  return result
}

function calcEMA(values, period) {
  const k = 2 / (period + 1)
  const result = []
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { result.push(null); continue }
    if (i === period - 1) { result.push(ema); continue }
    ema = values[i] * k + ema * (1 - k)
    result.push(+ema.toFixed(4))
  }
  return result
}

function calcMACD(candles) {
  const closes  = candles.map(c => c.close)
  const ema12   = calcEMA(closes, 12)
  const ema26   = calcEMA(closes, 26)
  const macdArr = closes.map((_, i) =>
    ema12[i] !== null && ema26[i] !== null ? +(ema12[i] - ema26[i]).toFixed(4) : null
  )
  const validMacd = macdArr.map(v => v ?? 0)
  const signal    = calcEMA(validMacd, 9)
  return macdArr.map((macd, i) => ({
    macd:  macd,
    signal: signal[i],
    hist:   macd !== null && signal[i] !== null ? +(macd - signal[i]).toFixed(4) : null,
  }))
}

export default function IndicatorChart({ candles, mode = 'macd', h = 80 }) {
  if (!candles || candles.length < 26) return null

  const w   = 560
  const pad = { t: 4, r: 6, b: 16, l: 46 }
  const cw  = w - pad.l - pad.r
  const ch  = h - pad.t - pad.b
  const sp  = cw / candles.length
  const cx  = i => pad.l + i * sp + sp / 2

  if (mode === 'kd') {
    const kdData = calcKD(candles)
    const allVals = kdData.flatMap(d => [d.k, d.d]).filter(v => v !== null)
    const minV = Math.max(0, Math.min(...allVals) - 5)
    const maxV = Math.min(100, Math.max(...allVals) + 5)
    const range = maxV - minV || 1
    const toY = v => pad.t + ch - ((v - minV) / range) * ch

    const kdLine = (data, key, color) => {
      const pts = data.map((d, i) => d[key] !== null ? `${cx(i).toFixed(1)},${toY(d[key]).toFixed(1)}` : null).filter(Boolean)
      if (pts.length < 2) return null
      return <polyline key={key} points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.2} />
    }

    // 超買80/超賣20 線
    const y80 = toY(80), y20 = toY(20), y50 = toY(50)

    return (
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
        <text x={pad.l - 3} y={pad.t + 6} fontSize={8} fill="#475569" textAnchor="end">KD</text>
        {[[80,'#ef444433'],[50,'rgba(255,255,255,0.05)'],[20,'#22c55e33']].map(([v,col])=>(
          <line key={v} x1={pad.l} y1={toY(v)} x2={pad.l+cw} y2={toY(v)} stroke={col} strokeWidth={v===50?0.5:1} strokeDasharray={v===50?"4,4":"none"} />
        ))}
        <text x={pad.l-3} y={y80+3} fontSize={7} fill="#ef4444" textAnchor="end">80</text>
        <text x={pad.l-3} y={y20+3} fontSize={7} fill="#22c55e" textAnchor="end">20</text>
        {kdLine(kdData, 'k', '#f59e0b')}
        {kdLine(kdData, 'd', '#818cf8')}
        {/* J值（橘色） */}
        {(() => {
          const jPts = kdData.map((d,i) => {
            const jv = Math.min(100, Math.max(0, d.j))
            return `${cx(i).toFixed(1)},${toY(jv).toFixed(1)}`
          })
          return <polyline points={jPts.join(' ')} fill="none" stroke="#fb7185" strokeWidth={0.8} opacity={0.6} />
        })()}
        {/* 圖例 */}
        <text x={pad.l+2}  y={pad.t+10} fontSize={8} fill="#f59e0b">K</text>
        <text x={pad.l+14} y={pad.t+10} fontSize={8} fill="#818cf8">D</text>
        <text x={pad.l+26} y={pad.t+10} fontSize={8} fill="#fb7185">J</text>
        {/* 當前值 */}
        {kdData.length > 0 && (
          <>
            <text x={pad.l+cw-2} y={toY(kdData[kdData.length-1].k)+3} fontSize={8} fill="#f59e0b" textAnchor="end">
              K:{kdData[kdData.length-1].k.toFixed(1)}
            </text>
            <text x={pad.l+cw-2} y={toY(kdData[kdData.length-1].d)+3+10} fontSize={8} fill="#818cf8" textAnchor="end">
              D:{kdData[kdData.length-1].d.toFixed(1)}
            </text>
          </>
        )}
      </svg>
    )
  }

  // MACD 模式
  const macdData = calcMACD(candles)
  const hists    = macdData.map(d => d.hist).filter(v => v !== null)
  const mLines   = macdData.map(d => [d.macd, d.signal]).flat().filter(v => v !== null)
  const allVals  = [...hists, ...mLines]
  const absMax   = Math.max(Math.abs(Math.min(...allVals)), Math.abs(Math.max(...allVals))) * 1.1 || 1
  const toY      = v => pad.t + ch / 2 - (v / absMax) * (ch / 2)
  const zeroY    = toY(0)

  const macdLine = (key, color) => {
    const pts = macdData.map((d, i) => d[key] !== null ? `${cx(i).toFixed(1)},${toY(d[key]).toFixed(1)}` : null).filter(Boolean)
    if (pts.length < 2) return null
    return <polyline key={key} points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.2} />
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
      <text x={pad.l-3} y={pad.t+6} fontSize={8} fill="#475569" textAnchor="end">MACD</text>
      <line x1={pad.l} y1={zeroY} x2={pad.l+cw} y2={zeroY} stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
      {/* Histogram */}
      {macdData.map((d, i) => {
        if (d.hist === null) return null
        const barY    = d.hist >= 0 ? toY(d.hist) : zeroY
        const barH    = Math.abs(toY(d.hist) - zeroY)
        const barW    = Math.max(1, sp * 0.6)
        const isGrow  = i > 0 && macdData[i-1].hist !== null && d.hist > macdData[i-1].hist
        return (
          <rect key={i} x={cx(i)-barW/2} y={barY} width={barW} height={Math.max(1,barH)}
            fill={d.hist >= 0 ? '#ef4444' : '#22c55e'}
            fillOpacity={isGrow ? 0.9 : 0.5} />
        )
      })}
      {macdLine('macd',   '#fbbf24')}
      {macdLine('signal', '#818cf8')}
      {/* 圖例 */}
      <text x={pad.l+2}  y={pad.t+10} fontSize={8} fill="#fbbf24">MACD</text>
      <text x={pad.l+38} y={pad.t+10} fontSize={8} fill="#818cf8">Signal</text>
      {/* 當前值 */}
      {macdData.length > 0 && macdData[macdData.length-1].macd !== null && (
        <text x={pad.l+cw-2} y={pad.t+10} fontSize={8} fill="#fbbf24" textAnchor="end">
          {macdData[macdData.length-1].macd.toFixed(2)}
        </text>
      )}
    </svg>
  )
}

export { calcKD, calcMACD }
