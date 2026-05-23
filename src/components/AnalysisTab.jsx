import { CANDLES_CACHE, calcMA, calcRSI } from '../services/stockApi.js'
import CandleChart from './CandleChart.jsx'
import MarketNewsPanel from './MarketNewsPanel.jsx'

export default function AnalysisTab({ stock, sectorKey, allSectors, analysis, busy, onReanalyze }) {
  if (!stock) {
    return (
      <div style={{ textAlign: 'center', color: '#475569', padding: '70px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
        <div style={{ fontSize: 14, color: '#64748b' }}>從「市場概覽」選擇個股，點擊「分析」</div>
        <div style={{ fontSize: 12, marginTop: 8, color: '#374151' }}>
          整合 K 線技術面 × 市場消息面 × 外資評等
        </div>
      </div>
    )
  }

  const cs    = CANDLES_CACHE[stock.code]
  if (!cs || cs.length < 2) return (
    <div style={{ textAlign: 'center', color: '#475569', padding: '50px 0' }}>
      <div style={{ fontSize: 13 }}>⏳ K 線資料載入中...</div>
    </div>
  )

  const last  = cs[cs.length - 1]
  const prev  = cs[cs.length - 2]
  const chg   = (last.close - prev.close) / prev.close * 100
  const up    = chg >= 0
  const ma5   = calcMA(cs, 5)
  const ma10  = calcMA(cs, 10)
  const ma20  = calcMA(cs, 20)
  const rsi14 = calcRSI(cs, 14)
  const sec   = allSectors?.[sectorKey]
  const sColor = sec?.color || '#818cf8'
  const fmtP  = p => p >= 1000 ? p.toFixed(0) : p >= 100 ? p.toFixed(1) : p.toFixed(2)

  const sigColor = s => s === '買入' ? '#22c55e' : s === '賣出' ? '#ef4444' : '#94a3b8'
  const sigBg    = s => s === '買入' ? '#0f2b1e' : s === '賣出' ? '#2b0f0f' : '#1e2d4d'

  // 漲停/跌停判斷（台灣：漲停≈+10%，跌停≈-10%）
  // 台灣：漲停=紅色，跌停=綠色
  const isLimitUp   = chg >= 9.5
  const isLimitDown = chg <= -9.5

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

        <span style={{ fontSize: 12, color: up ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
          {up ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
        </span>

        {/* 漲停標籤（紅色框） */}
        {isLimitUp && (
          <span style={{
            padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 900,
            color: '#ef4444', border: '2px solid #ef4444', background: '#2b0f0f',
          }}>漲停</span>
        )}
        {/* 跌停標籤（綠色框） */}
        {isLimitDown && (
          <span style={{
            padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 900,
            color: '#22c55e', border: '2px solid #22c55e', background: '#0f2b1e',
          }}>跌停</span>
        )}

        {analysis && !analysis.error && (
          <span style={{
            padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, marginLeft: 'auto',
            background: sigBg(analysis.signal), color: sigColor(analysis.signal),
            border: `1px solid ${sigColor(analysis.signal)}44`,
          }}>
            {analysis.signal} {analysis.confidence}%
            <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>
              {analysis.isLocal ? '📐' : '🤖'}
            </span>
          </span>
        )}
        <button onClick={() => onReanalyze(stock, sectorKey)} style={{
          padding: '5px 12px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
          fontFamily: 'inherit', background: '#151d35', border: '1px solid #1e2d4d', color: '#64748b',
          marginLeft: analysis ? 0 : 'auto',
        }}>🔄 重新分析</button>
      </div>

      {/* ── Indicator strip ── */}
      <div style={{ display: 'flex', gap: 14, fontSize: 11, marginBottom: 8, flexWrap: 'wrap' }}>
        {[['MA5',ma5],['MA10',ma10],['MA20',ma20]].map(([l, v]) => (
          <span key={l} style={{ color: v ? (last.close > v ? '#22c55e' : '#ef4444') : '#475569', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: '#475569' }}>{l} </span>{v ? fmtP(v) : '—'}
          </span>
        ))}
        {rsi14 !== null && (
          <span style={{ color: rsi14 > 70 ? '#ef4444' : rsi14 < 30 ? '#22c55e' : '#94a3b8' }}>
            <span style={{ color: '#475569' }}>RSI </span>{rsi14.toFixed(1)}
            {rsi14 > 70 ? ' ⚠️超買' : rsi14 < 30 ? ' 💡超賣' : ''}
          </span>
        )}
        {analysis?.indicators?.volRatio && (
          <span style={{ color: analysis.indicators.volRatio > 1.3 ? '#fbbf24' : '#64748b' }}>
            <span style={{ color: '#475569' }}>量比 </span>{analysis.indicators.volRatio}x
          </span>
        )}
      </div>

      {/* ── K-line chart with MA & Volume ── */}
      <div style={{ background: '#090d1b', borderRadius: 10, padding: '10px 10px 4px', marginBottom: 12 }}>
        <CandleChart candles={cs} h={220} showMA showVolume />
      </div>

      {/* ── 分析中 ── */}
      {busy && (
        <div style={{ textAlign: 'center', color: '#818cf8', padding: '20px 0', fontSize: 13 }}>
          ⏳ 整合技術面 + 市場面 + 外資評等分析中...
        </div>
      )}

      {/* ── 分析結果 ── */}
      {analysis && !busy && (
        <div>
          {/* Pattern / Trend / Signal / Market */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr) repeat(2,1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { l: 'K線型態', v: analysis.pattern, c: sColor },
              { l: '趨勢方向', v: analysis.trend,
                c: analysis.trend==='上漲'?'#22c55e':analysis.trend==='下跌'?'#ef4444':'#94a3b8' },
              { l: '操作信號', v: analysis.signal, c: sigColor(analysis.signal) },
              { l: '市場情緒', v: analysis.marketSentiment || '—',
                c: analysis.marketSentiment==='正面'?'#22c55e':analysis.marketSentiment==='負面'?'#ef4444':'#94a3b8' },
            ].map((x, i) => (
              <div key={i} style={{ background: '#090d1b', border: '1px solid #1e2d4d', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{x.l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: x.c }}>{x.v}</div>
              </div>
            ))}
          </div>

          {/* Computex + analyst rating badges */}
          {!analysis.error && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {analysis.computexCatalyst && (
                <div style={{ background: '#1e1b4b', border: '1px solid #818cf833', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>🎪 Computex關聯</div>
                  <div style={{ fontSize: 11, color: '#818cf8' }}>{analysis.computexCatalyst}</div>
                </div>
              )}
              {analysis.analystRating && analysis.analystRating !== '無評等' && (
                <div style={{ background: '#0f2b1e', border: '1px solid #22c55e33', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>📋 外資評等</div>
                  <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>{analysis.analystRating}</div>
                </div>
              )}
            </div>
          )}

          {/* Price targets */}
          {!analysis.error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
              {[
                { l: '建議進場', v: analysis.entry,    c: '#818cf8' },
                { l: '停損價',   v: analysis.stopLoss, c: '#ef4444' },
                { l: '目標價',   v: analysis.target,   c: '#22c55e' },
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

          {/* Analysis text + confidence */}
          <div style={{ background: '#090d1b', border: '1px solid #1e2d4d', borderRadius: 8, padding: 14, marginBottom: 0 }}>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 8 }}>
              {analysis.isLocal ? '📐 技術面 + 市場情境綜合分析（免費）' : '🤖 Claude AI 深度分析（整合市場消息）'}
            </div>
            <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, marginBottom: analysis.error ? 0 : 10 }}>
              {analysis.analysis}
            </div>
            {!analysis.error && (
              <>
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#475569', marginBottom: 8 }}>
                  <span>⏱ {analysis.timeframe}</span>
                  <span>⚠️ 風險：{analysis.risk}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#475569', minWidth: 30 }}>信心</span>
                  <div style={{ flex: 1, height: 6, background: '#1e2d4d', borderRadius: 3 }}>
                    <div style={{
                      width: `${analysis.confidence}%`, height: '100%', borderRadius: 3, transition: 'width 0.8s',
                      background: analysis.confidence>=70?'#22c55e':analysis.confidence>=50?'#f59e0b':'#ef4444',
                    }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 700 }}>{analysis.confidence}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 修正2：市場情境面板放在分析結果下方 ── */}
      <MarketNewsPanel sectorKey={sectorKey} stockCode={stock.code} />

    </div>
  )
}
