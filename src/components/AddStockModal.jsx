import { useState } from 'react'
import { SECTORS } from '../data/sectors.js'

const PRESET_TAGS = ['⭐','🔥','💡','📈','🎯','💎','🚀','⚡','🌙','🏆']

export default function AddStockModal({ customSectors, onAddStock, onAddSector, onClose }) {
  const [mode,       setMode]       = useState('stock')   // 'stock' | 'sector'
  const [code,       setCode]       = useState('')
  const [stockName,  setStockName]  = useState('')
  const [sectorId,   setSectorId]   = useState(customSectors[0]?.id || '')
  const [newSecName, setNewSecName] = useState('')
  const [newSecTag,  setNewSecTag]  = useState('⭐')
  const [err,        setErr]        = useState('')
  const [loading,    setLoading]    = useState(false)

  // All available sectors to add stock into
  const allSectors = [
    ...Object.entries(SECTORS).map(([k, s]) => ({ id: k, name: s.name, tag: s.tag })),
    ...customSectors,
  ]

  async function tryFetchName(c) {
    if (!c || c.length < 4) return
    setLoading(true)
    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${c}.TW?interval=1d&range=5d`
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const meta = data.chart?.result?.[0]?.meta
      if (meta) {
        const name = meta.longName || meta.shortName || ''
        // Strip ".TW" suffix and common suffixes
        const clean = name.replace(/\s*(Co\.|Corp\.|Ltd\.|Inc\.|Corporation).*/i, '').trim()
        if (clean && !stockName) setStockName(clean.slice(0, 8))
      }
    } catch {}
    setLoading(false)
  }

  function submitStock() {
    const c = code.trim().replace(/[^0-9a-zA-Z]/g, '')
    if (!c) { setErr('請輸入股票代號'); return }
    if (!sectorId) { setErr('請選擇分類'); return }
    const name = stockName.trim() || c
    onAddStock(sectorId, { code: c, name, base: 100 })
    onClose()
  }

  function submitSector() {
    if (!newSecName.trim()) { setErr('請輸入分類名稱'); return }
    onAddSector(newSecName.trim(), newSecTag)
    onClose()
  }

  const BD = '1px solid #1e2d4d'
  const CARD = { background: '#0f1628', border: BD, borderRadius: 10, padding: 14, marginBottom: 10 }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#0b0f1e', border: BD, borderRadius: 14,
        padding: 24, width: 360, maxWidth: '92vw',
      }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { k: 'stock',  label: '+ 新增自選股' },
            { k: 'sector', label: '+ 新增分類'   },
          ].map(t => (
            <button key={t.k} onClick={() => { setMode(t.k); setErr('') }} style={{
              flex: 1, padding: '8px', fontSize: 13, borderRadius: 8,
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: mode === t.k ? 700 : 400,
              background: mode === t.k ? '#1e2d4d' : 'transparent',
              border: `1px solid ${mode === t.k ? '#818cf8' : '#1e2d4d'}`,
              color: mode === t.k ? '#818cf8' : '#64748b',
            }}>{t.label}</button>
          ))}
        </div>

        {mode === 'stock' && (
          <div>
            {/* Stock code */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>股票代號</div>
              <input
                placeholder="例：2330（台積電）"
                value={code}
                onChange={e => { setCode(e.target.value); setErr('') }}
                onBlur={() => tryFetchName(code.trim())}
                onKeyDown={e => e.key === 'Enter' && tryFetchName(code.trim())}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 14,
                  background: '#151d35', border: BD, borderRadius: 8,
                  color: '#e2e8f0', outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            {/* Stock name */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                股票名稱 {loading && <span style={{ color: '#818cf8' }}>（查詢中...）</span>}
              </div>
              <input
                placeholder="自動帶入，或手動輸入"
                value={stockName}
                onChange={e => { setStockName(e.target.value); setErr('') }}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 14,
                  background: '#151d35', border: BD, borderRadius: 8,
                  color: '#e2e8f0', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Sector selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>加入分類</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {allSectors.map(s => (
                  <button key={s.id} onClick={() => setSectorId(s.id)} style={{
                    padding: '5px 11px', fontSize: 12, borderRadius: 20,
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: sectorId === s.id ? '#818cf822' : '#151d35',
                    border: `1px solid ${sectorId === s.id ? '#818cf8' : '#1e2d4d'}`,
                    color: sectorId === s.id ? '#818cf8' : '#64748b',
                    fontWeight: sectorId === s.id ? 700 : 400,
                  }}>
                    {s.tag} {s.name}
                  </button>
                ))}
              </div>
            </div>

            {err && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 10 }}>{err}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{
                flex: 1, padding: '9px', fontSize: 13, borderRadius: 8,
                background: '#151d35', border: BD, color: '#94a3b8',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>取消</button>
              <button onClick={submitStock} style={{
                flex: 2, padding: '9px', fontSize: 13, borderRadius: 8,
                background: '#1e2d4d', border: '1px solid #818cf8',
                color: '#818cf8', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
              }}>✅ 加入自選</button>
            </div>
          </div>
        )}

        {mode === 'sector' && (
          <div>
            {/* Sector name */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>分類名稱</div>
              <input
                placeholder="例：我的最愛、航運股"
                value={newSecName}
                onChange={e => { setNewSecName(e.target.value); setErr('') }}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 14,
                  background: '#151d35', border: BD, borderRadius: 8,
                  color: '#e2e8f0', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Tag selector */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>選擇圖示</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PRESET_TAGS.map(t => (
                  <button key={t} onClick={() => setNewSecTag(t)} style={{
                    width: 38, height: 38, fontSize: 18, borderRadius: 8,
                    cursor: 'pointer', border: `2px solid ${newSecTag === t ? '#818cf8' : '#1e2d4d'}`,
                    background: newSecTag === t ? '#818cf822' : '#151d35',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            {err && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 10 }}>{err}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{
                flex: 1, padding: '9px', fontSize: 13, borderRadius: 8,
                background: '#151d35', border: BD, color: '#94a3b8',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>取消</button>
              <button onClick={submitSector} style={{
                flex: 2, padding: '9px', fontSize: 13, borderRadius: 8,
                background: '#1e2d4d', border: '1px solid #818cf8',
                color: '#818cf8', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
              }}>✅ 建立分類</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
