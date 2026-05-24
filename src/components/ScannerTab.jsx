import { useState } from 'react'
import { CANDLES_CACHE, calcMA } from '../services/stockApi.js'
import { analyzeLocally } from '../services/localAnalysis.js'
import { C } from '../utils/colors.js'

export default function ScannerTab({ allSectors, onAnalyze }) {
  const [scanning, setScanning] = useState(false)
  const [results,  setResults]  = useState([])
  const [filter,   setFilter]   = useState('limitup') // limitup | buy | all

  async function runScan() {
    setScanning(true); setResults([])
    const found = []
    for (const [sKey, sec] of Object.entries(allSectors)) {
      for (const stock of (sec.stocks || [])) {
        const cs = CANDLES_CACHE[stock.code]
        if (!cs || cs.length < 5) continue
        const ma5  = calcMA(cs, 5), ma10 = calcMA(cs, 10), ma20 = calcMA(cs, 20)
        const r    = analyzeLocally({ stock, candles: cs, ma5, ma10, ma20, sectorKey: sKey })
        const last = cs[cs.length - 1], prev = cs[cs.length - 2]
        const chg  = (last.close - prev.close) / prev.close * 100
        found.push({ stock, sKey, result: r, price: last.close, chg })
        await new Promise(res => setTimeout(res, 8))
      }
    }
    // 排序：漲停信號優先，再按信心度
    found.sort((a, b) => {
      if (a.result.limitUpSignal !== b.result.limitUpSignal) return a.result.limitUpSignal ? -1 : 1
      if (a.result.signal !== b.result.signal) {
        const order = { '買入': 0, '賣出': 1, '觀望': 2 }
        if (order[a.result.signal] !== order[b.result.signal]) return order[a.result.signal] - order[b.result.signal]
      }
      return b.result.confidence - a.result.confidence
    })
    setResults(found); setScanning(false)
  }

  const filtered = filter === 'limitup' ? results.filter(r => r.result.limitUpSignal)
    : filter === 'buy' ? results.filter(r => r.result.signal === '買入')
    : results

  const limitUpCount = results.filter(r => r.result.limitUpSignal).length
  const buyCount     = results.filter(r => r.result.signal === '買入').length
  const fmtP = p => p >= 1000 ? p.toFixed(0) : p >= 100 ? p.toFixed(1) : p.toFixed(2)

  return (
    <div>
      {/* 說明 + 掃描按鈕 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, lineHeight: 1.6,
          padding: '8px 12px', background: '#1e1b4b', borderRadius: 8, border: '1px solid #818cf833' }}>
          🎯 掃描條件：<span style={{ color: C.buy }}>相對低點</span>（近20日底部30%）＋<span style={{ color: C.up }}>至少2根漲停潛力</span>（高波動+≥3項指標）＋<span style={{ color: '#818cf8' }}>多方K線型態</span><br/>
          <span style={{ fontSize: 10, color: '#475569' }}>此為最嚴格篩選，滿足全部條件的股票較少，但準確率更高</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={runScan} disabled={scanning} style={{
            padding: '10px 20px', fontSize: 13, borderRadius: 8,
            cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700,
            background: scanning ? '#151d35' : '#1e2d4d',
            border: `1px solid ${scanning ? '#1e2d4d' : '#818cf8'}`,
            color: scanning ? '#475569' : '#818cf8',
          }}>
            {scanning ? '⏳ 掃描中...' : '🔍 掃描所有股票'}
          </button>

          {results.length > 0 && (
            <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
              <span style={{ color: C.up, fontWeight: 700 }}>🚀 漲停信號 {limitUpCount}</span>
              <span style={{ color: C.buy, fontWeight: 700 }}>買入 {buyCount}</span>
              <span style={{ color: '#64748b' }}>共 {results.length} 檔</span>
            </div>
          )}

          {results.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              {[
                { k: 'limitup', label: '🚀 漲停信號' },
                { k: 'buy',     label: '買入' },
                { k: 'all',     label: '全部' },
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
      </div>

      {/* 空狀態 */}
      {results.length === 0 && !scanning && (
        <div style={{ textAlign: 'center', color: '#475569', padding: '50px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 14 }}>點擊掃描，自動尋找低點漲停信號</div>
        </div>
      )}

      {/* 漲停信號為空 */}
      {filter === 'limitup' && filtered.length === 0 && results.length > 0 && (
        <div style={{ textAlign: 'center', color: '#475569', padding: '30px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 13 }}>目前無股票同時滿足「相對低點」+「2根漲停潛力」條件</div>
          <div style={{ fontSize: 11, marginTop: 8 }}>可切換到「買入」查看一般買入信號</div>
        </div>
      )}

      {/* 結果列表 */}
      {filtered.length > 0 && (
        <div>
          {/* 表頭 */}
          <div style={{
            display: 'grid', gridTemplateColumns: '75px 1fr 70px 90px 80px 60px 60px',
            gap: 6, padding: '6px 10px', fontSize: 10, color: '#475569',
            borderBottom: '1px solid #1e2d4d', marginBottom: 4,
          }}>
            <span>代號</span><span>名稱 / 型態</span>
            <span style={{ textAlign:'right' }}>股價</span>
            <span style={{ textAlign:'center' }}>信號</span>
            <span style={{ textAlign:'center' }}>漲停條件</span>
            <span style={{ textAlign:'center' }}>信心</span>
            <span style={{ textAlign:'right' }}>操作</span>
          </div>

          {filtered.map(({ stock, sKey, result, price, chg }, idx) => {
            const up     = chg >= 0
            const sec    = allSectors[sKey]
            const secCol = sec?.color || '#818cf8'
            const isLimit = result.limitUpSignal

            return (
              <div key={`${stock.code}-${idx}`} style={{
                display: 'grid', gridTemplateColumns: '75px 1fr 70px 90px 80px 60px 60px',
                gap: 6, padding: '9px 10px', alignItems: 'center',
                borderBottom: '1px solid #0f1628',
                background: isLimit ? '#0a0f0a' : idx % 2 === 0 ? '#0d1224' : 'transparent',
                borderLeft: isLimit ? `3px solid ${C.up}` : '3px solid transparent',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', fontVariantNumeric:'tabular-nums' }}>{stock.code}</div>
                  <div style={{ fontSize: 9, color: secCol }}>{sec?.tag} {sec?.name}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', display:'flex', alignItems:'center', gap:4 }}>
                    {stock.name}
                    {isLimit && <span style={{ fontSize:9, color:C.up, border:`1px solid ${C.up}44`, padding:'0px 4px', borderRadius:8 }}>漲停</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569' }}>{result.pattern}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric:'tabular-nums', color:'#e2e8f0' }}>{fmtP(price)}</div>
                  <div style={{ fontSize: 10, color: up ? C.up : C.down }}>{up?'▲':'▼'}{Math.abs(chg).toFixed(2)}%</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                    background: result.signal==='買入' ? '#062020' : result.signal==='賣出' ? '#2b0a00' : '#1e2d4d',
                    color: result.signal==='買入' ? C.buy : result.signal==='賣出' ? '#f59e0b' : '#64748b',
                  }}>{result.signal}</span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: result.limitUpInfo?.points >= 4 ? C.up : result.limitUpInfo?.points >= 2 ? '#f59e0b' : '#64748b' }}>
                    {result.limitUpInfo?.points || 0}/8
                  </div>
                  <div style={{ fontSize: 9, color: '#475569' }}>
                    {result.lowInfo?.isLow ? '✅低點' : '❌非低'}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: 4, background: '#1e2d4d', borderRadius: 2, marginBottom: 2 }}>
                    <div style={{ width:`${result.confidence}%`, height:'100%', borderRadius:2,
                      background: result.confidence>=75?C.buy:result.confidence>=55?'#f59e0b':C.sell }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{result.confidence}%</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => onAnalyze(stock, sKey)} style={{
                    padding: '4px 8px', fontSize: 10, borderRadius: 5, cursor: 'pointer',
                    fontFamily: 'inherit', fontWeight: 600,
                    background: secCol + '18', border: `1px solid ${secCol}44`, color: secCol,
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
