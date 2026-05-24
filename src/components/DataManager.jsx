import { useState, useEffect } from 'react'

// 所有可能的舊鍵名（歷史版本）
const ALL_KEYS = [
  'zaijian_custom_sectors','zaijian_custom_stocks','zaijian_builtin_extras',
  'zaijian_backup','zaijian_api_key','zaijian_alerts',
]

export default function DataManager({ exportData, importData, diagnose,
  customSectors, customStockInfo, builtinExtras, onClose }) {
  const [mode,      setMode]      = useState('recover')
  const [lsData,    setLsData]    = useState({})
  const [importTxt, setImportTxt] = useState('')
  const [result,    setResult]    = useState(null)
  const [quickList, setQuickList] = useState([])

  // 掃描 localStorage 的所有資料
  useEffect(() => {
    const found = {}
    // 掃描所有 localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      try {
        const val = localStorage.getItem(key)
        found[key] = val
      } catch {}
    }
    setLsData(found)

    // 建立快速清單：把所有找到的股票列出來
    const stocks = []
    Object.values(found).forEach(raw => {
      try {
        const parsed = JSON.parse(raw)
        // customStockInfo 格式：{ code: { code, name, base, otc } }
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          Object.entries(parsed).forEach(([k, v]) => {
            if (v?.code && v?.name) stocks.push({ code: v.code, name: v.name, base: v.base, otc: v.otc })
          })
        }
        // backup 格式
        if (parsed?.stockInfo) {
          Object.values(parsed.stockInfo).forEach(v => {
            if (v?.code && v?.name) stocks.push({ code: v.code, name: v.name })
          })
        }
      } catch {}
    })
    setQuickList([...new Map(stocks.map(s => [s.code, s])).values()])
  }, [])

  const totalFound   = Object.keys(customStockInfo || {}).length
  const backupExists = !!lsData['zaijian_backup']

  const fmtP = p => p >= 1000 ? p.toFixed(0) : p >= 100 ? p.toFixed(1) : p.toFixed(2)
  const BD   = '1px solid #1e2d4d'

  const handleImport = () => {
    if (!importTxt.trim()) { setResult({ ok:false, msg:'請貼上 JSON 資料' }); return }
    const r = importData(importTxt)
    setResult(r)
    if (r.ok) setTimeout(() => { onClose(); location.reload() }, 1500)
  }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:70,background:'rgba(0,0,0,0.88)',
      display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#0b0f1e',border:BD,borderRadius:14,padding:24,
        width:480,maxWidth:'96vw',maxHeight:'90vh',overflowY:'auto' }}>

        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
          <span style={{ fontSize:15,fontWeight:800,color:'#e2e8f0' }}>🔍 自選股資料救援</span>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'#475569',fontSize:20,cursor:'pointer' }}>✕</button>
        </div>

        {/* 狀態 */}
        <div style={{ padding:'10px 14px',borderRadius:8,marginBottom:14,fontSize:12,lineHeight:1.7,
          background: totalFound > 0 ? '#0f2b1e' : '#2b0f0f',
          border: `1px solid ${totalFound > 0 ? '#22c55e44' : '#ef444444'}`,
          color: totalFound > 0 ? '#94a3b8' : '#94a3b8' }}>
          {totalFound > 0
            ? `✅ 目前記憶體中找到 ${totalFound} 檔自選股資料（可能是你的！）`
            : '❌ 目前記憶體中找不到自選股資料'}
          {backupExists && <div style={{ color:'#0abab5',marginTop:4 }}>💾 找到備份資料，可嘗試還原</div>}
          {quickList.length > 0 && <div style={{ color:'#818cf8',marginTop:4 }}>🗃️ localStorage 掃描到 {quickList.length} 筆股票資訊</div>}
        </div>

        {/* 模式切換 */}
        <div style={{ display:'flex',gap:6,marginBottom:14 }}>
          {[
            { k:'recover', l:'🚑 自動還原' },
            { k:'import',  l:'📥 貼上備份' },
            { k:'scan',    l:'🔍 掃描結果' },
          ].map(m=>(
            <button key={m.k} onClick={()=>{setMode(m.k);setResult(null)}} style={{
              flex:1,padding:'7px',fontSize:11,borderRadius:8,cursor:'pointer',fontFamily:'inherit',
              background:mode===m.k?'#1e2d4d':'transparent',
              border:`1px solid ${mode===m.k?'#818cf8':'#1e2d4d'}`,
              color:mode===m.k?'#818cf8':'#64748b',fontWeight:mode===m.k?700:400,
            }}>{m.l}</button>
          ))}
        </div>

        {/* 自動還原 */}
        {mode === 'recover' && (
          <div>
            {backupExists ? (
              <>
                <div style={{ fontSize:12,color:'#94a3b8',marginBottom:10 }}>
                  找到備份資料！點擊下方還原：
                </div>
                <button onClick={() => {
                  try {
                    const b = JSON.parse(localStorage.getItem('zaijian_backup'))
                    if (b) {
                      const r = importData(JSON.stringify({ version:2, ...b,
                        customSectors: b.sectors, customStockInfo: b.stockInfo,
                        builtinExtras: b.extras }))
                      setResult(r)
                      if (r.ok) setTimeout(() => { onClose(); location.reload() }, 1500)
                    }
                  } catch(e) { setResult({ ok:false, msg:'備份資料格式錯誤：'+e.message }) }
                }} style={{
                  width:'100%',padding:'12px',fontSize:14,borderRadius:8,cursor:'pointer',
                  fontFamily:'inherit',fontWeight:800,
                  background:'#0f2b1e',border:'1px solid #22c55e55',color:'#22c55e',marginBottom:10,
                }}>🔄 從備份還原</button>
              </>
            ) : (
              <div style={{ fontSize:12,color:'#64748b',marginBottom:12,lineHeight:1.6 }}>
                未找到自動備份。請開啟瀏覽器開發者工具確認：<br/>
                按 F12 → Console → 輸入以下指令：<br/>
                <code style={{ background:'#151d35',padding:'6px 10px',borderRadius:6,display:'block',marginTop:6,fontSize:11,color:'#818cf8' }}>
                  JSON.stringify(Object.fromEntries([...Array(localStorage.length)].map((_,i)=>[localStorage.key(i),localStorage.getItem(localStorage.key(i))])))
                </code>
                <br/>把結果貼到「貼上備份」頁面
              </div>
            )}

            {/* 如果有掃描到股票，提供快速重建 */}
            {quickList.length > 0 && (
              <div>
                <div style={{ fontSize:11,color:'#475569',marginBottom:8 }}>
                  掃描到的股票資料（{quickList.length} 檔）：
                </div>
                <div style={{ maxHeight:200,overflowY:'auto',border:BD,borderRadius:8,marginBottom:10 }}>
                  {quickList.map(s => (
                    <div key={s.code} style={{ display:'flex',justifyContent:'space-between',
                      padding:'6px 12px',fontSize:12,borderBottom:'1px solid #0f1628' }}>
                      <span style={{ color:'#e2e8f0',fontWeight:700 }}>{s.name}</span>
                      <span style={{ color:'#475569',fontFamily:'monospace' }}>{s.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 貼上備份 */}
        {mode === 'import' && (
          <div>
            <div style={{ fontSize:12,color:'#94a3b8',marginBottom:8,lineHeight:1.6 }}>
              如果你有之前匯出的 JSON 備份，或從開發者工具複製的 localStorage 資料，請貼在下方：
            </div>
            <textarea
              placeholder="貼上 JSON 資料..."
              value={importTxt}
              onChange={e => setImportTxt(e.target.value)}
              rows={10}
              style={{ width:'100%',padding:'10px',fontSize:11,background:'#151d35',
                border:BD,borderRadius:8,color:'#e2e8f0',outline:'none',
                boxSizing:'border-box',fontFamily:'monospace',resize:'vertical',marginBottom:10 }}
            />
            <button onClick={handleImport} style={{
              width:'100%',padding:'10px',fontSize:13,borderRadius:8,cursor:'pointer',
              fontFamily:'inherit',fontWeight:700,
              background:'#1e2d4d',border:'1px solid #818cf8',color:'#818cf8',
            }}>📥 還原資料</button>
          </div>
        )}

        {/* 掃描結果 */}
        {mode === 'scan' && (
          <div>
            <div style={{ fontSize:11,color:'#475569',marginBottom:8 }}>
              localStorage 中找到 {Object.keys(lsData).length} 個鍵：
            </div>
            {Object.keys(lsData).length === 0
              ? <div style={{ fontSize:12,color:'#374151',textAlign:'center',padding:'20px' }}>localStorage 完全空白</div>
              : Object.entries(lsData).map(([k, v]) => (
                <div key={k} style={{ marginBottom:8,padding:'8px 10px',background:'#151d35',borderRadius:8,border:BD }}>
                  <div style={{ fontSize:11,color:'#818cf8',fontWeight:700,marginBottom:4 }}>{k}</div>
                  <div style={{ fontSize:10,color:'#64748b',wordBreak:'break-all',maxHeight:60,overflow:'hidden' }}>
                    {v?.slice(0, 200) || '(空)'}
                    {v?.length > 200 && '...'}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {result && (
          <div style={{ marginTop:12,padding:'10px 12px',borderRadius:8,fontSize:12,
            background:result.ok?'#0f2b1e':'#2b0f0f',
            border:`1px solid ${result.ok?'#22c55e44':'#ef444444'}`,
            color:result.ok?'#22c55e':'#ef4444' }}>
            {result.msg}
          </div>
        )}

        <div style={{ marginTop:16,paddingTop:12,borderTop:BD,display:'flex',gap:8 }}>
          <button onClick={() => {
            const json = exportData()
            navigator.clipboard.writeText(json).then(()=>setResult({ok:true,msg:'已複製到剪貼簿！請存到記事本備用'}))
          }} style={{ flex:1,padding:'8px',fontSize:11,borderRadius:8,cursor:'pointer',
            fontFamily:'inherit',background:'#151d35',border:BD,color:'#64748b' }}>
            📋 複製目前資料
          </button>
          <button onClick={() => {
            const json = exportData()
            const blob = new Blob([json], {type:'application/json'})
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `stocks-backup-${new Date().toISOString().slice(0,10)}.json`
            a.click()
          }} style={{ flex:1,padding:'8px',fontSize:11,borderRadius:8,cursor:'pointer',
            fontFamily:'inherit',background:'#151d35',border:BD,color:'#64748b' }}>
            💾 下載備份
          </button>
        </div>
      </div>
    </div>
  )
}
