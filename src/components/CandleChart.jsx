export default function CandleChart({ candles, h = 160, mini = false }) {
  if (!candles?.length) return null
  const w = mini ? 220 : 560
  const pad = { t: 4, r: 4, b: mini ? 4 : 18, l: mini ? 4 : 46 }
  const cw = w - pad.l - pad.r
  const ch = h - pad.t - pad.b

  const prices = candles.flatMap(c => [c.high, c.low])
  const minP = Math.min(...prices) * 0.998
  const maxP = Math.max(...prices) * 1.002
  const range = maxP - minP
  const toY = p => pad.t + ch - ((p - minP) / range) * ch
  const sp = cw / candles.length
  const bw = Math.max(1.5, sp * 0.6)
  const cx = i => pad.l + i * sp + sp / 2

  const grids = mini ? [] : [0, 0.33, 0.67, 1]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
      {grids.map((r, i) => {
        const price = minP + range * r
        const y = toY(price)
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={pad.l + cw} y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
            <text x={pad.l - 3} y={y + 3.5} textAnchor="end" fontSize={9}
              fill="rgba(148,163,184,0.7)">
              {price >= 1000 ? price.toFixed(0) : price.toFixed(1)}
            </text>
          </g>
        )
      })}

      {candles.map((c, i) => {
        const up = c.close >= c.open
        const col = up ? '#22c55e' : '#ef4444'
        const bt = toY(Math.max(c.open, c.close))
        const bb = toY(Math.min(c.open, c.close))
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

      {!mini && [0, 14, 29].map(i => {
        const idx = Math.min(i, candles.length - 1)
        const d = candles[idx].date
        return (
          <text key={i} x={cx(idx)} y={h - 2} textAnchor="middle"
            fontSize={9} fill="rgba(148,163,184,0.6)">
            {`${d.getMonth() + 1}/${d.getDate()}`}
          </text>
        )
      })}
    </svg>
  )
}
