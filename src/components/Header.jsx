import { INITIAL_CAPITAL, TARGET_CAPITAL } from '../data/sectors.js'

export default function Header({ totalValue }) {
  const progress = Math.max(0, Math.min(100,
    (totalValue - INITIAL_CAPITAL) / (TARGET_CAPITAL - INITIAL_CAPITAL) * 100
  ))
  const up = totalValue >= INITIAL_CAPITAL

  return (
    <div style={{
      background: '#0f1628',
      borderBottom: '1px solid #1e2d4d',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 26 }}>🐕</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px', color: '#e2e8f0' }}>
            賺錢狗 自動看盤系統
          </div>
          <div style={{ fontSize: 11, color: '#475569' }}>
            AI K線分析 · 台灣股市 · 六大熱門族群
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 10, color: '#475569' }}>總資產</div>
        <div style={{
          fontSize: 18, fontWeight: 900,
          color: up ? '#ef4444' : '#22c55e',
          fontVariantNumeric: 'tabular-nums',
        }}>
          NT$ {Math.round(totalValue).toLocaleString('zh-TW')}
        </div>

        <div style={{ width: 160, height: 5, background: '#1e2d4d', borderRadius: 3, marginTop: 5 }}>
          <div style={{
            width: `${progress}%`, height: '100%', borderRadius: 3,
            background: progress > 5 ? '#22c55e' : '#818cf8',
            transition: 'width 1s',
          }} />
        </div>
        <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
          目標 NT$5,000,000 · {progress.toFixed(3)}%
        </div>
      </div>
    </div>
  )
}
