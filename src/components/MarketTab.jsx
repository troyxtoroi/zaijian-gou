import { CANDLES_CACHE } from '../services/stockApi.js'
import CandleChart from './CandleChart.jsx'

export default function MarketTab({ sector, setSector, allSectors, onAnalyze, loading, onDeleteSector, onRemoveStock }) {
  const sec = allSectors[sector]
  if (!sec) return null

  return (
    <div>
      {/* Sector pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, alignItems: 'center' }}>
        {Object.entries(allSectors).map(([k, s]) => (
          <div key={k} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <button onClick={() => setSector(k)} style={{
              padding: '5px 11px', fontSize: 12, borderRadius: 20,
              cursor: 'pointer', fontFamily: 'inherit',
              background: sector === k ? (s.color || '#818cf8') + '22' : '#151d35',
              border: `1px solid ${sector === k ? (s.color || '#818cf8') : '#1e2d4d'}`,
              color: sector === k ? (s.color || '#818cf8') : '#64748b',
              fontWeight: sector === k ? 700 : 400,
              paddingRight: s.isCustom ? 24 : 11,
            }}>
              {s.tag} {s.name}
            </button>
            {s.isCustom && (
              <button onClick={(e) => { e.stopPropagation(); onDeleteSector(s.sectorId) }} style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#475569', fontSize: 11, padding: 0, lineHeight: 1,
              }}>✕</button>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: '#818cf8', padding: '10px 0', fontSize: 12, marginBottom: 10 }}>
          📡 正在載入真實股價...
        </div>
      )}

      {sec.stocks.length === 0 && (
        <div style={{ textAlign: 'center', color: '#475569', padding: '40px 0', fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
          <div>此分類尚無股票</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>點右上角「＋ 自選股」加入</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {sec.stocks.map(stock => {
          const cs = CANDLES_CACHE[stock.code]
          if (!cs || cs.length < 2) return null
          const last = cs[cs.length - 1]
          const prev = cs[cs.length - 2]
          const chg  = (last.close - prev.close) / prev.close * 100
          const up   = chg >= 0
          const vol5 = cs.slice(-5).reduce((s, c) => s + c.volume, 0) / 5
          const volR = vol5 > 0 ? (last.volume / vol5).toFixed(1) : '—'
          const col  = sec.color || '#818cf8'

          return (
            <div key={stock.code}
              style={{
                background: '#151d35', border: '1px solid #1e2d4d',
                borderRadius: 10, padding: 12, cursor: 'pointer',
                transition: 'border-color 0.15s', position: 'relative',
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = col}
              onMouseOut={e  => e.currentTarget.style.borderColor = '#1e2d4d'}
            >
              {/* Remove stock button (custom sectors only) */}
              {sec.isCustom && (
                <button onClick={(e) => { e.stopPropagation(); onRemoveStock(sec.sectorId, stock.code) }} style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#475569', fontSize: 14, padding: 2,
                }}>✕</button>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0' }}>{stock.name}</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>{stock.code}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#e2e8f0' }}>
                    {last.close >= 1000 ? last.close.toFixed(0) : last.close >= 100 ? last.close.toFixed(1) : last.close.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: up ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {up ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div style={{ margin: '6px 0', background: '#090d1b', borderRadius: 6, padding: 4 }}>
                <CandleChart candles={cs.slice(-15)} h={65} mini />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginBottom: 8 }}>
                <span>量 {(last.volume / 1000).toFixed(0)}K</span>
                <span style={{ color: parseFloat(volR) > 1.5 ? '#fbbf24' : '#475569' }}>
                  {parseFloat(volR) > 1.5 ? `量增 ${volR}x` : `量比 ${volR}`}
                </span>
                <span>高 {last.high >= 100 ? last.high.toFixed(1) : last.high.toFixed(2)}</span>
              </div>

              <button onClick={() => onAnalyze(stock, k)} style={{
                width: '100%', padding: '7px', fontSize: 12, borderRadius: 7,
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                background: col + '18', border: `1px solid ${col}44`, color: col,
              }}>
                🧠 AI 分析
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
