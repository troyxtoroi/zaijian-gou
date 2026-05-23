import { useState } from 'react'
import { MARKET_CONTEXT, getStockRating } from '../data/marketContext.js'

// 找到最接近的內建族群（用於自訂族群的 fallback）
function resolveSectorKey(sectorKey) {
  const builtins = ['ai','memory','satellite','passive','thermal','packaging']
  if (builtins.includes(sectorKey)) return sectorKey
  // 自訂族群 → 顯示全域市場資訊（用 ai 當 fallback）
  return null
}

export default function MarketNewsPanel({ sectorKey, stockCode }) {
  const [expanded, setExpanded] = useState(false)
  const resolvedKey = resolveSectorKey(sectorKey)
  const sec         = resolvedKey ? MARKET_CONTEXT.sectors[resolvedKey] : null
  const rating      = stockCode ? getStockRating(stockCode) : null
  const computex    = MARKET_CONTEXT.computex2026
  const global      = MARKET_CONTEXT.global

  const scoreColor = s => s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444'
  const sentimentBg = s => s >= 8 ? '#0f2b1e' : s >= 6 ? '#2b1f0f' : '#2b0f0f'

  return (
    <div style={{
      background: '#090d1b', border: '1px solid #1e2d4d',
      borderRadius: 10, padding: 14, marginTop: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>🌐 市場情境分析</span>
          {sec && (
            <span style={{
              padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
              background: sentimentBg(sec.score), color: scoreColor(sec.score),
              border: `1px solid ${scoreColor(sec.score)}44`,
            }}>
              {sec.outlook} {sec.score}/10
            </span>
          )}
          {!sec && (
            <span style={{
              padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
              background: '#0f2b1e', color: '#22c55e', border: '1px solid #22c55e44',
            }}>
              整體市場 {global.sentiment}/10
            </span>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{
          fontSize: 11, color: '#475569', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>{expanded ? '▲ 收起' : '▼ 展開'}</button>
      </div>

      {/* Computex countdown — 永遠顯示 */}
      <div style={{
        background: '#1e1b4b', border: '1px solid #818cf844',
        borderRadius: 8, padding: '8px 12px', marginBottom: 10,
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🎪</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8' }}>
            Computex 2026 · {computex.date} · 「{computex.theme}」
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, lineHeight: 1.5 }}>
            黃仁勳 5/27抵台 → 6/1 Rubin/Feynman發表 ·
            蘇姿丰已抵台 · Intel/Qualcomm/Arm CEO齊聚 ·
            <span style={{ color: '#fbbf24' }}> {computex.marketImpact.slice(0, 28)}</span>
          </div>
        </div>
      </div>

      {/* 外資評等 — 有就顯示 */}
      {rating && (
        <div style={{
          background: '#0f2b1e', border: '1px solid #22c55e33',
          borderRadius: 8, padding: '10px 12px', marginBottom: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>📋 外資/券商評等</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#22c55e' }}>{rating.rating}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{rating.broker}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>{rating.note}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>目標價</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#22c55e', fontVariantNumeric: 'tabular-nums' }}>
              NT$ {rating.target.toLocaleString('zh-TW')}
            </div>
          </div>
        </div>
      )}

      {/* 族群催化劑 */}
      {sec && (
        <div style={{ marginBottom: expanded ? 10 : 0 }}>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>📈 族群催化劑</div>
          {sec.catalysts.slice(0, expanded ? undefined : 2).map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, fontSize: 11 }}>
              <span style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ color: '#94a3b8', lineHeight: 1.45 }}>{c}</span>
            </div>
          ))}
          {!expanded && sec.catalysts.length > 2 && (
            <button onClick={() => setExpanded(true)} style={{
              fontSize: 10, color: '#475569', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', marginTop: 2, padding: 0,
            }}>
              + 還有 {sec.catalysts.length - 2} 項催化劑
            </button>
          )}
        </div>
      )}

      {/* 展開後顯示更多 */}
      {expanded && (
        <>
          {sec && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#475569', marginBottom: 5 }}>⚠️ 主要風險</div>
              <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 6 }}>
                <span style={{ color: '#ef4444' }}>!</span>{sec.keyRisk}
              </div>
            </div>
          )}

          {/* 全球AI需求 */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>🌍 全球AI需求評分</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {Object.entries(MARKET_CONTEXT.globalDemand).map(([region, d]) => (
                <div key={region} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>
                    {region==='us'?'🇺🇸':region==='europe'?'🇪🇺':region==='japan'?'🇯🇵':region==='korea'?'🇰🇷':'🇨🇳'}
                  </span>
                  <div style={{ flex: 1, height: 4, background: '#1e2d4d', borderRadius: 2 }}>
                    <div style={{
                      width: `${d.score * 10}%`, height: '100%', borderRadius: 2,
                      background: d.score>=8?'#22c55e':d.score>=6?'#f59e0b':'#94a3b8',
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#64748b', minWidth: 22 }}>{d.score}/10</span>
                </div>
              ))}
            </div>
          </div>

          {/* Computex 日程 */}
          <div>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>📅 重要行程</div>
            {computex.keyEvents.slice(0, 5).map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 11 }}>
                <span style={{ color: '#818cf8', fontWeight: 700, minWidth: 30 }}>{e.date}</span>
                <span style={{ color: '#94a3b8', lineHeight: 1.4 }}>{e.event}</span>
              </div>
            ))}
          </div>

          {/* 全球多頭因子 */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>💡 市場多頭因子</div>
            {global.bullFactors.slice(0, 4).map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: 10 }}>
                <span style={{ color: '#22c55e', flexShrink: 0 }}>▲</span>
                <span style={{ color: '#94a3b8', lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ fontSize: 9, color: '#374151', marginTop: 10, textAlign: 'right' }}>
        資料更新：{MARKET_CONTEXT.lastUpdate} · 僅供參考，不構成投資建議
      </div>
    </div>
  )
}
