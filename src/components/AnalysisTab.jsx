// sectors passed via props
import { CANDLES_CACHE, calcMA, calcRSI } from '../services/stockApi.js'
import CandleChart from './CandleChart.jsx'

export default function AnalysisTab({ stock, sectorKey, allSectors, analysis, busy, onReanalyze }) {
  if (!stock) {
    return (
      <div style={{ textAlign: 'center', color: '#475569', padding: '70px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
        <div style={{ fontSize: 14, color: '#64748b' }}>從「市場概覽」選擇個股，點擊「AI 分析」</div>
        <div style={{ fontSize: 12, marginTop: 8, color: '#374151' }}>
          Claude AI 將分析 K 線型態、趨勢、支撐壓力與買賣信號
        </div>
      </div>
    )
  }

  const cs    = CANDLES_CACHE[stock.code]
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

  const sigColor = a =>
    a?.signal === '買入' ? '#22c55e' : a?.signal === '賣出' ? '#ef4444' : '#94a3b8'
  const sigBg = a =>
    a?.signal === '買入' ? '#0f2b1e' : a?.signal === '賣出' ? '#2b0f0f' : '#1e2d4d'
  const sigBorder = a =>
    a?.signal === '買入' ? '#22c55e44' : a?.signal === '賣出' ? '#ef444444' : '#1e2d4d'

  return (
    <div>
      {/* Stock header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#e2e8f0' }}>{stock.name}</span>
          <span style={{ fontSize: 12, color: '#475569', marginLeft: 8 }}>
            {stock.code} · {sec?.name}
          </span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#e2e8f0' }}>
          {last.close >= 1000 ? last.close.toFixed(0) : last.close.toFixed(1)}
        </span>
        <span style={{ fontSize: 12, color: up ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
          {up ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
        </span>

        {analysis && !analysis.error && (
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800,
            background: sigBg(analysis), color: sigColor(analysis),
            border: `1px solid ${sigBorder(analysis)}`,
          }}>
            {analysis.signal} {analysis.confidence}%
          </span>
        )}

        <button onClick={() => onReanalyze(stock, sectorKey)} style={{
          padding: '4px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
          fontFamily: 'inherit', background: '#151d35',
          border: '1px solid #1e2d4d', color: '#64748b', marginLeft: 'auto',
        }}>
          🔄 重新分析
        </button>
      </div>

      {/* MA strip */}
      <div style={{ display: 'flex', gap: 16, fontSize: 11, marginBottom: 6 }}>
        {[
          { label: 'MA5',  val: ma5,  period: 5  },
          { label: 'MA10', val: ma10, period: 10 },
          { label: 'MA20', val: ma20, period: 20 },
          { label: 'RSI',  val: rsi14, isRsi: true },
        ].map(({ label, val, isRsi }) => {
          const aboveMA = !isRsi && val && last.close > val
          const rsiColor = isRsi
            ? val > 70 ? '#ef4444' : val < 30 ? '#22c55e' : '#94a3b8'
            : aboveMA ? '#22c55e' : '#ef4444'
          return (
            <span key={label} style={{ color: rsiColor }}>
              {label}: {val?.toFixed(1)}
              {isRsi && (val > 70 ? ' 超買' : val < 30 ? ' 超賣' : '')}
            </span>
          )
        })}
      </div>

      {/* Chart */}
      <div style={{ background: '#090d1b', borderRadius: 10, padding: 10, marginBottom: 12 }}>
        <CandleChart candles={cs} h={200} />
      </div>

      {busy && (
        <div style={{ textAlign: 'center', color: '#818cf8', padding: '28px 0', fontSize: 13 }}>
          ⏳ Claude AI 正在深度分析 K 線型態...
        </div>
      )}

      {analysis && !busy && (
        <div>
          {/* Pattern / Trend / Signal */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { l: 'K線型態', v: analysis.pattern, c: sColor },
              { l: '趨勢',   v: analysis.trend,
                c: analysis.trend === '上漲' ? '#22c55e' : analysis.trend === '下跌' ? '#ef4444' : '#94a3b8' },
              { l: '操作',   v: analysis.signal, c: sigColor(analysis) },
            ].map((x, i) => (
              <div key={i} style={{
                background: '#090d1b', border: '1px solid #1e2d4d',
                borderRadius: 8, padding: '10px 12px',
              }}>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{x.l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: x.c }}>{x.v}</div>
              </div>
            ))}
          </div>

          {/* Price targets */}
          {!analysis.error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
              {[
                { l: '建議進場', v: analysis.entry,    c: '#818cf8' },
                { l: '停損價',   v: analysis.stopLoss, c: '#ef4444' },
                { l: '目標價',   v: analysis.target,   c: '#22c55e' },
              ].map((x, i) => (
                <div key={i} style={{
                  background: '#090d1b', border: '1px solid #1e2d4d',
                  borderRadius: 8, padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{x.l}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: x.c, fontVariantNumeric: 'tabular-nums' }}>
                    {typeof x.v === 'number'
                      ? (x.v >= 100 ? x.v.toFixed(1) : x.v.toFixed(2))
                      : x.v || '—'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Analysis text + confidence */}
          <div style={{ background: '#090d1b', border: '1px solid #1e2d4d', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 8 }}>🤖 Claude AI 技術分析</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 10 }}>
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
                  <div style={{ flex: 1, height: 5, background: '#1e2d4d', borderRadius: 3 }}>
                    <div style={{
                      width: `${analysis.confidence}%`, height: '100%',
                      borderRadius: 3, transition: 'width 0.8s',
                      background: (analysis.confidence || 0) >= 70 ? '#22c55e'
                        : (analysis.confidence || 0) >= 50 ? '#f59e0b' : '#ef4444',
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 30 }}>
                    {analysis.confidence}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
