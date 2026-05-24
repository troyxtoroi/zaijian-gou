/**
 * 熱門自選股快速加回面板
 * 分類顯示常見台股，一鍵快速加回
 */
import { useState } from 'react'
import { SECTORS } from '../data/sectors.js'

// 常用自選股清單（按族群）
const QUICK_STOCKS = {
  'AI伺服器': [
    {code:'2382',name:'廣達'},{code:'6669',name:'緯穎'},{code:'2376',name:'技嘉'},
    {code:'3231',name:'緯創'},{code:'2317',name:'鴻海'},{code:'2356',name:'英業達'},
    {code:'2357',name:'華碩'},{code:'2353',name:'宏碁'},{code:'2308',name:'台達電'},
  ],
  '半導體/IC設計': [
    {code:'2330',name:'台積電'},{code:'2454',name:'聯發科'},{code:'2303',name:'聯電'},
    {code:'3034',name:'聯詠'},{code:'2379',name:'瑞昱'},{code:'3443',name:'創意'},
    {code:'3661',name:'世芯-KY'},{code:'5274',name:'信驊'},{code:'4966',name:'譜瑞-KY'},
  ],
  '散熱/電源': [
    {code:'3017',name:'奇鋐'},{code:'3324',name:'雙鴻'},{code:'6230',name:'超眾'},
    {code:'3653',name:'健策'},{code:'8299',name:'群電'},{code:'3018',name:'同欣電'},
  ],
  '記憶體': [
    {code:'2408',name:'南亞科'},{code:'2344',name:'華邦電'},{code:'2337',name:'旺宏'},
    {code:'3260',name:'威剛'},{code:'5483',name:'中美晶'},
  ],
  '被動元件': [
    {code:'2327',name:'國巨'},{code:'2492',name:'華新科'},{code:'3026',name:'禾伸堂'},
    {code:'3624',name:'光頡'},
  ],
  '封裝測試': [
    {code:'3711',name:'日月光'},{code:'6239',name:'力成'},{code:'2449',name:'京元電'},
    {code:'2458',name:'義隆'},{code:'6515',name:'穎崴'},
  ],
  '低軌衛星/通訊': [
    {code:'3491',name:'昇達科'},{code:'2314',name:'台揚'},{code:'5371',name:'中光電'},
    {code:'4977',name:'眾達'},{code:'6285',name:'啟碁'},
  ],
  'PCB': [
    {code:'2313',name:'華通'},{code:'3037',name:'欣興'},{code:'2383',name:'台光電'},
    {code:'2367',name:'燿華'},{code:'3189',name:'景碩'},
  ],
  '光通訊/CPO': [
    {code:'3406',name:'玉晶光'},{code:'3588',name:'通嘉'},{code:'6274',name:'台燿'},
  ],
  '機器人/自動化': [
    {code:'2049',name:'上銀'},{code:'2059',name:'川湖'},{code:'4526',name:'東台精機'},
  ],
}

// 取得 sector keys（原有族群）
const BUILTIN_SECTOR_KEYS = Object.keys(SECTORS)

export default function QuickAddPanel({ onAddStock, onClose }) {
  const [selected,   setSelected]   = useState(new Set())
  const [targetSec,  setTargetSec]  = useState('ai')
  const [customSec,  setCustomSec]  = useState('')
  const [activeGrp,  setActiveGrp]  = useState('AI伺服器')
  const [adding,     setAdding]     = useState(false)
  const [done,       setDone]       = useState(false)

  const toggle = code => {
    setSelected(p => {
      const n = new Set(p)
      n.has(code) ? n.delete(code) : n.add(code)
      return n
    })
  }

  const selectAll = grp => {
    const codes = QUICK_STOCKS[grp].map(s => s.code)
    setSelected(p => {
      const n = new Set(p)
      codes.forEach(c => n.add(c))
      return n
    })
  }

  const handleAdd = async () => {
    if (!selected.size) return
    setAdding(true)
    const sectorId = customSec.trim() || targetSec
    const allStocks = Object.values(QUICK_STOCKS).flat()
    for (const code of selected) {
      const stock = allStocks.find(s => s.code === code)
      if (stock) {
        await onAddStock(sectorId, { code: stock.code, name: stock.name, base: 100 })
        await new Promise(r => setTimeout(r, 80))
      }
    }
    setAdding(false)
    setDone(true)
    setTimeout(() => onClose(), 1200)
  }

  const grps = Object.keys(QUICK_STOCKS)
  const BD = '1px solid #1e2d4d'

  if (done) {
    return (
      <div style={{ position:'fixed',inset:0,zIndex:70,background:'rgba(0,0,0,0.85)',
        display:'flex',alignItems:'center',justifyContent:'center' }}>
        <div style={{ background:'#0f2b1e',border:'1px solid #22c55e55',borderRadius:14,
          padding:32,textAlign:'center' }}>
          <div style={{ fontSize:36,marginBottom:12 }}>✅</div>
          <div style={{ fontSize:16,fontWeight:700,color:'#22c55e' }}>
            已加入 {selected.size} 檔股票！
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:70,background:'rgba(0,0,0,0.88)',
      display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#0b0f1e',border:BD,borderRadius:14,padding:0,
        width:520,maxWidth:'96vw',maxHeight:'90vh',display:'flex',flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px',borderBottom:BD,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15,fontWeight:800,color:'#e2e8f0' }}>⚡ 快速加回自選股</div>
            <div style={{ fontSize:11,color:'#475569',marginTop:2 }}>
              選好後一次加入，已選 <span style={{ color:'#818cf8',fontWeight:700 }}>{selected.size}</span> 檔
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'#475569',fontSize:20,cursor:'pointer' }}>✕</button>
        </div>

        {/* 族群 tabs */}
        <div style={{ display:'flex',gap:4,padding:'10px 14px',overflowX:'auto',borderBottom:BD,flexShrink:0 }}>
          {grps.map(g => (
            <button key={g} onClick={() => setActiveGrp(g)} style={{
              padding:'4px 10px',fontSize:11,borderRadius:16,cursor:'pointer',
              fontFamily:'inherit',whiteSpace:'nowrap',
              background:activeGrp===g?'#1e2d4d':'transparent',
              border:`1px solid ${activeGrp===g?'#818cf8':'#1e2d4d'}`,
              color:activeGrp===g?'#818cf8':'#64748b',
              fontWeight:activeGrp===g?700:400,
            }}>{g}</button>
          ))}
        </div>

        {/* 股票清單 */}
        <div style={{ flex:1,overflowY:'auto',padding:'10px 14px' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
            <span style={{ fontSize:11,color:'#475569' }}>{activeGrp}</span>
            <button onClick={() => selectAll(activeGrp)} style={{
              fontSize:10,color:'#818cf8',background:'none',border:'1px solid #818cf833',
              padding:'2px 8px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',
            }}>全選此分類</button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6 }}>
            {QUICK_STOCKS[activeGrp].map(s => {
              const sel = selected.has(s.code)
              return (
                <button key={s.code} onClick={() => toggle(s.code)} style={{
                  padding:'8px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',
                  textAlign:'left',border:`1px solid ${sel?'#818cf8':'#1e2d4d'}`,
                  background:sel?'#1e2d4d':'#151d35',
                  transition:'all 0.1s',
                }}>
                  <div style={{ fontSize:12,fontWeight:700,color:sel?'#818cf8':'#e2e8f0' }}>{s.name}</div>
                  <div style={{ fontSize:10,color:'#475569',fontFamily:'monospace' }}>{s.code}</div>
                  {sel && <div style={{ fontSize:9,color:'#818cf8',marginTop:2 }}>✓ 已選</div>}
                </button>
              )
            })}
          </div>
        </div>

        {/* 加入到哪個族群 */}
        <div style={{ padding:'10px 14px',borderTop:BD }}>
          <div style={{ fontSize:11,color:'#475569',marginBottom:6 }}>加入到哪個族群？</div>
          <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:8 }}>
            {[
              {id:'ai',name:'🤖 AI相關'},{id:'memory',name:'💾 記憶體'},
              {id:'thermal',name:'🌡️ 散熱'},{id:'satellite',name:'🛰️ 衛星'},
              {id:'passive',name:'⚡ 被動元件'},{id:'packaging',name:'📦 封裝'},
            ].map(s => (
              <button key={s.id} onClick={() => { setTargetSec(s.id); setCustomSec('') }} style={{
                padding:'4px 10px',fontSize:11,borderRadius:16,cursor:'pointer',fontFamily:'inherit',
                background:targetSec===s.id&&!customSec?'#1e2d4d':'transparent',
                border:`1px solid ${targetSec===s.id&&!customSec?'#818cf8':'#1e2d4d'}`,
                color:targetSec===s.id&&!customSec?'#818cf8':'#64748b',
              }}>{s.name}</button>
            ))}
          </div>
          <input placeholder="或輸入自訂分類名稱（留空=加到上方選的族群）"
            value={customSec} onChange={e => setCustomSec(e.target.value)}
            style={{ width:'100%',padding:'7px 10px',fontSize:12,background:'#151d35',
              border:BD,borderRadius:8,color:'#e2e8f0',outline:'none',boxSizing:'border-box' }} />
        </div>

        {/* 確認加入 */}
        <div style={{ padding:'12px 14px',borderTop:BD }}>
          <button onClick={handleAdd} disabled={!selected.size || adding} style={{
            width:'100%',padding:'11px',fontSize:14,borderRadius:8,cursor:selected.size?'pointer':'not-allowed',
            fontFamily:'inherit',fontWeight:800,
            background:selected.size?'#1e2d4d':'#151d35',
            border:`1px solid ${selected.size?'#818cf8':'#1e2d4d'}`,
            color:selected.size?'#818cf8':'#475569',
          }}>
            {adding ? `⏳ 加入中...` : `✅ 加入選取的 ${selected.size} 檔股票`}
          </button>
        </div>
      </div>
    </div>
  )
}
