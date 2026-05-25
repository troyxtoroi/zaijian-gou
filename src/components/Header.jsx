import { INITIAL_CAPITAL, TARGET_CAPITAL } from '../data/sectors.js'

export default function Header({ totalValue, controls, loadProgress, allLoaded }) {
  const progress = Math.max(0, Math.min(100,
    (totalValue - INITIAL_CAPITAL) / (TARGET_CAPITAL - INITIAL_CAPITAL) * 100
  ))
  const up = totalValue >= INITIAL_CAPITAL

  return (
    <div style={{
      background: '#0f1628',
      borderBottom: '1px solid #1e2d4d',
      padding: '10px 16px',
    }}>
      {/* 主列：Logo + 按鈕 + 總資產 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>🐕</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.3px' }}>
              賺錢狗
            </div>
            <div style={{ fontSize: 9, color: '#475569' }}>自動看盤系統</div>
          </div>
        </div>

        {/* 載入進度條 */}
        {!allLoaded && loadProgress.total > 0 && (
          <div style={{ width: '100%', marginTop: 4 }}>
            <div style={{ height: 2, background: '#1e2d4d', borderRadius: 1 }}>
              <div style={{
                height: '100%', borderRadius: 1, background: '#818cf8',
                width: `${(loadProgress.done / loadProgress.total * 100).toFixed(0)}%`,
                transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>
              載入真實股價 {loadProgress.done}/{loadProgress.total}
            </div>
          </div>
        )}
        {allLoaded && (
          <div style={{ fontSize: 9, color: '#22c55e', marginTop: 2 }}>✅ 已連接 Yahoo Finance</div>
        )}

      {/* 控制按鈕（中間，自動換行）*/}
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
          {controls}
        </div>

        {/* 總資產（右側）*/}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: '#475569' }}>總資產</div>
          <div style={{
            fontSize: 16, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
            color: up ? '#ef4444' : '#22c55e',
          }}>
            NT$ {Math.round(totalValue).toLocaleString('zh-TW')}
          </div>
          <div style={{ width: 120, height: 4, background: '#1e2d4d', borderRadius: 2, marginTop: 4 }}>
            <div style={{
              width: `${progress}%`, height: '100%', borderRadius: 2,
              background: progress > 5 ? '#22c55e' : '#818cf8',
              transition: 'width 1s',
            }} />
          </div>
          <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>
            目標 5M · {progress.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  )
}
