import { useState } from 'react'
import { CANDLES_CACHE, calcMA } from '../services/stockApi.js'
import { analyzeLocally } from '../services/localAnalysis.js'

export default function ScannerTab({ allSectors, onAnalyze }) {
  const [scanning, setScanning] = useState(false)
  const [results,  setResults]  = useState([])
  const [filter,   setFilter]   = useState('all') // all | buy | sell

  async function runScan() {
    setScanning(true)
    setResults([])
    const found = []

    for (const [sKey, sec] of Object.entries(allSectors)) {
      for (const stock of (sec.stocks || [])) {
        const cs = CANDLES_CACHE[stock.code]
        if (!cs || cs.length < 5) continue
        const ma5  = calcMA(cs, 5)
        const ma10 = calcMA(cs, 10)
        const ma20 = calcMA(cs, 20)
        const r    = analyzeLocally({ stock, candles: cs, ma5, ma10, ma20 })
        const last = cs[cs.length - 1]
        const prev = cs[cs.length - 2]
        const chg  = (last.close - prev.close) / prev.close * 100
        found.push({ stock, sKey, result: r, price: last.close, chg })
        // slight delay to not block UI
        await new Promise(res => setTimeout(res, 5))
      }
    }

    // Sort: buy first by confidence desc, then sell, then hold
    found.sort((a, b) => {
      const order = { '買入': 0, '賣出': 1, '觀望': 2 }
      if (order[a.result.signal] !== order[b.result.signal])
        return order[a.result.signal] - order[b.result.signal]
      return b.result.confidence - a.result.confidence
    })

    setResults(found)
    setScanning(false)
  }

  const filtered = filter === 'all' ? results
    : results.filter(r => r.result.signal === (filter === 'buy' ? '買入' : '賣出'))

  const buyCount  = results.filter(r => r.result.signal === '買入').length
  const sellCount = results.filter(r => r.result.signal === '賣出').length

  const fmtPrice = p => p >= 1000 ? p.toFixed(0) : p >= 100 ? p.toFixed(1) : p.toFixed(2)

  return (
    <div>
      {/* Scan button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={runScan} disabled={scanning} style={{
          padding: '10px 20px', fontSize: 13, borderRadius: 8,
          cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700,
          background: scanning ? '#151d35' : '#1e2d4d',
          border: `1px solid ${scanning ? '#1e2d4d' : '#818cf8'}`,
          color: scanning ? '#475569' : '#818cf8',
        }}>
          {scanning ? '⏳ 掃描中...' : '🔍 一鍵掃描所有股票'}
        </button>

        {results.length > 0 && (
          <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
            <span style={{ color: '#64748b' }}>共 {results.length} 檔</span>
            <span style={{ color: '#22c55e', fontWeight: 700 }}>買入 {buyCount}</span>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>賣出 {sellCount}</span>
          </div>
        )}

        {results.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            {[
              { k: 'all',  label: '全部' },
              { k: 'buy',  label: '買入' },
              { k: 'sell', label: '賣出' },
            ].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)} style={{
                padding: '4px 10px', fontSize: 11, borderRadius: 16,
                cursor: 'pointer', fontFamily: 'inherit',
                background: filter === f.k ? '#1e2d4d' : 'transparent',
                border: `1px solid ${filter === f.k ? '#818cf8' : '#1e2d4d'}`,
                color: filter === f.k ? '#818cf8' : '#64748b',
                fontWeight: filter === f.k ? 700 : 400,
              }}>{f.label}</button>
            ))}
          </div>
        )}
      </div>

      {results.length === 0 && !scanning && (
        <div style={{ textAlign: 'center', color: '#475569', padding: '50px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 14 }}>點擊掃描，AI 自動分析所有族群個股</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>依買賣信號強度排序，找出最佳進場時機</div>
        </div>
      )}

      {/* Results table */}
      {filtered.length > 0 && (
        <div>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '80px 1fr 70px 80px 80px 70px',
            gap: 8, padding: '6px 10px', fontSize: 10, color: '#475569',
            borderBottom: '1px solid #1e2d4d', marginBottom: 4,
          }}>
            <span>代號</span><span>名稱/型態</span>
            <span style={{ textAlign: 'right' }}>股價</span>
            <span style={{ textAlign: 'center' }}>信號</span>
            <span style={{ textAlign: 'center' }}>信心</span>
            <span style={{ textAlign: 'right' }}>操作</span>
          </div>

          {filtered.map(({ stock, sKey, result, price, chg }, idx) => {
            const up     = chg >= 0
            const sig    = result.signal
            const sigCol = sig === '買入' ? '#22c55e' : sig === '賣出' ? '#ef4444' : '#64748b'
            const conf   = result.confidence
            const secCol = allSectors[sKey]?.color || '#818cf8'

            return (
              <div key={`${stock.code}-${idx}`} style={{
                display: 'grid', gridTemplateColumns: '80px 1fr 70px 80px 80px 70px',
                gap: 8, padding: '8px 10px', alignItems: 'center',
                borderBottom: '1px solid #0f1628',
                background: idx % 2 === 0 ? '#0d1224' : 'transparent',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', fontVariantNumeric: 'tabular-nums' }}>
                    {stock.code}
                  </div>
                  <div style={{ fontSize: 9, color: secCol, marginTop: 1 }}>
                    {allSectors[sKey]?.tag} {allSectors[sKey]?.name}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{stock.name}</div>
                  <div style={{ fontSize: 10, color: '#475569' }}>{result.pattern}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#e2e8f0' }}>
                    {fmtPrice(price)}
                  </div>
                  <div style={{ fontSize: 10, color: up ? '#22c55e' : '#ef4444' }}>
                    {up ? '▲' : '▼'}{Math.abs(chg).toFixed(2)}%
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                    background: sigCol + '22', color: sigCol, border: `1px solid ${sigCol}44`,
                  }}>{sig}</span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: 4, background: '#1e2d4d', borderRadius: 2, marginBottom: 2 }}>
                    <div style={{
                      width: `${conf}%`, height: '100%', borderRadius: 2,
                      background: conf >= 70 ? '#22c55e' : conf >= 55 ? '#f59e0b' : '#ef4444',
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{conf}%</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => onAnalyze(stock, sKey)} style={{
                    padding: '4px 8px', fontSize: 10, borderRadius: 5, cursor: 'pointer',
                    fontFamily: 'inherit', background: secCol + '18',
                    border: `1px solid ${secCol}44`, color: secCol, fontWeight: 600,
                  }}>詳細</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
