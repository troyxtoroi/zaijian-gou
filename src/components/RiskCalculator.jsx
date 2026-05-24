import { useState } from 'react'
import { C, sigColor } from '../utils/colors.js'

export default function RiskCalculator({ analysis, cash }) {
  const [capital,   setCapital]   = useState(cash || 100000)
  const [riskPct,   setRiskPct]   = useState(2)      // 每筆最大虧損 % of capital
  const [manualEntry, setManualEntry] = useState('')
  const [manualStop,  setManualStop]  = useState('')

  const entry    = parseFloat(manualEntry) || analysis?.entry    || 0
  const stopLoss = parseFloat(manualStop)  || analysis?.stopLoss || 0
  const target   = analysis?.target || 0

  const riskPerShare  = entry && stopLoss ? Math.abs(entry - stopLoss) : 0
  const maxRiskAmt    = capital * riskPct / 100
  const maxShares     = riskPerShare > 0 ? Math.floor(maxRiskAmt / riskPerShare / 1000) * 1000 : 0  // 整張
  const cost          = maxShares * entry
  const actualRisk    = maxShares * riskPerShare
  const potentialGain = target && maxShares ? maxShares * (target - entry) : 0
  const rrRatio       = potentialGain > 0 && actualRisk > 0 ? potentialGain / actualRisk : 0
  const isBuy         = !analysis || analysis.signal === '買入'

  const BD = '1px solid #1e2d4d'

  return (
    <div style={{ background: '#090d1b', border: BD, borderRadius: 10, padding: 14, marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>
        🧮 部位計算器 & 風險管理
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {/* 本金 */}
        <div>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>可用資金（元）</div>
          <input type="number" value={capital} onChange={e => setCapital(+e.target.value)}
            style={{ width: '100%', padding: '7px 10px', fontSize: 13, background: '#151d35', border: BD,
              borderRadius: 6, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box',
              fontVariantNumeric: 'tabular-nums' }}/>
        </div>

        {/* 風險 % */}
        <div>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>
            單筆最大虧損 {riskPct}% = NT${Math.round(capital * riskPct / 100).toLocaleString('zh-TW')}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 5].map(p => (
              <button key={p} onClick={() => setRiskPct(p)} style={{
                flex: 1, padding: '6px 0', fontSize: 11, borderRadius: 6, cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: riskPct === p ? 700 : 400,
                background: riskPct === p ? '#1e2d4d' : '#151d35',
                border: `1px solid ${riskPct === p ? '#818cf8' : '#1e2d4d'}`,
                color: riskPct === p ? '#818cf8' : '#64748b',
              }}>{p}%</button>
            ))}
          </div>
        </div>

        {/* 手動進場價 */}
        <div>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>
            進場價（空白=用分析建議 {entry.toFixed ? entry.toFixed(1) : '—'}）
          </div>
          <input type="number" placeholder={analysis?.entry?.toFixed(2) || '請輸入'}
            value={manualEntry} onChange={e => setManualEntry(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', fontSize: 13, background: '#151d35', border: BD,
              borderRadius: 6, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' }}/>
        </div>

        {/* 手動停損價 */}
        <div>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>
            停損價（空白=用分析建議 {stopLoss.toFixed ? stopLoss.toFixed(1) : '—'}）
          </div>
          <input type="number" placeholder={analysis?.stopLoss?.toFixed(2) || '請輸入'}
            value={manualStop} onChange={e => setManualStop(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', fontSize: 13, background: '#151d35', border: BD,
              borderRadius: 6, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' }}/>
        </div>
      </div>

      {/* 計算結果 */}
      {entry > 0 && stopLoss > 0 && (
        <div>
          {/* RR Ratio 視覺化 */}
          {rrRatio > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#475569' }}>報酬風險比</span>
                <span style={{
                  fontWeight: 800, fontSize: 13,
                  color: rrRatio >= 2 ? C.up : rrRatio >= 1 ? '#f59e0b' : C.down,
                }}>
                  1 : {rrRatio.toFixed(2)}
                  {rrRatio >= 3 ? ' 🔥 極佳' : rrRatio >= 2 ? ' ✅ 良好' : rrRatio >= 1 ? ' ⚠️ 尚可' : ' ❌ 差'}
                </span>
              </div>
              <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
                <div style={{ flex: 1, background: C.downBg, border: `1px solid ${C.down}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 8, color: C.down }}>風險</span>
                </div>
                {rrRatio >= 1 && (
                  <div style={{ flex: Math.min(rrRatio, 5), background: C.upBg, border: `1px solid ${C.up}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 8, color: C.up }}>報酬</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 計算結果卡片 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { l: '建議買入張數', v: `${maxShares.toLocaleString('zh-TW')} 股（${maxShares/1000}張）`, c: '#818cf8', big: true },
              { l: '預估成本',     v: `NT$${Math.round(cost).toLocaleString('zh-TW')}`, c: '#e2e8f0' },
              { l: '最大虧損',     v: `-NT$${Math.round(actualRisk).toLocaleString('zh-TW')}`, c: C.down },
              { l: '目標獲利',     v: potentialGain > 0 ? `+NT$${Math.round(potentialGain).toLocaleString('zh-TW')}` : '—', c: C.up },
            ].map((x, i) => (
              <div key={i} style={{ background: '#151d35', border: BD, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>{x.l}</div>
                <div style={{ fontSize: x.big ? 15 : 13, fontWeight: x.big ? 900 : 600, color: x.c, fontVariantNumeric: 'tabular-nums' }}>{x.v}</div>
              </div>
            ))}
          </div>

          {/* 風險提示 */}
          {maxShares === 0 && riskPerShare > 0 && (
            <div style={{ fontSize: 11, color: '#f59e0b', textAlign: 'center', padding: '8px', background: '#2b1e00', borderRadius: 6 }}>
              ⚠️ 資金不足以承受風險設定，請調高風險%或增加資金
            </div>
          )}
          {cost > capital && (
            <div style={{ fontSize: 11, color: C.down, textAlign: 'center', padding: '8px', background: C.downBg, borderRadius: 6 }}>
              ⚠️ 建議買入金額超過可用資金，建議減少張數
            </div>
          )}

          {/* 操作建議 */}
          {maxShares > 0 && riskPerShare > 0 && (
            <div style={{
              padding: '10px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.6,
              background: isBuy ? C.buyBg : '#2b1e00',
              border: `1px solid ${isBuy ? C.buyBorder : '#f59e0b44'}`,
              color: '#94a3b8',
            }}>
              <span style={{ color: isBuy ? C.buy : '#f59e0b', fontWeight: 700 }}>
                {isBuy ? '📋 建議操作' : '⚠️ 風險管理'}：
              </span>
              {isBuy
                ? ` 以 ${entry.toFixed(1)} 元買入 ${maxShares.toLocaleString()} 股（${maxShares/1000}張），停損設 ${stopLoss.toFixed(1)} 元，目標 ${target ? target.toFixed(1) + ' 元' : '持續觀察'}。單筆風險控制在資金 ${riskPct}%（NT$${Math.round(actualRisk).toLocaleString('zh-TW')}）。`
                : ` 謹慎評估，建議等待更確定的買入信號再進場。`
              }
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 9, color: '#374151', marginTop: 10, textAlign: 'right' }}>
        💡 專業建議：單筆風險勿超過總資金 2%，RR比建議 ≥ 2:1
      </div>
    </div>
  )
}
