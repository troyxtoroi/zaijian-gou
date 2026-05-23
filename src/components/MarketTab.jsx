import { SECTORS } from '../data/sectors.js'
import { CANDLES_CACHE } from '../services/stockApi.js'
import CandleChart from './CandleChart.jsx'

export default function MarketTab({ sector, setSector, onAnalyze }) {
  const sec = SECTORS[sector]

  return (
    <div>
      {/* Sector pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {Object.entries(SECTORS).map(([k, s]) => (
          <button key={k} onClick={() => setSector(k)} style={{
            padding: '5px 11px', fontSize: 12, borderRadius: 20,
            cursor: 'pointer', fontFamily: 'inherit',
            background: sector === k ? s.color + '22' : '#151d35',
            border: `1px solid ${sector === k ? s.color : '#1e2d4d'}`,
            color: sector === k ? s.color : '#64748b',
            fontWeight: sector === k ? 700 : 400,
            transition: 'all 0.15s',
          }}>
            {s.tag} {s.name}
          </button>
        ))}
      </div>

      {/* Stock cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 10,
      }}>
        {sec.stocks.map(stock => {
          const cs = CANDLES_CACHE[stock.code]
          if (!cs) return null
          const last = cs[cs.length - 1]
          const prev = cs[cs.length - 2]
          const chg  = (last.close - prev.close) / prev.close * 100
          const up   = chg >= 0
          const vol5 = cs.slice(-5).reduce((s, c) => s + c.volume, 0) / 5
          const volR = (last.volume / vol5).toFixed(1)

          return (
            <div key={stock.code}
              style={{
                background: '#151d35', border: '1px solid #1e2d4d',
                borderRadius: 10, padding: 12, cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = sec.color}
              onMouseOut={e  => e.currentTarget.style.borderColor = '#1e2d4d'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0' }}>{stock.name}</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>{stock.code}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#e2e8f0' }}>
                    {last.close >= 1000 ? last.close.toFixed(0)
                      : last.close >= 100 ? last.close.toFixed(1)
                      : last.close.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: up ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {up ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div style={{ margin: '6px 0', background: '#090d1b', borderRadius: 6, padding: 4 }}>
                <CandleChart candles={cs.slice(-15)} h={65} mini />
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 10, color: '#475569', marginBottom: 8,
              }}>
                <span>量 {(last.volume / 1000).toFixed(0)}K</span>
                <span style={{ color: parseFloat(volR) > 1.5 ? '#fbbf24' : '#475569' }}>
                  {parseFloat(volR) > 1.5 ? `量增 ${volR}x` : `量比 ${volR}`}
                </span>
                <span>高 {last.high.toFixed(1)}</span>
              </div>

              <button
                onClick={() => onAnalyze(stock, sector)}
                style={{
                  width: '100%', padding: '7px', fontSize: 12,
                  borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                  background: sec.color + '18',
                  border: `1px solid ${sec.color}44`,
                  color: sec.color,
                }}
              >
                🧠 AI 分析
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
