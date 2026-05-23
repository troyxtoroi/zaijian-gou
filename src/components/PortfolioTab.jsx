import { CANDLES_CACHE } from '../services/stockApi.js'

export default function PortfolioTab({ holdings, cash, onSell }) {
  const rows = holdings.map(h => {
    const cs    = CANDLES_CACHE[h.code]
    const price = cs ? cs[cs.length - 1].close : h.buyPrice
    const pnl   = (price - h.buyPrice) * h.shares
    const pct   = (price - h.buyPrice) / h.buyPrice * 100
    return { ...h, price, pnl, pct }
  })

  const holdVal  = rows.reduce((s, r) => s + r.price * r.shares, 0)
  const totalPnl = rows.reduce((s, r) => s + r.pnl, 0)

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { l: '可用現金',   v: `NT$${Math.round(cash).toLocaleString('zh-TW')}`,    c: '#818cf8' },
          { l: '持股市值',   v: `NT$${Math.round(holdVal).toLocaleString('zh-TW')}`, c: '#22c55e' },
          { l: '未實現損益', v: `${totalPnl >= 0 ? '+' : ''}NT$${Math.round(totalPnl).toLocaleString('zh-TW')}`,
            c: totalPnl >= 0 ? '#22c55e' : '#ef4444' },
        ].map((x, i) => (
          <div key={i} style={{
            background: '#0d1224', border: '1px solid #1e2d4d',
            borderRadius: 8, padding: '10px 12px',
          }}>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{x.l}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: x.c, fontVariantNumeric: 'tabular-nums' }}>
              {x.v}
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#475569', padding: '50px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💼</div>
          <div>尚無持倉</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>從「交易信號」頁面確認下單後，持倉會顯示在此</div>
        </div>
      ) : (
        rows.map((h, i) => (
          <div key={i} style={{
            background: '#151d35', border: '1px solid #1e2d4d',
            borderRadius: 10, padding: 14, marginBottom: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0' }}>{h.name}</span>
                <span style={{ fontSize: 11, color: '#475569', marginLeft: 6 }}>
                  {h.code} × {h.shares.toLocaleString()} 股
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 15, fontWeight: 900,
                  color: h.pnl >= 0 ? '#22c55e' : '#ef4444',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {h.pnl >= 0 ? '+' : ''}{Math.round(h.pnl).toLocaleString('zh-TW')} 元
                </div>
                <div style={{ fontSize: 11, color: h.pct >= 0 ? '#22c55e' : '#ef4444' }}>
                  {h.pct >= 0 ? '+' : ''}{h.pct.toFixed(2)}%
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#475569', marginBottom: 10 }}>
              <span>成本 {h.buyPrice.toFixed(1)}</span>
              <span>現價 {h.price.toFixed(1)}</span>
              {h.stop   && <span style={{ color: '#ef444488' }}>停損 {h.stop?.toFixed?.(1)}</span>}
              {h.target && <span style={{ color: '#22c55e88' }}>目標 {h.target?.toFixed?.(1)}</span>}
            </div>

            <button onClick={() => onSell(h)} style={{
              width: '100%', padding: '7px', fontSize: 12, borderRadius: 6,
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
              background: '#2b0f0f', border: '1px solid #ef444455', color: '#ef4444',
            }}>
              市價賣出
            </button>
          </div>
        ))
      )}
    </div>
  )
}
