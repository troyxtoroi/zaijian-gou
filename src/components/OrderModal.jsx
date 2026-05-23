import { useState } from 'react'

export default function OrderModal({ sig, cash, onBuy, onClose }) {
  const [shares, setShares] = useState(1000)
  const cost = sig.price * shares
  const ok   = cost <= cash
  const rr   = sig.analysis.target && sig.analysis.stopLoss
    ? ((sig.analysis.target - sig.price) / (sig.price - sig.analysis.stopLoss)).toFixed(2)
    : null

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#0f1628', border: '1px solid #22c55e33',
        borderRadius: 12, padding: 24, width: 310,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: '#e2e8f0' }}>
          ⚠️ 下單確認
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
          {sig.stock.name} ({sig.stock.code}) · AI 信心 {sig.analysis.confidence}%
        </div>

        {/* Price info */}
        <div style={{ background: '#090d1b', borderRadius: 8, padding: 12, marginBottom: 14 }}>
          {[
            { l: '買入價格', v: `${sig.price.toFixed(1)} 元`,                    c: '#e2e8f0' },
            { l: '建議停損', v: `${sig.analysis.stopLoss?.toFixed?.(1) || '—'} 元`, c: '#ef4444' },
            { l: '目標價格', v: `${sig.analysis.target?.toFixed?.(1) || '—'} 元`,   c: '#22c55e' },
            { l: '風險報酬', v: rr ? `1 : ${rr}` : '—',                         c: '#818cf8' },
          ].map((x, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: i < 3 ? 6 : 0, fontSize: 12,
            }}>
              <span style={{ color: '#64748b' }}>{x.l}</span>
              <span style={{ color: x.c, fontWeight: 700 }}>{x.v}</span>
            </div>
          ))}
        </div>

        {/* Share selector */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>選擇股數</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[100, 500, 1000, 2000].map(n => (
              <button key={n} onClick={() => setShares(n)} style={{
                flex: 1, padding: '7px 0', fontSize: 11, borderRadius: 6,
                cursor: 'pointer', fontFamily: 'inherit',
                background: shares === n ? '#22c55e22' : '#151d35',
                border: `1px solid ${shares === n ? '#22c55e' : '#1e2d4d'}`,
                color: shares === n ? '#22c55e' : '#64748b',
                fontWeight: shares === n ? 700 : 400,
              }}>
                {n >= 1000 ? `${n / 1000}張` : n}
              </button>
            ))}
          </div>
          <div style={{
            fontSize: 11, textAlign: 'center', marginTop: 8,
            color: ok ? '#64748b' : '#ef4444',
          }}>
            預估成本 NT$ {Math.round(cost).toLocaleString('zh-TW')}
            {!ok && '（餘額不足）'}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '9px', fontSize: 13, borderRadius: 8,
            background: '#151d35', border: '1px solid #1e2d4d',
            color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            取消
          </button>
          <button onClick={() => ok && onBuy(sig, shares)} style={{
            flex: 2, padding: '9px', fontSize: 13, borderRadius: 8,
            fontFamily: 'inherit', fontWeight: 800,
            background: ok ? '#0f2b1e' : '#151d35',
            border: `1px solid ${ok ? '#22c55e' : '#1e2d4d'}`,
            color: ok ? '#22c55e' : '#475569',
            cursor: ok ? 'pointer' : 'not-allowed',
          }}>
            ✅ 確認買入
          </button>
        </div>

        <div style={{ fontSize: 10, color: '#374151', textAlign: 'center', marginTop: 12 }}>
          ⚠️ 本系統為輔助分析工具，投資人自負盈虧
        </div>
      </div>
    </div>
  )
}
