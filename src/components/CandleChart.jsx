import { useMemo } from 'react'

function calcMA(candles, period) {
  return candles.map((_, i) => {
    if (i < period - 1) return null
    const avg = candles.slice(i - period + 1, i + 1).reduce((s, c) => s + c.close, 0) / period
    return +avg.toFixed(2)
  })
}

export default function CandleChart({ candles, h = 160, mini = false, showMA = false, showVolume = false }) {
  if (!candles?.length) return null

  const w        = mini ? 220 : 560
  const volH     = (!mini && showVolume) ? 32 : 0
  const pad      = { t: 6, r: 6, b: mini ? 4 : 20, l: mini ? 4 : 48 }
  const chartH   = h - pad.t - pad.b - volH
  const cw       = w - pad.l - pad.r
  const ch       = chartH

  const prices   = candles.flatMap(c => [c.high, c.low])
  const minP     = Math.min(...prices) * 0.997
  const maxP     = Math.max(...prices) * 1.003
  const range    = maxP - minP || 1
  const toY      = p => pad.t + ch - ((p - minP) / range) * ch
  const sp       = cw / candles.length
  const bw       = Math.max(1.5, sp * 0.6)
  const cx       = i => pad.l + i * sp + sp / 2

  const ma5data  = useMemo(() => showMA ? calcMA(candles, 5)  : [], [candles, showMA])
  const ma10data = useMemo(() => showMA ? calcMA(candles, 10) : [], [candles, showMA])
  const ma20data = useMemo(() => showMA ? calcMA(candles, 20) : [], [candles, showMA])

  const maLine = (data, color) => {
    const pts = data
      .map((v, i) => v !== null ? `${cx(i).toFixed(1)},${toY(v).toFixed(1)}` : null)
      .filter(Boolean)
    if (pts.length < 2) return null
    // Build segments (break on nulls)
    const segments = []
    let cur = []
    data.forEach((v, i) => {
      if (v !== null) { cur.push(`${cx(i).toFixed(1)},${toY(v).toFixed(1)}`); }
      else if (cur.length) { segments.push(cur); cur = [] }
    })
    if (cur.length) segments.push(cur)
    return segments.map((seg, si) => (
      <polyline key={si} points={seg.join(' ')}
        fill="none" stroke={color} strokeWidth={1} opacity={0.85} />
    ))
  }

  // Volume bars
  const maxVol = Math.max(...candles.map(c => c.volume)) || 1
  const volTop = h - pad.b - volH + 2
  const volBarH = i => (candles[i].volume / maxVol) * (volH - 4)

  const grids = mini ? [] : [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
      {/* Grid lines */}
      {grids.map((r, i) => {
        const price = minP + range * r
        const y = toY(price)
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={pad.l + cw} y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
            <text x={pad.l - 3} y={y + 3.5} textAnchor="end" fontSize={9}
              fill="rgba(148,163,184,0.7)">
              {price >= 1000 ? price.toFixed(0) : price >= 100 ? price.toFixed(1) : price.toFixed(2)}
            </text>
          </g>
        )
      })}

      {/* Candles */}
      {candles.map((c, i) => {
        const up   = c.close >= c.open
        const col  = up ? '#22c55e' : '#ef4444'
        const bt   = toY(Math.max(c.open, c.close))
        const bb   = toY(Math.min(c.open, c.close))
        return (
          <g key={i}>
            <line x1={cx(i)} y1={toY(c.high)} x2={cx(i)} y2={toY(c.low)}
              stroke={col} strokeWidth={mini ? 0.6 : 0.9} />
            <rect x={cx(i) - bw / 2} y={bt} width={bw}
              height={Math.max(1, bb - bt)}
              fill={col} fillOpacity={up ? 0.65 : 0.9}
              stroke={col} strokeWidth={0.4} />
          </g>
        )
      })}

      {/* MA lines */}
      {showMA && maLine(ma5data,  '#fbbf24')}
      {showMA && maLine(ma10data, '#60a5fa')}
      {showMA && maLine(ma20data, '#c084fc')}

      {/* MA legend */}
      {showMA && !mini && (
        <g>
          {[['MA5','#fbbf24'], ['MA10','#60a5fa'], ['MA20','#c084fc']].map(([l, col], i) => (
            <g key={l}>
              <line x1={pad.l + 4 + i * 52} y1={pad.t + 6}
                    x2={pad.l + 18 + i * 52} y2={pad.t + 6}
                stroke={col} strokeWidth={1.5} />
              <text x={pad.l + 20 + i * 52} y={pad.t + 10}
                fontSize={8.5} fill={col}>{l}</text>
            </g>
          ))}
        </g>
      )}

      {/* Volume bars */}
      {showVolume && !mini && candles.map((c, i) => {
        const up  = c.close >= c.open
        const bh  = volBarH(i)
        return (
          <rect key={i}
            x={cx(i) - bw / 2} y={volTop + (volH - 4 - bh)}
            width={bw} height={Math.max(1, bh)}
            fill={up ? '#22c55e' : '#ef4444'} fillOpacity={0.5} />
        )
      })}

      {/* Date labels */}
      {!mini && [0, Math.floor(candles.length / 2), candles.length - 1].map(i => {
        if (!candles[i]) return null
        const d = candles[i].date
        return (
          <text key={i} x={cx(i)} y={h - pad.b + 13}
            textAnchor="middle" fontSize={9} fill="rgba(148,163,184,0.6)">
            {`${d.getMonth() + 1}/${d.getDate()}`}
          </text>
        )
      })}
    </svg>
  )
}
