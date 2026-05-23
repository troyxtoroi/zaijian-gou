import { useState, useEffect, useRef } from 'react'
import { SECTORS } from '../data/sectors.js'
import { getNameByCode, getOTCByCode, searchByName } from '../data/twStockNames.js'

const PRESET_TAGS = ['⭐','🔥','💡','📈','🎯','💎','🚀','⚡','🌙','🏆']

async function fetchStockFromYahoo(code) {
  const proxies = [
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  ]
  for (const suffix of ['TW', 'TWO']) {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.${suffix}?interval=1d&range=5d`
    for (const makeProxy of proxies) {
      try {
        const res = await fetch(makeProxy(yahooUrl), { signal: AbortSignal.timeout(8000) })
        if (!res.ok) continue
        let text = await res.text()
        try { const w = JSON.parse(text); if (w.contents) text = w.contents } catch {}
        const data = JSON.parse(text)
        const result = data.chart?.result?.[0]
        if (!result) continue
        const closes = result.indicators.quote[0].close.filter(Boolean)
        if (!closes.length) continue
        return {
          price: +closes[closes.length - 1].toFixed(2),
          isOTC: suffix === 'TWO',
          rawName: result.meta.shortName || result.meta.longName || '',
        }
      } catch {}
    }
  }
  return null
}

export default function AddStockModal({ customSectors, onAddStock, onAddSector, onClose }) {
  const [mode,        setMode]        = useState('stock')
  const [code,        setCode]        = useState('')
  const [stockName,   setStockName]   = useState('')
  const [sectorId,    setSectorId]    = useState('')
  const [newSecName,  setNewSecName]  = useState('')
  const [newSecTag,   setNewSecTag]   = useState('⭐')
  const [err,         setErr]         = useState('')
  const [fetching,    setFetching]    = useState(false)
  const [fetchedInfo, setFetchedInfo] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const debounceRef = useRef(null)

  const allSectors = [
    ...Object.entries(SECTORS).map(([k, s]) => ({ id: k, name: s.name, tag: s.tag })),
    ...customSectors.map(s => ({ id: s.id, name: s.name, tag: s.tag })),
  ]
  useEffect(() => { if (!sectorId && allSectors.length) setSectorId(allSectors[0].id) }, [])

  const onCodeChange = val => {
    const clean = val.replace(/[^0-9]/g, '').slice(0, 6)
    setCode(clean); setFetchedInfo(null); setErr('')
    if (clean.length >= 4) {
      const local = getNameByCode(clean)
      if (local) setStockName(local)
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => doLookup(clean), 700)
    }
    setSuggestions([])
  }

  const onNameChange = val => {
    setStockName(val)
    if (val.length >= 1) setSuggestions(searchByName(val))
    else setSuggestions([])
  }

  const selectSuggestion = item => {
    setCode(item.code); setStockName(item.name); setSuggestions([])
    doLookup(item.code)
  }

  const doLookup = async c => {
    setFetching(true)
    const info = await fetchStockFromYahoo(c)
    if (info) {
      setFetchedInfo(info)
      if (!stockName || stockName === c) {
        const local = getNameByCode(c)
        if (local) setStockName(local)
        else if (info.rawName) setStockName(info.rawName.slice(0, 12))
      }
    } else {
      setErr('查無此股票，確認代號是否正確')
    }
    setFetching(false)
  }

  const submitStock = () => {
    const c = code.trim()
    if (!c || c.length < 4) { setErr('請輸入4位股票代號'); return }
    if (!sectorId)           { setErr('請選擇分類'); return }
    const name  = stockName.trim() || c
    const isOTC = fetchedInfo?.isOTC ?? getOTCByCode(c)
    const base  = fetchedInfo?.price ?? 100
    onAddStock(sectorId, { code: c, name, base, otc: isOTC })
    onClose()
  }

  const submitSector = () => {
    if (!newSecName.trim()) { setErr('請輸入分類名稱'); return }
    onAddSector(newSecName.trim(), newSecTag)
    onClose()
  }

  const BD = '1px solid #1e2d4d'
  const fmtP = p => p >= 1000 ? p.toFixed(0) : p >= 100 ? p.toFixed(1) : p.toFixed(2)

  return (
    <div style={{ position:'fixed',inset:0,zIndex:60,background:'rgba(0,0,0,0.82)',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#0b0f1e',border:BD,borderRadius:14,padding:24,width:380,maxWidth:'94vw',maxHeight:'90vh',overflowY:'auto' }}>
        {/* Mode tabs */}
        <div style={{ display:'flex',gap:8,marginBottom:20 }}>
          {[{k:'stock',label:'＋ 新增自選股'},{k:'sector',label:'＋ 新增分類'}].map(t=>(
            <button key={t.k} onClick={()=>{setMode(t.k);setErr('')}} style={{
              flex:1,padding:'8px',fontSize:13,borderRadius:8,cursor:'pointer',fontFamily:'inherit',
              fontWeight:mode===t.k?700:400,
              background:mode===t.k?'#1e2d4d':'transparent',
              border:`1px solid ${mode===t.k?'#818cf8':'#1e2d4d'}`,
              color:mode===t.k?'#818cf8':'#64748b',
            }}>{t.label}</button>
          ))}
        </div>

        {mode === 'stock' && (
          <div>
            {/* 代號輸入框 */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:'#64748b',marginBottom:6}}>
                股票代號
                <span style={{color:'#374151',marginLeft:6,fontSize:10}}>輸入後自動查詢名稱＆股價</span>
              </div>
              <div style={{position:'relative'}}>
                <input placeholder="例：2313"
                  value={code} onChange={e=>onCodeChange(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&code.length>=4&&doLookup(code)}
                  style={{
                    width:'100%',padding:'10px 12px',fontSize:15,
                    background:'#151d35',border:`1px solid ${err?'#ef4444':'#1e2d4d'}`,
                    borderRadius:8,color:'#e2e8f0',outline:'none',boxSizing:'border-box',
                    fontFamily:'monospace',letterSpacing:1,
                  }}/>
              </div>
              {fetching && <div style={{fontSize:11,color:'#818cf8',marginTop:5}}>⏳ 查詢 Yahoo Finance...</div>}
              {fetchedInfo && !fetching && (
                <div style={{
                  marginTop:6,padding:'8px 12px',borderRadius:8,
                  background:'#0f2b1e',border:'1px solid #22c55e33',
                  display:'flex',justifyContent:'space-between',alignItems:'center',
                }}>
                  <div>
                    <span style={{color:'#22c55e',fontWeight:700,fontSize:12}}>✅ 已取得即時股價</span>
                    <span style={{color:'#64748b',marginLeft:8,fontSize:11}}>{fetchedInfo.isOTC?'上櫃':'上市'}</span>
                  </div>
                  <span style={{color:'#e2e8f0',fontWeight:900,fontSize:16,fontVariantNumeric:'tabular-nums'}}>
                    NT$ {fmtP(fetchedInfo.price)}
                  </span>
                </div>
              )}
              {err && !fetching && <div style={{fontSize:12,color:'#ef4444',marginTop:5}}>{err}</div>}
            </div>

            {/* 中文名稱輸入框（含搜尋建議） */}
            <div style={{marginBottom:14,position:'relative'}}>
              <div style={{fontSize:11,color:'#64748b',marginBottom:6}}>
                中文名稱
                <span style={{color:'#374151',marginLeft:6,fontSize:10}}>或輸入中文搜尋股票</span>
              </div>
              <input placeholder="例：台積電 或搜尋中文"
                value={stockName} onChange={e=>onNameChange(e.target.value)}
                style={{
                  width:'100%',padding:'10px 12px',fontSize:14,
                  background:'#151d35',border:BD,borderRadius:8,
                  color:'#e2e8f0',outline:'none',boxSizing:'border-box',
                }}/>
              {suggestions.length>0 && (
                <div style={{
                  position:'absolute',top:'100%',left:0,right:0,zIndex:20,
                  background:'#0f1628',border:BD,borderRadius:8,marginTop:2,overflow:'hidden',
                  boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
                }}>
                  {suggestions.map(item=>(
                    <div key={item.code} onClick={()=>selectSuggestion(item)} style={{
                      padding:'9px 12px',cursor:'pointer',fontSize:13,
                      display:'flex',justifyContent:'space-between',alignItems:'center',
                    }}
                      onMouseOver={e=>e.currentTarget.style.background='#1e2d4d'}
                      onMouseOut={e=>e.currentTarget.style.background='transparent'}
                    >
                      <span style={{color:'#e2e8f0',fontWeight:700}}>{item.name}</span>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <span style={{color:'#64748b',fontSize:11}}>{item.otc?'上櫃':'上市'}</span>
                        <span style={{color:'#475569',fontFamily:'monospace',fontSize:12}}>{item.code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 族群選擇 */}
            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,color:'#64748b',marginBottom:8}}>加入分類</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {allSectors.map(s=>(
                  <button key={s.id} onClick={()=>setSectorId(s.id)} style={{
                    padding:'5px 11px',fontSize:12,borderRadius:20,cursor:'pointer',fontFamily:'inherit',
                    background:sectorId===s.id?'#818cf822':'#151d35',
                    border:`1px solid ${sectorId===s.id?'#818cf8':'#1e2d4d'}`,
                    color:sectorId===s.id?'#818cf8':'#64748b',
                    fontWeight:sectorId===s.id?700:400,
                  }}>{s.tag} {s.name}</button>
                ))}
              </div>
            </div>

            <div style={{display:'flex',gap:8}}>
              <button onClick={onClose} style={{flex:1,padding:'10px',fontSize:13,borderRadius:8,background:'#151d35',border:BD,color:'#94a3b8',cursor:'pointer',fontFamily:'inherit'}}>取消</button>
              <button onClick={submitStock} disabled={fetching} style={{
                flex:2,padding:'10px',fontSize:13,borderRadius:8,fontFamily:'inherit',fontWeight:700,
                cursor:fetching?'wait':'pointer',
                background:'#1e2d4d',border:'1px solid #818cf8',color:'#818cf8',
              }}>{fetching?'查詢中...':'✅ 加入自選'}</button>
            </div>
          </div>
        )}

        {mode === 'sector' && (
          <div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:'#64748b',marginBottom:6}}>分類名稱</div>
              <input placeholder="例：我的最愛、航運股、儲能"
                value={newSecName} onChange={e=>{setNewSecName(e.target.value);setErr('')}}
                style={{width:'100%',padding:'10px 12px',fontSize:14,background:'#151d35',border:BD,borderRadius:8,color:'#e2e8f0',outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:'#64748b',marginBottom:8}}>選擇圖示</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {PRESET_TAGS.map(t=>(
                  <button key={t} onClick={()=>setNewSecTag(t)} style={{
                    width:40,height:40,fontSize:18,borderRadius:8,cursor:'pointer',
                    border:`2px solid ${newSecTag===t?'#818cf8':'#1e2d4d'}`,
                    background:newSecTag===t?'#818cf822':'#151d35',
                  }}>{t}</button>
                ))}
              </div>
            </div>
            {err && <div style={{fontSize:12,color:'#ef4444',marginBottom:10}}>{err}</div>}
            <div style={{display:'flex',gap:8}}>
              <button onClick={onClose} style={{flex:1,padding:'10px',fontSize:13,borderRadius:8,background:'#151d35',border:BD,color:'#94a3b8',cursor:'pointer',fontFamily:'inherit'}}>取消</button>
              <button onClick={submitSector} style={{flex:2,padding:'10px',fontSize:13,borderRadius:8,fontFamily:'inherit',fontWeight:700,background:'#1e2d4d',border:'1px solid #818cf8',color:'#818cf8',cursor:'pointer'}}>✅ 建立分類</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
