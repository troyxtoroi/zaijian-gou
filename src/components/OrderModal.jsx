import { useState } from 'react'

const LS_CAPITAL = 'zaijian_capital'

export function getCapital() {
  try { return +localStorage.getItem(LS_CAPITAL) || 500000 } catch { return 500000 }
}
export function setCapitalLS(val) {
  try { localStorage.setItem(LS_CAPITAL, val) } catch {}
}

export default function OrderModal({ sig, cash, onBuy, onClose }) {
  const [shares,    setShares]    = useState(1000)
  const [manualQty, setManualQty] = useState('')
  const [manualEntry, setManualEntry] = useState('')

  const entry  = parseFloat(manualEntry) || sig.price
  const qty    = parseInt(manualQty) || shares
  const cost   = entry * qty
  const ok     = cost <= cash && qty > 0

  const stopL  = sig.analysis?.stopLoss
  const target = sig.analysis?.target
  const rr     = target && stopL && entry
    ? Math.abs((target - entry) / (entry - stopL)).toFixed(2)
    : null
  const maxLoss   = stopL ? Math.round(Math.abs(entry - stopL) * qty) : null
  const maxProfit = target ? Math.round(Math.abs(target - entry) * qty) : null

  const fmtP = p => p >= 1000 ? p.toFixed(0) : p >= 100 ? p.toFixed(1) : p.toFixed(2)
  const BD = '1px solid #1e2d4d'

  return (
    <div style={{ position:'fixed',inset:0,zIndex:60,background:'rgba(0,0,0,0.85)',
      display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#0b0f1e',border:'1px solid #0abab555',borderRadius:14,
        padding:24,width:340,maxWidth:'94vw' }}>

        {/* 標題 */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4 }}>
          <span style={{ fontSize:16,fontWeight:800,color:'#e2e8f0' }}>💹 虛擬下單</span>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'#475569',fontSize:20,cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize:12,color:'#64748b',marginBottom:16 }}>
          <span style={{ color:'#e2e8f0',fontWeight:700 }}>{sig.stock.name}</span>
          <span style={{ marginLeft:8 }}>{sig.stock.code}</span>
          {sig.analysis?.confidence && (
            <span style={{ marginLeft:8,color:'#818cf8' }}>信心 {sig.analysis.confidence}%</span>
          )}
        </div>

        {/* 進場/停損/目標 */}
        <div style={{ background:'#090d1b',borderRadius:8,padding:'10px 14px',marginBottom:14 }}>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:11,color:'#475569' }}>
            <span>建議進場</span><span>停損價</span><span>目標價</span>
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',fontSize:15,fontWeight:900,fontVariantNumeric:'tabular-nums' }}>
            <span style={{ color:'#818cf8' }}>{fmtP(sig.price)}</span>
            <span style={{ color:'#22c55e' }}>{stopL ? fmtP(stopL) : '—'}</span>
            <span style={{ color:'#ef4444' }}>{target ? fmtP(target) : '—'}</span>
          </div>
          {rr && (
            <div style={{ marginTop:6,fontSize:11,textAlign:'center',color: +rr >= 2 ? '#0abab5' : '#f59e0b' }}>
              報酬風險比 1 : {rr} {+rr >= 2 ? '✅ 良好' : +rr >= 1 ? '⚠️ 尚可' : '❌ 差'}
            </div>
          )}
        </div>

        {/* 可用餘額 */}
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:12 }}>
          <span style={{ color:'#475569' }}>可用資金</span>
          <span style={{ color:'#e2e8f0',fontWeight:700,fontVariantNumeric:'tabular-nums' }}>
            NT$ {Math.round(cash).toLocaleString('zh-TW')}
          </span>
        </div>

        {/* 自訂進場價 */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11,color:'#475569',marginBottom:5 }}>進場價格（可調整）</div>
          <input type="number" value={manualEntry}
            onChange={e => setManualEntry(e.target.value)}
            placeholder={`${fmtP(sig.price)}（分析建議）`}
            style={{ width:'100%',padding:'8px 12px',fontSize:14,background:'#151d35',
              border:BD,borderRadius:8,color:'#e2e8f0',outline:'none',
              boxSizing:'border-box',fontVariantNumeric:'tabular-nums' }} />
        </div>

        {/* 股數選擇 */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11,color:'#475569',marginBottom:5 }}>買入數量（股）</div>
          <div style={{ display:'flex',gap:6,marginBottom:8 }}>
            {[1000,2000,5000,10000].map(n => (
              <button key={n} onClick={() => { setShares(n); setManualQty('') }} style={{
                flex:1,padding:'6px 0',fontSize:11,borderRadius:6,cursor:'pointer',fontFamily:'inherit',
                background: (manualQty ? parseInt(manualQty) : shares) === n ? '#0abab522' : '#151d35',
                border: `1px solid ${(manualQty ? parseInt(manualQty) : shares) === n ? '#0abab5' : '#1e2d4d'}`,
                color:   (manualQty ? parseInt(manualQty) : shares) === n ? '#0abab5' : '#64748b',
                fontWeight: (manualQty ? parseInt(manualQty) : shares) === n ? 700 : 400,
              }}>{n/1000}張</button>
            ))}
          </div>
          <input type="number" value={manualQty}
            onChange={e => setManualQty(e.target.value)}
            placeholder={`自訂股數（目前：${qty} 股）`}
            style={{ width:'100%',padding:'7px 12px',fontSize:13,background:'#151d35',
              border:BD,borderRadius:8,color:'#e2e8f0',outline:'none',
              boxSizing:'border-box',fontVariantNumeric:'tabular-nums' }} />
        </div>

        {/* 預估成本 & 最大損益 */}
        <div style={{ background:'#090d1b',borderRadius:8,padding:'10px 14px',marginBottom:16 }}>
          {[
            { l:'預估成本',   v:`NT$ ${Math.round(cost).toLocaleString('zh-TW')}`, c: ok ? '#e2e8f0' : '#ef4444' },
            { l:'最大虧損',   v: maxLoss   ? `-NT$ ${maxLoss.toLocaleString('zh-TW')}`   : '—', c:'#22c55e' },
            { l:'目標獲利',   v: maxProfit ? `+NT$ ${maxProfit.toLocaleString('zh-TW')}` : '—', c:'#ef4444' },
          ].map((x,i) => (
            <div key={i} style={{ display:'flex',justifyContent:'space-between',
              marginBottom:i<2?6:0,fontSize:12 }}>
              <span style={{ color:'#475569' }}>{x.l}</span>
              <span style={{ color:x.c,fontWeight:700,fontVariantNumeric:'tabular-nums' }}>{x.v}</span>
            </div>
          ))}
          {!ok && cost > cash && (
            <div style={{ fontSize:11,color:'#ef4444',marginTop:6,textAlign:'center' }}>
              ⚠️ 成本超過可用資金 NT${(cost - cash).toLocaleString('zh-TW')}
            </div>
          )}
        </div>

        {/* 確認按鈕 */}
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={onClose} style={{
            flex:1,padding:'10px',fontSize:13,borderRadius:8,cursor:'pointer',fontFamily:'inherit',
            background:'#151d35',border:BD,color:'#94a3b8',
          }}>取消</button>
          <button onClick={() => ok && onBuy(sig, qty, entry)} style={{
            flex:2,padding:'10px',fontSize:13,borderRadius:8,fontFamily:'inherit',fontWeight:800,
            cursor:ok?'pointer':'not-allowed',
            background: ok ? '#062020' : '#151d35',
            border: `1px solid ${ok ? '#0abab555' : '#1e2d4d'}`,
            color: ok ? '#0abab5' : '#475569',
          }}>
            {ok ? `✅ 確認買入 ${qty.toLocaleString()} 股` : '資金不足'}
          </button>
        </div>

        <div style={{ fontSize:10,color:'#374151',textAlign:'center',marginTop:10 }}>
          ⚠️ 虛擬下單，不涉及真實交易
        </div>
      </div>
    </div>
  )
}
