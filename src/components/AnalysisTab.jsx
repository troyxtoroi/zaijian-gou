import { useState } from 'react'
import { CANDLES_CACHE, calcMA, calcRSI } from '../services/stockApi.js'
import CandleChart, { detectSupportResistance } from './CandleChart.jsx'
import IndicatorChart, { calcKD, calcMACD } from './IndicatorChart.jsx'
import MarketNewsPanel from './MarketNewsPanel.jsx'
import RiskCalculator  from './RiskCalculator.jsx'
import { AlertPanel }  from './PriceAlert.jsx'
import { C, priceColor, sigColor, sigBg, sigBorder, sentColor } from '../utils/colors.js'

export default function AnalysisTab({ stock, sectorKey, allSectors, analysis, busy, onReanalyze,
    alerts, addAlert, removeAlert, cash }) {
  const [indicator, setIndicator] = useState('macd')  // 'macd' | 'kd' | 'none'

  if (!stock) {
    return (
      <div style={{ textAlign: 'center', color: '#475569', padding: '70px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
        <div style={{ fontSize: 14, color: '#64748b' }}>從「市場概覽」選擇個股，點擊「分析」</div>
        <div style={{ fontSize: 12, marginTop: 8, color: '#374151' }}>整合 K 線 × 技術指標 × 市場消息 × 外資評等</div>
      </div>
    )
  }

  const cs = CANDLES_CACHE[stock.code]
  if (!cs || cs.length < 2) return (
    <div style={{ textAlign: 'center', color: '#475569', padding: '50px 0' }}>
      <div style={{ fontSize: 13 }}>⏳ K 線資料載入中...</div>
    </div>
  )

  const last  = cs[cs.length - 1], prev = cs[cs.length - 2]
  const chg   = (last.close - prev.close) / prev.close * 100
  const up    = chg >= 0
  const ma5   = calcMA(cs, 5), ma10 = calcMA(cs, 10), ma20 = calcMA(cs, 20)
  const rsi14 = calcRSI(cs, 14)
  const sec   = allSectors?.[sectorKey]
  const sColor = sec?.color || '#818cf8'
  const fmtP  = p => p >= 1000 ? p.toFixed(0) : p >= 100 ? p.toFixed(1) : p.toFixed(2)
  const isLimitUp   = chg >= 9.5
  const isLimitDown = chg <= -9.5

  // 支撐/壓力位
  const { supports, resistances } = detectSupportResistance(cs, 3)

  // KD 當前值
  const kdData  = cs.length >= 9 ? calcKD(cs)  : null
  const curKD   = kdData?.[kdData.length - 1]
  const macdData = cs.length >= 26 ? calcMACD(cs) : null
  const curMACD  = macdData?.[macdData.length - 1]

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#e2e8f0' }}>{stock.name}</span>
          <span style={{ fontSize: 12, color: '#475569', marginLeft: 8 }}>{stock.code} · {sec?.name || sectorKey}</span>
        </div>
        <span style={{ fontSize: 17, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#e2e8f0' }}>
          {fmtP(last.close)}
        </span>
        <span style={{ fontSize: 12, color: priceColor(chg), fontWeight: 700 }}>
          {up ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
        </span>
        {isLimitUp   && <span style={{ padding:'2px 8px',borderRadius:6,fontSize:12,fontWeight:900,color:C.up,  border:`2px solid ${C.up}`,  background:C.upBg   }}>漲停</span>}
        {isLimitDown && <span style={{ padding:'2px 8px',borderRadius:6,fontSize:12,fontWeight:900,color:C.down,border:`2px solid ${C.down}`,background:C.downBg }}>跌停</span>}
        {analysis && !analysis.error && (
          <span style={{
            padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, marginLeft: 'auto',
            background: sigBg(analysis.signal), color: sigColor(analysis.signal),
            border: `1px solid ${sigBorder(analysis.signal)}`,
          }}>
            {analysis.signal} {analysis.confidence}%
            <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>{analysis.isLocal ? '📐' : '🤖'}</span>
          </span>
        )}
        <button onClick={() => onReanalyze(stock, sectorKey)} style={{
          padding:'5px 12px',fontSize:11,borderRadius:6,cursor:'pointer',
          fontFamily:'inherit',background:'#151d35',border:'1px solid #1e2d4d',color:'#64748b',
          marginLeft: analysis ? 0 : 'auto',
        }}>🔄 重新分析</button>
      </div>

      {/* ── Indicator strip ── */}
      <div style={{ display: 'flex', gap: 14, fontSize: 11, marginBottom: 8, flexWrap: 'wrap' }}>
        {[['MA5',ma5],['MA10',ma10],['MA20',ma20]].map(([l, v]) => (
          <span key={l} style={{ color: v?(last.close>v?C.up:C.down):'#475569', fontVariantNumeric:'tabular-nums' }}>
            <span style={{ color:'#475569' }}>{l} </span>{v?fmtP(v):'—'}
          </span>
        ))}
        {rsi14 !== null && (
          <span style={{ color: rsi14>70?C.up:rsi14<30?C.down:'#94a3b8' }}>
            <span style={{ color:'#475569' }}>RSI </span>{rsi14.toFixed(1)}
            {rsi14>70?' ⚠️超買':rsi14<30?' 💡超賣':''}
          </span>
        )}
        {curKD && (
          <span style={{ color: curKD.k>80?C.up:curKD.k<20?C.down:'#94a3b8' }}>
            <span style={{ color:'#475569' }}>KD </span>K:{curKD.k.toFixed(0)} D:{curKD.d.toFixed(0)}
            {curKD.k>80?' 超買':curKD.k<20?' 超賣':''}
          </span>
        )}
        {curMACD?.macd && (
          <span style={{ color: curMACD.hist > 0 ? C.up : C.down }}>
            <span style={{ color:'#475569' }}>MACD </span>
            {curMACD.hist > 0 ? '多頭' : '空頭'} {curMACD.hist?.toFixed(2)}
          </span>
        )}
        {analysis?.indicators?.volRatio && (
          <span style={{ color: analysis.indicators.volRatio>1.3?'#fbbf24':'#64748b' }}>
            <span style={{ color:'#475569' }}>量比 </span>{analysis.indicators.volRatio}x
          </span>
        )}
      </div>

      {/* 支撐壓力位 */}
      {(supports.length > 0 || resistances.length > 0) && (
        <div style={{ display:'flex',gap:10,marginBottom:8,fontSize:11,flexWrap:'wrap' }}>
          {resistances.length > 0 && (
            <div style={{ display:'flex',gap:4,alignItems:'center' }}>
              <span style={{ color:'#475569' }}>壓力：</span>
              {resistances.slice(-2).map(v => (
                <span key={v} style={{ background:C.upBg,border:`1px solid ${C.up}44`,color:C.up,padding:'1px 6px',borderRadius:4,fontVariantNumeric:'tabular-nums' }}>{fmtP(v)}</span>
              ))}
            </div>
          )}
          {supports.length > 0 && (
            <div style={{ display:'flex',gap:4,alignItems:'center' }}>
              <span style={{ color:'#475569' }}>支撐：</span>
              {supports.slice(-2).map(v => (
                <span key={v} style={{ background:C.downBg,border:`1px solid ${C.down}44`,color:C.down,padding:'1px 6px',borderRadius:4,fontVariantNumeric:'tabular-nums' }}>{fmtP(v)}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── K-line chart ── */}
      <div style={{ background:'#090d1b',borderRadius:10,padding:'10px 10px 4px',marginBottom:4 }}>
        <CandleChart candles={cs} h={210} showMA showVolume />
      </div>

      {/* ── 指標切換 ── */}
      <div style={{ display:'flex',gap:6,padding:'4px 0',marginBottom:4 }}>
        {[{k:'macd',l:'MACD'},{k:'kd',l:'KD指標'},{k:'none',l:'隱藏'}].map(m => (
          <button key={m.k} onClick={() => setIndicator(m.k)} style={{
            padding:'3px 10px',fontSize:11,borderRadius:12,cursor:'pointer',fontFamily:'inherit',
            background: indicator===m.k?'#1e2d4d':'transparent',
            border:`1px solid ${indicator===m.k?'#818cf8':'#1e2d4d'}`,
            color: indicator===m.k?'#818cf8':'#475569',
            fontWeight: indicator===m.k?700:400,
          }}>{m.l}</button>
        ))}
      </div>

      {/* ── 指標子圖 ── */}
      {indicator !== 'none' && (
        <div style={{ background:'#090d1b',borderRadius:10,padding:'8px 10px',marginBottom:12 }}>
          <IndicatorChart candles={cs} mode={indicator} h={80} />
        </div>
      )}

      {busy && (
        <div style={{ textAlign:'center',color:'#818cf8',padding:'20px 0',fontSize:13 }}>
          ⏳ 整合技術面 + 市場面 + 外資評等分析中...
        </div>
      )}

      {analysis && !busy && (
        <div>
          {/* Pattern / Trend / Signal / Sentiment */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr) repeat(2,1fr)',gap:8,marginBottom:10 }}>
            {[
              { l:'K線型態', v:analysis.pattern, c:sColor },
              { l:'趨勢方向', v:analysis.trend,
                c:analysis.trend==='上漲'?C.up:analysis.trend==='下跌'?C.down:'#94a3b8' },
              { l:'操作信號', v:analysis.signal, c:sigColor(analysis.signal) },
              { l:'市場情緒', v:analysis.marketSentiment||'—', c:sentColor(analysis.marketSentiment) },
            ].map((x,i) => (
              <div key={i} style={{ background:'#090d1b',border:'1px solid #1e2d4d',borderRadius:8,padding:'10px 12px' }}>
                <div style={{ fontSize:10,color:'#475569',marginBottom:4 }}>{x.l}</div>
                <div style={{ fontSize:13,fontWeight:700,color:x.c }}>{x.v}</div>
              </div>
            ))}
          </div>

          {/* Computex + analyst */}
          {!analysis.error && (
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10 }}>
              {analysis.computexCatalyst && (
                <div style={{ background:'#1e1b4b',border:'1px solid #818cf833',borderRadius:8,padding:'10px 12px' }}>
                  <div style={{ fontSize:10,color:'#475569',marginBottom:4 }}>🎪 Computex關聯</div>
                  <div style={{ fontSize:11,color:'#818cf8' }}>{analysis.computexCatalyst}</div>
                </div>
              )}
              {analysis.analystRating && analysis.analystRating !== '無評等' && (
                <div style={{ background:C.buyBg,border:`1px solid ${C.buyBorder}`,borderRadius:8,padding:'10px 12px' }}>
                  <div style={{ fontSize:10,color:'#475569',marginBottom:4 }}>📋 外資評等</div>
                  <div style={{ fontSize:11,color:C.buy,fontWeight:700 }}>{analysis.analystRating}</div>
                </div>
              )}
            </div>
          )}

          {/* Price targets */}
          {!analysis.error && (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10 }}>
              {[
                { l:'建議進場', v:analysis.entry,    c:'#818cf8' },
                { l:'停損價',   v:analysis.stopLoss, c:analysis.signal==='買入'?C.down:C.up },
                { l:'目標價',   v:analysis.target,   c:analysis.signal==='買入'?C.up:C.down },
              ].map((x,i) => (
                <div key={i} style={{ background:'#090d1b',border:'1px solid #1e2d4d',borderRadius:8,padding:'10px 12px' }}>
                  <div style={{ fontSize:10,color:'#475569',marginBottom:4 }}>{x.l}</div>
                  <div style={{ fontSize:16,fontWeight:900,color:x.c,fontVariantNumeric:'tabular-nums' }}>
                    {typeof x.v==='number'?fmtP(x.v):x.v||'—'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Analysis text */}
          <div style={{ background:'#090d1b',border:'1px solid #1e2d4d',borderRadius:8,padding:14 }}>
            <div style={{ fontSize:10,color:'#475569',marginBottom:8 }}>
              {analysis.isLocal?'📐 技術面 + 市場情境綜合分析（免費）':'🤖 Claude AI 深度分析（整合市場消息）'}
            </div>
            <div style={{ fontSize:13,color:'#cbd5e1',lineHeight:1.7,marginBottom:analysis.error?0:10 }}>
              {analysis.analysis}
            </div>
            {!analysis.error && (
              <>
                <div style={{ display:'flex',gap:14,fontSize:11,color:'#475569',marginBottom:8 }}>
                  <span>⏱ {analysis.timeframe}</span>
                  <span>⚠️ 風險：{analysis.risk}</span>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <span style={{ fontSize:11,color:'#475569',minWidth:30 }}>信心</span>
                  <div style={{ flex:1,height:6,background:'#1e2d4d',borderRadius:3 }}>
                    <div style={{
                      width:`${analysis.confidence}%`,height:'100%',borderRadius:3,transition:'width 0.8s',
                      background:analysis.confidence>=70?C.buy:analysis.confidence>=50?'#f59e0b':C.sell,
                    }}/>
                  </div>
                  <span style={{ fontSize:12,color:'#e2e8f0',fontWeight:700 }}>{analysis.confidence}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 市場情境 */}
      <MarketNewsPanel sectorKey={sectorKey} stockCode={stock.code} />

      {/* 部位計算器 */}
      <RiskCalculator analysis={analysis} cash={cash} />

      {/* 股價警報 */}
      <AlertPanel stock={stock} analysis={analysis} alerts={alerts} addAlert={addAlert} removeAlert={removeAlert} />
    </div>
  )
}
