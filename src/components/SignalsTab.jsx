import { C, sigColor } from '../utils/colors.js'

export default function SignalsTab({ signals, onOrder }) {
  if (!signals.length) {
    return (
      <div style={{ textAlign: 'center', color: '#475569', padding: '70px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🔔</div>
        <div style={{ fontSize: 14 }}>尚無交易信號</div>
        <div style={{ fontSize: 12, marginTop: 8, color: '#374151' }}>
          信號條件：<strong style={{ color: '#e2e8f0' }}>相對低點</strong> ＋ <strong style={{ color: '#e2e8f0' }}>具備2根漲停潛力</strong><br/>
          比一般信號更嚴格，確保在低點買入、高點獲利
        </div>
      </div>
    )
  }

  const fmtP = p => p >= 1000 ? p.toFixed(0) : p >= 100 ? p.toFixed(1) : p.toFixed(2)

  return (
    <div>
      {/* 信號說明 */}
      <div style={{
        padding: '8px 12px', marginBottom: 12, borderRadius: 8, fontSize: 11,
        background: '#1e1b4b', border: '1px solid #818cf833', color: '#94a3b8',
      }}>
        🎯 信號條件：<span style={{ color: C.buy }}>相對低點（近20日底部30%）</span> ＋ <span style={{ color: C.up }}>至少2根漲停潛力</span> ＋ <span style={{ color: '#818cf8' }}>多方K線型態</span>
      </div>

      {signals.map(sig => {
        const la = sig.analysis
        const rrRatio = la.target && la.stopLoss && la.entry ?
          Math.abs(la.target - la.entry) / Math.abs(la.entry - la.stopLoss) : 0

        return (
          <div key={sig.id} style={{
            background: '#151d35',
            border: `1px solid ${sig.done ? '#1e2d4d' : la.limitUpSignal ? '#ef444433' : '#22c55e22'}`,
            borderRadius: 12, padding: 16, marginBottom: 12,
            opacity: sig.done ? 0.5 : 1,
          }}>
            {/* 標題列 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#e2e8f0' }}>{sig.stock.name}</span>
                <span style={{ fontSize: 11, color: '#475569', marginLeft: 8 }}>{sig.stock.code}</span>
                {/* 漲停信號標記 */}
                {la.limitUpSignal && (
                  <span style={{
                    marginLeft: 8, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 900,
                    background: '#2b0a0a', color: C.up, border: `1px solid ${C.up}44`,
                  }}>🚀 漲停潛力</span>
                )}
                <span style={{
                  marginLeft: 6, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                  background: '#062020', color: C.buy, border: `1px solid ${C.buyBorder}`,
                }}>{la.signal}</span>
                {sig.done && <span style={{ marginLeft: 6, fontSize: 11, color: '#475569' }}>已執行</span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#e2e8f0' }}>
                  {fmtP(sig.price)}
                </div>
                <div style={{ fontSize: 10, color: '#475569' }}>
                  {sig.time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* 分析說明 */}
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 10 }}>
              {la.analysis}
            </div>

            {/* 漲停潛力指標 */}
            {la.limitUpInfo && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>漲停潛力評估</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {Object.entries(la.limitUpInfo.signals || {}).map(([k, v]) => {
                    const labels = {
                      highVolatility: '高波動', macdTurnBull: 'MACD翻多', kdGoldenCross: 'KD金叉',
                      strongSector: '強族群', volumeBreakout: '放量突破', highUpside: '目標價高',
                      deepRebound: '跌深反彈', breakout: '突破壓力',
                    }
                    return (
                      <span key={k} style={{
                        padding: '2px 7px', borderRadius: 12, fontSize: 10,
                        background: v ? C.upBg : '#151d35',
                        border: `1px solid ${v ? C.up + '55' : '#1e2d4d'}`,
                        color: v ? C.up : '#475569',
                        fontWeight: v ? 700 : 400,
                      }}>
                        {v ? '✓' : '✗'} {labels[k] || k}
                      </span>
                    )
                  })}
                </div>
                <div style={{ marginTop: 6, fontSize: 11 }}>
                  <span style={{ color: '#64748b' }}>漲停條件 </span>
                  <span style={{ color: (la.limitUpInfo.points >= 4 ? C.up : la.limitUpInfo.points >= 2 ? '#f59e0b' : C.down), fontWeight: 700 }}>
                    {la.limitUpInfo.points}/8 項
                  </span>
                  <span style={{ color: '#64748b', marginLeft: 8 }}>波動率 </span>
                  <span style={{ color: (la.limitUpInfo.atrPct > 0.05 ? C.up : '#94a3b8'), fontWeight: 700 }}>
                    {((la.limitUpInfo.atrPct || 0) * 100).toFixed(1)}%
                  </span>
                  {la.limitUpInfo.can2LimitUp && (
                    <span style={{ marginLeft: 8, color: C.up, fontWeight: 700 }}>🔥 符合2根漲停條件</span>
                  )}
                </div>
              </div>
            )}

            {/* 低點資訊 */}
            {la.lowInfo && (
              <div style={{ marginBottom: 10, fontSize: 11, color: '#64748b' }}>
                📍 相對位置：近20日 <span style={{ color: la.lowInfo.pct < 0.3 ? C.down : '#94a3b8', fontWeight: 700 }}>
                  {(la.lowInfo.pct * 100).toFixed(0)}% </span>
                （底部30%以內才發信號）
                <span style={{ marginLeft: 8, color: la.lowInfo.isLow ? C.down : '#475569' }}>
                  {la.lowInfo.isLow ? '✅ 相對低點' : '❌ 非低點'}
                </span>
              </div>
            )}

            {/* 進場/停損/目標 */}
            <div style={{ display: 'flex', gap: 12, fontSize: 11, marginBottom: 12 }}>
              <span style={{ color: '#818cf8' }}>進場 {fmtP(la.entry)}</span>
              <span style={{ color: C.down }}>停損 {fmtP(la.stopLoss)}</span>
              <span style={{ color: C.up }}>目標 {fmtP(la.target)}</span>
              {rrRatio > 0 && (
                <span style={{ color: rrRatio >= 2 ? C.buy : '#f59e0b', fontWeight: 700 }}>
                  RR 1:{rrRatio.toFixed(1)}{rrRatio >= 2 ? ' ✅' : ''}
                </span>
              )}
              <span style={{ color: '#475569' }}>信心 {la.confidence}%</span>
            </div>

            {/* 信心度條 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ height: 4, background: '#1e2d4d', borderRadius: 2 }}>
                <div style={{
                  width: `${la.confidence}%`, height: '100%', borderRadius: 2,
                  background: la.confidence >= 75 ? C.buy : la.confidence >= 60 ? '#f59e0b' : C.sell,
                  transition: 'width 0.5s',
                }} />
              </div>
            </div>

            {!sig.done && (
              <button onClick={() => onOrder(sig)} style={{
                width: '100%', padding: '10px', fontSize: 13, borderRadius: 8,
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800,
                background: '#062020', border: `1px solid ${C.buyBorder}`, color: C.buy,
              }}>
                🛒 確認下單
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
