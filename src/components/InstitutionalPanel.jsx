import { useState, useEffect } from 'react'
import { fetchInstitutional, fetchMarginBalance } from '../services/twseApi.js'
import { C } from '../utils/colors.js'

export default function InstitutionalPanel({ stock }) {
  const [inst,    setInst]    = useState(null)
  const [margin,  setMargin]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState(false)

  useEffect(() => {
    if (!stock?.code) return
    setInst(null); setMargin(null); setErr(false); setLoading(true)

    Promise.allSettled([
      fetchInstitutional(stock.code, 5),
      fetchMarginBalance(stock.code),
    ]).then(([instRes, marginRes]) => {
      if (instRes.status === 'fulfilled' && instRes.value) setInst(instRes.value)
      if (marginRes.status === 'fulfilled' && marginRes.value) setMargin(marginRes.value)
      if (!instRes.value && !marginRes.value) setErr(true)
      setLoading(false)
    })
  }, [stock?.code])

  const fmtK = n => {
    if (!n && n !== 0) return '—'
    const abs = Math.abs(n)
    const sign = n >= 0 ? '+' : '-'
    if (abs >= 10000) return `${sign}${(abs/10000).toFixed(1)}萬`
    return `${sign}${abs.toLocaleString('zh-TW')}`
  }

  const BD = '1px solid #1e2d4d'

  return (
    <div style={{ background: '#090d1b', border: BD, borderRadius: 10, padding: 14, marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>🏦 三大法人 + 籌碼面</span>
        <span style={{ fontSize: 10, color: '#475569' }}>資料源：TWSE 公開資訊</span>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: '#818cf8', padding: '16px 0', fontSize: 12 }}>
          ⏳ 從台灣證交所載入籌碼資料...
        </div>
      )}

      {err && !loading && (
        <div style={{ textAlign: 'center', color: '#475569', padding: '12px 0', fontSize: 12 }}>
          ⚠️ 今日資料尚未公布（台股收盤後約30分鐘），或CORS代理服務繁忙<br/>
          <span style={{ fontSize: 10 }}>可至 <a href={`https://goodinfo.tw/tw/StockBuySaleChart.asp?STOCK_ID=${stock?.code}`} target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>GoodInfo 查看完整三大法人</a></span>
        </div>
      )}

      {/* 三大法人 */}
      {inst && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 8 }}>三大法人買賣超（張）</div>

          {/* 最新單日 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
            {[
              { l: '外資',   n: inst.latest?.foreign?.net, icon: '🌏' },
              { l: '投信',   n: inst.latest?.trust?.net,   icon: '🏛️' },
              { l: '自營商', n: inst.latest?.dealer?.net,  icon: '🏢' },
            ].map((x, i) => {
              const isPos = (x.n || 0) >= 0
              return (
                <div key={i} style={{
                  background: isPos ? C.upBg : C.downBg,
                  border: `1px solid ${isPos ? C.up : C.down}44`,
                  borderRadius: 8, padding: '8px 10px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 3 }}>{x.icon} {x.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: isPos ? C.up : C.down, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtK(x.n)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 5日累計外資 */}
          {inst.fiveDayForeign !== undefined && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, fontSize: 12,
              background: inst.fiveDayForeign >= 0 ? C.upBg : C.downBg,
              border: `1px solid ${inst.fiveDayForeign >= 0 ? C.up : C.down}33`,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span style={{ color: '#94a3b8' }}>🌏 外資近5日累計</span>
              <span style={{
                fontWeight: 900, color: inst.fiveDayForeign >= 0 ? C.up : C.down,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {fmtK(inst.fiveDayForeign)} 張
                {inst.fiveDayForeign >= 5000 ? ' 🔥 持續買超' : inst.fiveDayForeign <= -5000 ? ' ⚠️ 持續賣超' : ''}
              </span>
            </div>
          )}

          {/* 近5日表格 */}
          {inst.rows?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr 1fr', gap: 0,
                fontSize: 10, color: '#475569', padding: '4px 8px', borderBottom: BD }}>
                <span>日期</span><span style={{ textAlign:'right' }}>外資</span>
                <span style={{ textAlign:'right' }}>投信</span>
                <span style={{ textAlign:'right' }}>自營</span>
                <span style={{ textAlign:'right' }}>合計</span>
              </div>
              {[...inst.rows].reverse().slice(0, 5).map((row, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr 1fr', gap: 0,
                  fontSize: 10, padding: '4px 8px',
                  background: i % 2 === 0 ? '#0d1224' : 'transparent',
                }}>
                  <span style={{ color: '#64748b' }}>{row.date?.slice(0,5)}</span>
                  {[row.foreign.net, row.trust.net, row.dealer.net, row.total].map((v, j) => (
                    <span key={j} style={{ textAlign:'right', color: (v||0)>=0?C.up:C.down, fontVariantNumeric:'tabular-nums', fontWeight: j===3?700:400 }}>
                      {fmtK(v)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 融資融券 */}
      {margin && (
        <div>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 8 }}>
            💳 融資融券餘額 ({margin.date})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
            {[
              { l: '融資餘額', v: margin.marginBalance, unit: '張', note: '多方借錢買', color: C.up },
              { l: '融券餘額', v: margin.shortBalance,  unit: '張', note: '空方放空',   color: C.down },
            ].map((x, i) => (
              <div key={i} style={{ background: '#151d35', border: BD, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>
                  {x.l} <span style={{ fontSize: 9 }}>({x.note})</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: x.color, fontVariantNumeric: 'tabular-nums' }}>
                  {x.v?.toLocaleString('zh-TW') || '—'} <span style={{ fontSize: 10 }}>{x.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {margin.marginBalance > 0 && margin.shortBalance > 0 && (
            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, fontSize: 11,
              background: '#1e2d4d', color: '#94a3b8' }}>
              融券/融資比:{' '}
              <span style={{ fontWeight: 700, color: (margin.shortBalance/margin.marginBalance) > 0.1 ? C.down : '#94a3b8' }}>
                {(margin.shortBalance/margin.marginBalance*100).toFixed(1)}%
              </span>
              {(margin.shortBalance/margin.marginBalance) > 0.15
                ? ' — 空頭比例偏高，留意軋空行情'
                : (margin.shortBalance/margin.marginBalance) < 0.03
                ? ' — 空頭稀少，做多氣氛濃厚'
                : ''}
            </div>
          )}
        </div>
      )}

      {!loading && !err && !inst && !margin && (
        <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: '8px' }}>
          無法取得籌碼資料
        </div>
      )}
    </div>
  )
}
