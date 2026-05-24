export default function SignalsTab({ signals, onOrder }) {
  if (!signals.length) {
    return (
      <div style={{ textAlign: 'center', color: '#475569', padding: '70px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🔔</div>
        <div style={{ fontSize: 14 }}>尚無交易信號</div>
        <div style={{ fontSize: 12, marginTop: 8 }}>
          分析個股後，AI 買入信號（信心度 ≥ 60%）將自動出現在此
        </div>
      </div>
    )
  }

  return (
    <div>
      {signals.map(sig => (
        <div key={sig.id} style={{
          background: '#151d35',
          border: `1px solid ${sig.done ? '#1e2d4d' : '#22c55e22'}`,
          borderRadius: 10, padding: 14, marginBottom: 10,
          opacity: sig.done ? 0.5 : 1,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0' }}>{sig.stock.name}</span>
              <span style={{ fontSize: 11, color: '#475569', marginLeft: 6 }}>{sig.stock.code}</span>
              <span style={{
                marginLeft: 8, padding: '2px 8px', borderRadius: 12, fontSize: 11,
                background: '#062020', color: '#0abab5',
                border: '1px solid #0abab555', fontWeight: 700,
              }}>
                {sig.analysis.signal}
              </span>
              {sig.done && (
                <span style={{ marginLeft: 6, fontSize: 11, color: '#475569' }}>已執行</span>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#e2e8f0' }}>
                {sig.price.toFixed(1)}
              </div>
              <div style={{ fontSize: 10, color: '#475569' }}>
                {sig.time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, fontSize: 11, margin: '8px 0' }}>
            <span style={{ color: '#818cf8' }}>進場 {sig.analysis.entry?.toFixed?.(1) || '—'}</span>
            <span style={{ color: '#22c55e' }}>停損 {sig.analysis.stopLoss?.toFixed?.(1) || '—'}</span>
            <span style={{ color: '#ef4444' }}>目標 {sig.analysis.target?.toFixed?.(1) || '—'}</span>
            <span style={{ color: '#64748b' }}>信心 {sig.analysis.confidence}%</span>
          </div>

          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: sig.done ? 0 : 10 }}>
            {sig.analysis.analysis}
          </div>

          {!sig.done && (
            <button onClick={() => onOrder(sig)} style={{
              width: '100%', padding: '8px', fontSize: 13, borderRadius: 7,
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800,
              background: '#062020', border: '1px solid #0abab555', color: '#0abab5',
            }}>
              🛒 確認下單
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
