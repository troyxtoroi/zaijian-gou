import { CANDLES_CACHE } from '../services/stockApi.js'
import { C } from '../utils/colors.js'

export default function PortfolioTab({ holdings, cash, totalCapital, onSell, onSetCapital }) {
  const totalValue = cash + holdings.reduce((s, h) => {
    const cs = CANDLES_CACHE[h.code]
    return s + (cs ? cs[cs.length-1].close : h.buyPrice) * h.shares
  }, 0)
  const totalPnl     = totalValue - totalCapital
  const totalPnlPct  = totalCapital > 0 ? totalPnl / totalCapital * 100 : 0
  const fmtP = p => p >= 1000 ? p.toFixed(0) : p >= 100 ? p.toFixed(1) : p.toFixed(2)
  const fmtN = n => n >= 0 ? `+NT$${Math.round(n).toLocaleString('zh-TW')}` : `-NT$${Math.round(Math.abs(n)).toLocaleString('zh-TW')}`
  const BD = '1px solid #1e2d4d'

  return (
    <div>
      {/* 資產概覽 */}
      <div style={{ background:'#090d1b',border:BD,borderRadius:10,padding:16,marginBottom:14 }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12 }}>
          {[
            { l:'總資產',   v:`NT$ ${Math.round(totalValue).toLocaleString('zh-TW')}`, c:'#e2e8f0' },
            { l:'可用資金', v:`NT$ ${Math.round(cash).toLocaleString('zh-TW')}`,       c:'#818cf8' },
            { l:'總損益',   v:fmtN(totalPnl),
              c: totalPnl >= 0 ? '#ef4444' : '#22c55e' },
          ].map((x,i) => (
            <div key={i} style={{ textAlign: i===2 ? 'right' : i===1 ? 'center' : 'left' }}>
              <div style={{ fontSize:10,color:'#475569',marginBottom:3 }}>{x.l}</div>
              <div style={{ fontSize:13,fontWeight:800,color:x.c,fontVariantNumeric:'tabular-nums' }}>{x.v}</div>
            </div>
          ))}
        </div>

        {/* 設定本金 */}
        <div style={{ borderTop:BD,paddingTop:10 }}>
          <div style={{ fontSize:11,color:'#475569',marginBottom:6 }}>
            💰 設定可用資金（本金）
            <span style={{ color:'#374151',marginLeft:8,fontSize:10 }}>重設後持倉不影響</span>
          </div>
          <div style={{ display:'flex',gap:8 }}>
            {[100000,300000,500000,1000000,3000000,5000000].map(amt => (
              <button key={amt} onClick={() => onSetCapital(amt)} style={{
                flex:1,padding:'5px 2px',fontSize:10,borderRadius:6,cursor:'pointer',fontFamily:'inherit',
                background: Math.round(totalCapital) === amt ? '#818cf822' : '#151d35',
                border: `1px solid ${Math.round(totalCapital) === amt ? '#818cf8' : '#1e2d4d'}`,
                color: Math.round(totalCapital) === amt ? '#818cf8' : '#64748b',
                fontWeight: Math.round(totalCapital) === amt ? 700 : 400,
              }}>
                {amt >= 1000000 ? `${amt/1000000}M` : `${amt/1000}K`}
              </button>
            ))}
          </div>
          <div style={{ display:'flex',gap:8,marginTop:8 }}>
            <input type="number" placeholder="自訂金額（例：800000）"
              id="custom-capital"
              style={{ flex:1,padding:'7px 12px',fontSize:12,background:'#151d35',
                border:BD,borderRadius:6,color:'#e2e8f0',outline:'none',
                fontVariantNumeric:'tabular-nums' }} />
            <button onClick={() => {
              const v = parseInt(document.getElementById('custom-capital').value)
              if (v > 0) onSetCapital(v)
            }} style={{
              padding:'7px 14px',fontSize:12,borderRadius:6,cursor:'pointer',fontFamily:'inherit',
              background:'#1e2d4d',border:'1px solid #818cf855',color:'#818cf8',fontWeight:700,
            }}>設定</button>
          </div>
        </div>
      </div>

      {/* 持倉列表 */}
      {holdings.length === 0 ? (
        <div style={{ textAlign:'center',color:'#475569',padding:'50px 0' }}>
          <div style={{ fontSize:36,marginBottom:10 }}>📂</div>
          <div style={{ fontSize:14 }}>尚無持倉</div>
          <div style={{ fontSize:12,marginTop:6,color:'#374151' }}>
            在「個股分析」或「交易信號」頁點擊下單即可加入
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize:12,color:'#475569',marginBottom:10 }}>
            持倉 {holdings.length} 筆
          </div>
          {holdings.map(h => {
            const cs    = CANDLES_CACHE[h.code]
            const cur   = cs ? cs[cs.length-1].close : h.buyPrice
            const pnl   = (cur - h.buyPrice) * h.shares
            const pnlPct = (cur - h.buyPrice) / h.buyPrice * 100
            const up    = pnl >= 0
            const stopHit   = h.stop   && cur <= h.stop
            const targetHit = h.target && cur >= h.target

            // 進度（止損到目標之間的位置）
            const range = h.target && h.stop ? h.target - h.stop : 0
            const progress = range > 0 ? Math.max(0, Math.min(100, (cur - h.stop) / range * 100)) : 50

            return (
              <div key={h.uid} style={{
                background:'#151d35',borderRadius:10,padding:14,marginBottom:10,
                border: `1px solid ${stopHit ? '#22c55e55' : targetHit ? '#ef444455' : '#1e2d4d'}`,
              }}>
                {/* Header */}
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:10 }}>
                  <div>
                    <span style={{ fontSize:15,fontWeight:800,color:'#e2e8f0' }}>{h.name}</span>
                    <span style={{ fontSize:11,color:'#475569',marginLeft:8 }}>{h.code}</span>
                    {stopHit   && <span style={{ marginLeft:8,fontSize:10,color:'#22c55e',fontWeight:700 }}>⚠️ 觸及停損</span>}
                    {targetHit && <span style={{ marginLeft:8,fontSize:10,color:'#ef4444',fontWeight:700 }}>🎯 達到目標</span>}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:16,fontWeight:900,fontVariantNumeric:'tabular-nums',color:'#e2e8f0' }}>
                      {fmtP(cur)}
                    </div>
                    <div style={{ fontSize:11,color:up?'#ef4444':'#22c55e',fontWeight:700 }}>
                      {up?'▲':'▼'} {Math.abs(pnlPct).toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* 持倉詳情 */}
                <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:10 }}>
                  {[
                    { l:'成本',   v:`${fmtP(h.buyPrice)}` },
                    { l:'股數',   v:`${h.shares.toLocaleString()}股` },
                    { l:'停損',   v: h.stop   ? fmtP(h.stop)   : '—', c:'#22c55e' },
                    { l:'目標',   v: h.target ? fmtP(h.target) : '—', c:'#ef4444' },
                  ].map((x,i) => (
                    <div key={i} style={{ background:'#090d1b',borderRadius:6,padding:'6px 8px' }}>
                      <div style={{ fontSize:9,color:'#475569',marginBottom:2 }}>{x.l}</div>
                      <div style={{ fontSize:12,fontWeight:700,color:x.c||'#e2e8f0',fontVariantNumeric:'tabular-nums' }}>{x.v}</div>
                    </div>
                  ))}
                </div>

                {/* 損益進度條（停損 → 目標）*/}
                {h.stop && h.target && (
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',fontSize:9,color:'#475569',marginBottom:3 }}>
                      <span>停損 {fmtP(h.stop)}</span>
                      <span>目標 {fmtP(h.target)}</span>
                    </div>
                    <div style={{ height:6,background:'#1e2d4d',borderRadius:3,position:'relative' }}>
                      <div style={{
                        width:`${progress}%`,height:'100%',borderRadius:3,
                        background: progress > 60 ? '#ef4444' : progress > 30 ? '#f59e0b' : '#22c55e',
                        transition:'width 0.5s',
                      }} />
                      <div style={{
                        position:'absolute',top:'50%',left:`${progress}%`,
                        transform:'translate(-50%,-50%)',
                        width:10,height:10,borderRadius:'50%',background:'#e2e8f0',
                        border:'2px solid #0b0f1e',
                      }} />
                    </div>
                  </div>
                )}

                {/* 損益 */}
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <div>
                    <span style={{ fontSize:14,fontWeight:900,color:up?'#ef4444':'#22c55e',fontVariantNumeric:'tabular-nums' }}>
                      {fmtN(pnl)}
                    </span>
                    <span style={{ fontSize:11,color:'#475569',marginLeft:8 }}>
                      市值 NT${Math.round(cur*h.shares).toLocaleString('zh-TW')}
                    </span>
                  </div>
                  <button onClick={() => onSell(h)} style={{
                    padding:'6px 16px',fontSize:12,borderRadius:7,cursor:'pointer',fontFamily:'inherit',fontWeight:700,
                    background:'#2b0a00',border:'1px solid #f59e0b55',color:'#f59e0b',
                  }}>市價賣出</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
