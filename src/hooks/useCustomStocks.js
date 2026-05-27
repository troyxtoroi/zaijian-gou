/**
 * useCustomStocks v2 — 防崩潰自選股持久化
 * 核心保護：
 * 1. 絕不用空資料覆蓋非空 localStorage
 * 2. 崩潰重啟後自動從備份還原
 * 3. 加入股票後立即強制寫入（不等 debounce）
 */
import { useState, useEffect, useRef } from 'react'

const LS = {
  SECTORS: 'zaijian_custom_sectors',
  STOCKS:  'zaijian_custom_stocks',
  EXTRAS:  'zaijian_builtin_extras',
  BACKUP:  'zaijian_backup_v2',
  EMERG:   'zaijian_emergency_v2',
}
const BUILTIN_KEYS = ['ai','memory','satellite','passive','thermal','packaging']
const COLORS = ['#f472b6','#a78bfa','#34d399','#fbbf24','#60a5fa','#f87171','#2dd4bf','#fb923c']

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw || raw === 'null' || raw === 'undefined') return null
    return JSON.parse(raw) ?? null
  } catch { return null }
}

function safeWrite(key, value) {
  try {
    const newStr = JSON.stringify(value)
    const isEmpty = v => !v || v === '[]' || v === '{}'
    if (isEmpty(newStr)) {
      const old = localStorage.getItem(key)
      if (old && !isEmpty(old)) {
        console.warn(`[ZG] 阻止空資料覆蓋 ${key}`)
        return false
      }
    }
    localStorage.setItem(key, newStr)
    return true
  } catch { return false }
}

function loadInitial() {
  const sectors   = safeRead(LS.SECTORS, null)
  const stockInfo = safeRead(LS.STOCKS,  null)
  const extras    = safeRead(LS.EXTRAS,  null)
  const hasMain   =
    (Array.isArray(sectors)   && sectors.length > 0) ||
    (stockInfo && Object.keys(stockInfo).length > 0) ||
    (extras    && Object.values(extras).flat().length > 0)

  if (hasMain) return { sectors: sectors||[], stockInfo: stockInfo||{}, extras: extras||{} }

  // 嘗試備份
  for (const bKey of [LS.BACKUP, LS.EMERG]) {
    const b = safeRead(bKey, null)
    if (!b) continue
    const bs = b.sectors   || b.customSectors   || []
    const bi = b.stockInfo || b.customStockInfo || {}
    const be = b.extras    || b.builtinExtras   || {}
    if (bs.length > 0 || Object.keys(bi).length > 0) {
      console.log(`[ZG] 從備份 ${bKey} 還原`, { sectors: bs.length, stocks: Object.keys(bi).length })
      // 立即寫回主鍵
      safeWrite(LS.SECTORS, bs)
      safeWrite(LS.STOCKS,  bi)
      safeWrite(LS.EXTRAS,  be)
      return { sectors: bs, stockInfo: bi, extras: be }
    }
  }
  return { sectors: [], stockInfo: {}, extras: {} }
}

function persistAll(sectors, stockInfo, extras) {
  safeWrite(LS.SECTORS, sectors)
  safeWrite(LS.STOCKS,  stockInfo)
  safeWrite(LS.EXTRAS,  extras)
  try {
    localStorage.setItem(LS.BACKUP, JSON.stringify({ sectors, stockInfo, extras, ts: Date.now() }))
  } catch {}
}

export function useCustomStocks() {
  const initial = useRef(loadInitial())
  const [customSectors,   setCustomSectors]   = useState(initial.current.sectors)
  const [customStockInfo, setCustomStockInfo] = useState(initial.current.stockInfo)
  const [builtinExtras,   setBuiltinExtras]   = useState(initial.current.extras)

  const readyRef  = useRef(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => { readyRef.current = true }, 300)
    return () => clearTimeout(t)
  }, [])

  // 每 10 分鐘緊急備份
  useEffect(() => {
    const t = setInterval(() => {
      try {
        localStorage.setItem(LS.EMERG, JSON.stringify({
          sectors: customSectors, stockInfo: customStockInfo, extras: builtinExtras, ts: Date.now()
        }))
      } catch {}
    }, 10 * 60 * 1000)
    return () => clearInterval(t)
  }, [customSectors, customStockInfo, builtinExtras])

  function scheduleSave(s, si, e) {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (readyRef.current) persistAll(s, si, e)
    }, 500)
  }

  useEffect(() => {
    if (!readyRef.current) return
    scheduleSave(customSectors, customStockInfo, builtinExtras)
  }, [customSectors, customStockInfo, builtinExtras])

  function addSector(name, tag = '⭐') {
    const id    = `custom_${Date.now()}`
    const color = COLORS[customSectors.length % COLORS.length]
    const ns = [...customSectors, { id, name, tag, color, stocks: [] }]
    setCustomSectors(ns)
    return id
  }

  function deleteSector(id) {
    setCustomSectors(p => p.filter(s => s.id !== id))
  }

  function addStock(sectorId, stock) {
    const info = { code: stock.code, name: stock.name||stock.code, base: stock.base||100, otc: stock.otc||false }
    const newStockInfo = { ...customStockInfo, [stock.code]: info }
    setCustomStockInfo(newStockInfo)

    let newSectors = customSectors
    let newExtras  = builtinExtras

    if (BUILTIN_KEYS.includes(sectorId)) {
      newExtras = { ...builtinExtras, [sectorId]: [...new Set([...(builtinExtras[sectorId]||[]), stock.code])] }
      setBuiltinExtras(newExtras)
    } else {
      newSectors = customSectors.map(s =>
        s.id === sectorId ? { ...s, stocks: [...new Set([...s.stocks, stock.code])] } : s
      )
      setCustomSectors(newSectors)
    }

    // 立即強制寫入（不等 debounce）
    setTimeout(() => persistAll(newSectors, newStockInfo, newExtras), 50)
  }

  function removeStock(sectorId, code) {
    if (BUILTIN_KEYS.includes(sectorId)) {
      setBuiltinExtras(p => ({ ...p, [sectorId]: (p[sectorId]||[]).filter(c=>c!==code) }))
    } else {
      setCustomSectors(p => p.map(s => s.id===sectorId ? {...s, stocks: s.stocks.filter(c=>c!==code)} : s))
    }
  }

  function exportData() {
    return JSON.stringify({ version:3, exportedAt: new Date().toISOString(),
      customSectors, customStockInfo, builtinExtras }, null, 2)
  }

  function importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr)
      const s  = data.customSectors   || data.sectors   || []
      const si = data.customStockInfo || data.stockInfo || {}
      const e  = data.builtinExtras   || data.extras    || {}
      if (s.length || Object.keys(si).length) {
        setCustomSectors(s); setCustomStockInfo(si); setBuiltinExtras(e)
        setTimeout(() => persistAll(s, si, e), 100)
        return { ok: true, msg: `✅ 匯入 ${Object.keys(si).length} 檔股票` }
      }
      return { ok: false, msg: '資料中沒有自選股' }
    } catch (e) { return { ok: false, msg: '格式錯誤: ' + e.message } }
  }

  function diagnose() {
    return {
      memory: { sectors: customSectors.length, stocks: Object.keys(customStockInfo).length },
      backup: safeRead(LS.BACKUP, null),
    }
  }

  return {
    customSectors, customStockInfo, builtinExtras,
    addSector, deleteSector, addStock, removeStock,
    exportData, importData, diagnose,
  }
}
