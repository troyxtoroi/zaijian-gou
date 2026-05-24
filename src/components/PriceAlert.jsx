import { useState, useEffect, useRef } from 'react'
import { C } from '../utils/colors.js'

const LS_KEY = 'zaijian_alerts'

function loadAlerts() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || [] } catch { return [] }
}
function saveAlerts(alerts) {
  localStorage.setItem(LS_KEY, JSON.stringify(alerts))
}

/** 請求瀏覽器通知權限 */
async function requestNotification() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const perm = await Notification.requestPermission()
  return perm === 'granted'
}

/** 發送通知 */
function notify(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '🐕' })
  }
}

export function usePriceAlerts(CANDLES_CACHE) {
  const [alerts, setAlerts] = useState(loadAlerts)
  const triggeredRef = useRef(new Set())

  // 儲存到 localStorage
  useEffect(() => { saveAlerts(alerts) }, [alerts])

  // 定期檢查警報（每 30 秒）
  useEffect(() => {
    const check = () => {
      alerts.forEach(alert => {
        if (alert.triggered) return
        const cs    = CANDLES_CACHE[alert.code]
        if (!cs || !cs.length) return
        const price = cs[cs.length - 1].close
        const key   = `${alert.id}`

        let hit = false
        if (alert.type === 'above' && price >= alert.targetPrice) hit = true
        if (alert.type === 'below' && price <= alert.targetPrice) hit = true

        if (hit && !triggeredRef.current.has(key)) {
          triggeredRef.current.add(key)
          notify(
            `🔔 ${alert.name} 股價警報！`,
            `${alert.name}(${alert.code}) 現價 ${price.toFixed(1)} 元，已${alert.type === 'above' ? '突破' : '跌破'} ${alert.targetPrice} 元`
          )
          setAlerts(p => p.map(a => a.id === alert.id ? { ...a, triggered: true, triggeredAt: new Date().toISOString() } : a))
        }
      })
    }

    const timer = setInterval(check, 30000)
    check()
    return () => clearInterval(timer)
  }, [alerts, CANDLES_CACHE])

  const addAlert = (stock, targetPrice, type) => {
    const alert = {
      id: Date.now(),
      code: stock.code,
      name: stock.name,
      targetPrice: +targetPrice,
      type,  // 'above' | 'below'
      triggered: false,
      createdAt: new Date().toISOString(),
    }
    setAlerts(p => [alert, ...p].slice(0, 20))
    requestNotification()
  }

  const removeAlert = id => setAlerts(p => p.filter(a => a.id !== id))
  const clearTriggered = () => setAlerts(p => p.filter(a => !a.triggered))

  return { alerts, addAlert, removeAlert, clearTriggered }
}

/** 警報設定面板（放在個股分析下方） */
export function AlertPanel({ stock, analysis, alerts, addAlert, removeAlert }) {
  const [price,   setPrice]   = useState('')
  const [type,    setType]    = useState('above')
  const [notifOk, setNotifOk] = useState(Notification?.permission === 'granted')

  const stockAlerts = alerts.filter(a => a.code === stock?.code)

  const handleAdd = async () => {
    const p = parseFloat(price)
    if (!p || !stock) return
    const ok = await requestNotification()
    setNotifOk(ok)
    addAlert(stock, p, type)
    setPrice('')
  }

  if (!stock) return null

  return (
    <div style={{ background: '#090d1b', border: '1px solid #1e2d4d', borderRadius: 10, padding: 14, marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>🔔 股價警報</span>
        {!notifOk && (
          <button onClick={async () => setNotifOk(await requestNotification())} style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
            background: '#2b1e00', border: '1px solid #f59e0b55', color: '#f59e0b', fontFamily: 'inherit',
          }}>允許通知</button>
        )}
        {notifOk && <span style={{ fontSize: 10, color: '#22c55e' }}>✅ 通知已開啟</span>}
      </div>

      {/* 快速加入分析建議價位 */}
      {analysis && !analysis.error && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: '#475569', alignSelf: 'center' }}>快速設定：</span>
          {analysis.target && (
            <button onClick={() => { setPrice(analysis.target.toFixed(1)); setType('above') }} style={{
              padding: '3px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer',
              background: C.upBg, border: `1px solid ${C.up}44`, color: C.up, fontFamily: 'inherit',
            }}>目標 {analysis.target.toFixed(1)}</button>
          )}
          {analysis.stopLoss && (
            <button onClick={() => { setPrice(analysis.stopLoss.toFixed(1)); setType('below') }} style={{
              padding: '3px 8px', fontSize: 10, borderRadius: 4, cursor: 'pointer',
              background: C.downBg, border: `1px solid ${C.down}44`, color: C.down, fontFamily: 'inherit',
            }}>停損 {analysis.stopLoss.toFixed(1)}</button>
          )}
        </div>
      )}

      {/* 手動設定 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <select value={type} onChange={e => setType(e.target.value)} style={{
          padding: '7px', fontSize: 12, borderRadius: 6, border: '1px solid #1e2d4d',
          background: '#151d35', color: '#e2e8f0', fontFamily: 'inherit', cursor: 'pointer',
        }}>
          <option value="above">漲到（突破）</option>
          <option value="below">跌到（跌破）</option>
        </select>
        <input type="number" placeholder="目標股價"
          value={price} onChange={e => setPrice(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={{
            flex: 1, padding: '7px 10px', fontSize: 13, borderRadius: 6,
            border: '1px solid #1e2d4d', background: '#151d35', color: '#e2e8f0',
            outline: 'none', fontVariantNumeric: 'tabular-nums',
          }}/>
        <button onClick={handleAdd} style={{
          padding: '7px 14px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
          background: '#1e2d4d', border: '1px solid #818cf8', color: '#818cf8', fontFamily: 'inherit', fontWeight: 700,
        }}>＋ 加入</button>
      </div>

      {/* 現有警報 */}
      {stockAlerts.length === 0 ? (
        <div style={{ fontSize: 11, color: '#374151', textAlign: 'center', padding: '8px' }}>
          尚無警報，設定後股價觸發時會自動通知
        </div>
      ) : (
        <div>
          {stockAlerts.map(a => (
            <div key={a.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 10px', borderRadius: 6, marginBottom: 4,
              background: a.triggered ? '#151d1b' : '#151d35',
              border: `1px solid ${a.triggered ? '#22444433' : '#1e2d4d'}`,
              opacity: a.triggered ? 0.6 : 1,
            }}>
              <div style={{ fontSize: 12 }}>
                <span style={{ color: a.type === 'above' ? C.up : C.down, fontWeight: 700 }}>
                  {a.type === 'above' ? '▲ 漲到' : '▼ 跌到'}
                </span>
                <span style={{ color: '#e2e8f0', marginLeft: 8, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                  {a.targetPrice.toFixed(1)} 元
                </span>
                {a.triggered && <span style={{ marginLeft: 8, fontSize: 10, color: '#475569' }}>已觸發</span>}
              </div>
              <button onClick={() => removeAlert(a.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 14, padding: 2,
              }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
