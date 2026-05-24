import { useState } from 'react'

export default function DataManager({ exportData, importData, diagnose, customSectors, customStockInfo, builtinExtras, onClose }) {
  const [mode,    setMode]    = useState('export') // 'export' | 'import' | 'debug'
  const [importTxt, setImportTxt] = useState('')
  const [result,  setResult]  = useState(null)

  const totalStocks = Object.keys(customStockInfo || {}).length
  const totalSectors = (customSectors || []).length
  const totalExtras  = Object.values(builtinExtras || {}).flat().length

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `zaijian-watchlist-${new Date().toISOString().slice(0,10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(exportData()).then(() => setResult({ ok: true, msg: '已複製到剪貼簿' }))
  }

  const handleImport = () => {
    if (!importTxt.trim()) { setResult({ ok: false, msg: '請貼上 JSON 資料' }); return }
    const r = importData(importTxt)
    setResult(r)
    if (r.ok) setTimeout(() => onClose(), 1500)
  }

  const handleDiagnose = () => {
    const d = diagnose()
    setResult({
      ok: true,
      msg: `診斷結果：\n自訂族群 ${(d.customSectors||[]).length} 個\n自選股資訊 ${Object.keys(d.customStockInfo||{}).length} 筆\n加入原有族群 ${Object.values(d.builtinExtras||{}).flat().length} 筆\n備份時間：${d.backup?.ts ? new Date(d.backup.ts).toLocaleString('zh-TW') : '無備份'}`,
    })
  }

  const BD = '1px solid #1e2d4d'

  return (
    <div style={{ position:'fixed',inset:0,zIndex:70,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#0b0f1e',border:BD,borderRadius:14,padding:24,width:420,maxWidth:'94vw',maxHeight:'85vh',overflowY:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
          <span style={{ fontSize:15,fontWeight:800,color:'#e2e8f0' }}>📋 自選股管理</span>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'#475569',fontSize:20,cursor:'pointer' }}>✕</button>
        </div>

        {/* 狀態摘要 */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16 }}>
          {[
            { l:'自選股', v:`${totalStocks} 檔`, c:'#818cf8' },
            { l:'自訂分類', v:`${totalSectors} 個`, c:'#0abab5' },
            { l:'加入族群', v:`${totalExtras} 筆`, c:'#f59e0b' },
          ].map((x,i) => (
            <div key={i} style={{ background:'#151d35',border:BD,borderRadius:8,padding:'10px 12px',textAlign:'center' }}>
              <div style={{ fontSize:10,color:'#475569',marginBottom:4 }}>{x.l}</div>
              <div style={{ fontSize:16,fontWeight:900,color:x.c }}>{x.v}</div>
            </div>
          ))}
        </div>

        {/* 模式切換 */}
        <div style={{ display:'flex',gap:6,marginBottom:16 }}>
          {[{k:'export',l:'📤 匯出備份'},{k:'import',l:'📥 匯入還原'},{k:'debug',l:'🔍 診斷'}].map(m=>(
            <button key={m.k} onClick={()=>{setMode(m.k);setResult(null)}} style={{
              flex:1,padding:'7px',fontSize:11,borderRadius:8,cursor:'pointer',fontFamily:'inherit',
              background:mode===m.k?'#1e2d4d':'transparent',
              border:`1px solid ${mode===m.k?'#818cf8':'#1e2d4d'}`,
              color:mode===m.k?'#818cf8':'#64748b',fontWeight:mode===m.k?700:400,
            }}>{m.l}</button>
          ))}
        </div>

        {/* 匯出 */}
        {mode === 'export' && (
          <div>
            <div style={{ fontSize:12,color:'#94a3b8',marginBottom:12,lineHeight:1.6 }}>
              將你所有的自選股、分類和設定匯出成 JSON 檔案。<br/>
              建議定期備份，以防資料遺失。
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={handleExport} style={{
                flex:2,padding:'10px',fontSize:13,borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontWeight:700,
                background:'#1e2d4d',border:'1px solid #818cf8',color:'#818cf8',
              }}>💾 下載 JSON 檔案</button>
              <button onClick={handleCopy} style={{
                flex:1,padding:'10px',fontSize:13,borderRadius:8,cursor:'pointer',fontFamily:'inherit',
                background:'#151d35',border:BD,color:'#64748b',
              }}>📋 複製</button>
            </div>
          </div>
        )}

        {/* 匯入 */}
        {mode === 'import' && (
          <div>
            <div style={{ fontSize:12,color:'#94a3b8',marginBottom:8,lineHeight:1.6 }}>
              貼上之前匯出的 JSON 資料來還原自選股。<br/>
              <span style={{ color:'#ef4444' }}>⚠️ 此操作會覆蓋現有的自選股設定</span>
            </div>
            <textarea
              placeholder={'貼上 JSON 資料...\n範例：{"version":2,"customSectors":[...],"customStockInfo":{...},"builtinExtras":{...}}'}
              value={importTxt}
              onChange={e => setImportTxt(e.target.value)}
              rows={8}
              style={{
                width:'100%',padding:'10px',fontSize:11,background:'#151d35',border:BD,borderRadius:8,
                color:'#e2e8f0',outline:'none',boxSizing:'border-box',fontFamily:'monospace',
                resize:'vertical',marginBottom:10,
              }}
            />
            <button onClick={handleImport} style={{
              width:'100%',padding:'10px',fontSize:13,borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontWeight:700,
              background:'#1e2d4d',border:'1px solid #818cf8',color:'#818cf8',
            }}>📥 匯入還原</button>
          </div>
        )}

        {/* 診斷 */}
        {mode === 'debug' && (
          <div>
            <div style={{ fontSize:12,color:'#94a3b8',marginBottom:12 }}>
              檢查 localStorage 中的資料狀態，幫助找出資料遺失原因。
            </div>
            <button onClick={handleDiagnose} style={{
              width:'100%',padding:'10px',fontSize:13,borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontWeight:700,
              background:'#151d35',border:BD,color:'#94a3b8',marginBottom:10,
            }}>🔍 執行診斷</button>

            {/* 顯示目前資料 */}
            <div style={{ fontSize:11,color:'#475569',marginBottom:8 }}>目前記憶中的自選股：</div>
            {Object.entries(customStockInfo || {}).length === 0 ? (
              <div style={{ fontSize:12,color:'#374151',textAlign:'center',padding:'12px' }}>無自選股資料</div>
            ) : (
              <div style={{ maxHeight:200,overflowY:'auto' }}>
                {Object.entries(customStockInfo || {}).map(([code, info]) => (
                  <div key={code} style={{ display:'flex',justifyContent:'space-between',padding:'4px 8px',fontSize:12,borderBottom:'1px solid #0f1628' }}>
                    <span style={{ color:'#e2e8f0',fontWeight:600 }}>{info.name}</span>
                    <span style={{ color:'#475569',fontFamily:'monospace' }}>{code}</span>
                  </div>
                ))}
              </div>
            )}

            {Object.entries(builtinExtras || {}).some(([,v])=>v.length>0) && (
              <>
                <div style={{ fontSize:11,color:'#475569',margin:'10px 0 6px' }}>加入原有族群：</div>
                {Object.entries(builtinExtras || {}).filter(([,v])=>v.length>0).map(([k,v])=>(
                  <div key={k} style={{ fontSize:11,color:'#64748b',padding:'3px 8px' }}>
                    <span style={{ color:'#818cf8' }}>{k}：</span>{v.join(', ')}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* 結果顯示 */}
        {result && (
          <div style={{
            marginTop:12,padding:'10px 12px',borderRadius:8,fontSize:12,whiteSpace:'pre-line',
            background:result.ok?'#0f2b1e':'#2b0f0f',
            border:`1px solid ${result.ok?'#22c55e44':'#ef444444'}`,
            color:result.ok?'#22c55e':'#ef4444',
          }}>
            {result.msg}
          </div>
        )}
      </div>
    </div>
  )
}
