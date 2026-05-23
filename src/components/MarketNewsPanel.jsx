import { useState } from 'react'
import { MARKET_CONTEXT, getStockRating } from '../data/marketContext.js'

export default function MarketNewsPanel({ sectorKey, stockCode }) {
  const [expanded, setExpanded] = useState(false)
  const sec = MARKET_CONTEXT.sectors[sectorKey]
  const rating = stockCode ? getStockRating(stockCode) : null
  const computex = MARKET_CONTEXT.computex2026
  if (!sec) return null

  const scoreColor = s => s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444'
  const sentimentBg = s => s >= 8 ? '#0f2b1e' : s >= 6 ? '#2b1f0f' : '#2b0f0f'

  return (
    <div style={{
      background: '#090d1b', border: '1px solid #1e2d4d',
      borderRadius: 10, padding: 14, marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>🌐 市場情境分析</span>
          <span style={{
            padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
            background: sentimentBg(sec.score), color: scoreColor(sec.score),
            border: `1px solid ${scoreColor(sec.score)}44`,
          }}>
            {sec.outlook} {sec.score}/10
          </span>
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{
          fontSize: 11, color: '#475569', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>{expanded ? '▲ 收起' : '▼ 展開詳情'}</button>
      </div>

      {/* Computex countdown */}
      <div style={{
        background: '#1e1b4b', border: '1px solid #818cf844',
        borderRadius: 8, padding: '8px 12px', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>🎪</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8' }}>
            Computex 2026 · {computex.date} · 主題「{computex.theme}」
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
            黃仁勳 Rubin發表 · 蘇姿丰已抵台 · Intel/Qualcomm/Arm CEO齊聚 · {computex.marketImpact.slice(0, 35)}
          </div>
        </div>
      </div>

      {/* Analyst rating */}
      {rating && (
        <div style={{
          background: '#0f2b1e', border: '1px solid #22c55e33',
          borderRadius: 8, padding: '8px 12px', marginBottom: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>外資/券商評等</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>{rating.rating}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{rating.broker}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>目標價</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#22c55e', fontVariantNumeric: 'tabular-nums' }}>
              NT$ {rating.target.toLocaleString('zh-TW')}
            </div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{rating.note.slice(0, 20)}</div>
          </div>
        </div>
      )}

      {/* Catalysts quick view */}
      <div style={{ marginBottom: expanded ? 10 : 0 }}>
        <div style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>📈 主要催化劑</div>
        {sec.catalysts.slice(0, expanded ? undefined : 2).map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: 11 }}>
            <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>
            <span style={{ color: '#94a3b8', lineHeight: 1.4 }}>{c}</span>
          </div>
        ))}
        {!expanded && sec.catalysts.length > 2 && (
          <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
            ...還有 {sec.catalysts.length - 2} 項催化劑
          </div>
        )}
      </div>

      {expanded && (
        <>
          {/* Risk */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>⚠️ 主要風險</div>
            <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
              <span style={{ color: '#ef4444', flexShrink: 0 }}>!</span>
              <span style={{ color: '#94a3b8' }}>{sec.keyRisk}</span>
            </div>
          </div>

          {/* Global demand */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>🌍 全球AI需求</div>
            {Object.entries(MARKET_CONTEXT.globalDemand).map(([region, d]) => (
              <div key={region} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#64748b', minWidth: 30 }}>
                  {region === 'us' ? '🇺🇸' : region === 'europe' ? '🇪🇺' : region === 'japan' ? '🇯🇵' : region === 'korea' ? '🇰🇷' : '🇨🇳'}
                </span>
                <div style={{ flex: 1, height: 4, background: '#1e2d4d', borderRadius: 2 }}>
                  <div style={{ width: `${d.score * 10}%`, height: '100%', borderRadius: 2,
                    background: d.score >= 8 ? '#22c55e' : d.score >= 6 ? '#f59e0b' : '#94a3b8' }} />
                </div>
                <span style={{ fontSize: 10, color: '#64748b', minWidth: 20 }}>{d.score}/10</span>
              </div>
            ))}
          </div>

          {/* Computex events */}
          <div>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>📅 Computex 重要事件</div>
            {computex.keyEvents.slice(0, 4).map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 11 }}>
                <span style={{ color: '#818cf8', fontWeight: 700, minWidth: 28, fontVariantNumeric: 'tabular-nums' }}>{e.date}</span>
                <span style={{ color: '#94a3b8', lineHeight: 1.4 }}>{e.event}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ fontSize: 9, color: '#374151', marginTop: 8, textAlign: 'right' }}>
        資料更新：{MARKET_CONTEXT.lastUpdate}
      </div>
    </div>
  )
}
