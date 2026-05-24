/**
 * useCustomStocks — 自選股持久化 Hook
 * 
 * 核心保護原則：
 * 1. 絕不用空資料覆蓋有資料的 localStorage
 * 2. 初始化完成前不寫入
 * 3. 三層備份（主鍵 + 備份 + 緊急備份）
 * 4. 每次操作前驗證
 */
import { useState, useEffect, useRef, useCallback } from 'react'

const LS = {
  SECTORS:  'zaijian_custom_sectors',
  STOCKS:   'zaijian_custom_stocks',
  EXTRAS:   'zaijian_builtin_extras',
  BACKUP:   'zaijian_backup_v2',      // 最新備份
  EMERG:    'zaijian_emergency_v2',   // 緊急備份（每10分鐘更新）
}

const BUILTIN_KEYS = ['ai','memory','satellite','passive','thermal','packaging']
const COLORS = ['#f472b6','#a78bfa','#34d399','#fbbf24','#60a5fa','#f87171','#2dd4bf','#fb923c']

// ── 安全讀取 ────────────────────────────────────────────
function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw || raw === 'null' || raw === 'undefined') return null
    const parsed = JSON.parse(raw)
    if (parsed === null || parsed === undefined) return null
    return parsed
  } catch { return null }
}

// ── 安全寫入（防止空資料覆蓋）──────────────────────────
function safeWrite(key, value) {
  try {
    const newStr = JSON.stringify(value)
    const isEmpty = v => !v || v === '[]' || v === '{}' || v === 'null'

    // 保護：不用空資料覆蓋有資料的舊值
    if (isEmpty(newStr)) {
      const oldRaw = localStorage.getItem(key)
      if (oldRaw && !isEmpty(oldRaw)) {
        console.warn(`[ZG] 阻止空資料覆蓋 ${key}，保留原有資料`)
        return false
      }
    }
    localStorage.setItem(key, newStr)
    return true
  } catch (e) {
    console.error('[ZG] 寫入失敗:', key, e)
    return false
  }
}

// ── 從任何來源讀取初始資料 ──────────────────────────────
function loadInitial() {
  // 嘗試主鍵
  const sectors   = safeRead(LS.SECTORS, null)
  const stockInfo = safeRead(LS.STOCKS,  null)
  const extras    = safeRead(LS.EXTRAS,  null)

  const hasMain = (Array.isArray(sectors) && sectors.length > 0) ||
                  (stockInfo && Object.keys(stockInfo).length > 0) ||
                  (extras && Object.values(extras).flat().length > 0)

  if (hasMain) {
    console.log('[ZG] 從主鍵載入:', {
      sectors: sectors?.length ?? 0,
      stocks:  Object.keys(stockInfo || {}).length,
      extras:  Object.values(extras || {}).flat().length,
    })
    return { sectors: sectors || [], stockInfo: stockInfo || {}, extras: extras || {} }
  }

  // 嘗試備份
  for (const bKey of [LS.BACKUP, LS.EMERG]) {
    const backup = safeRead(bKey, null)
    if (!backup) continue
    const bSectors   = backup.sectors   || backup.customSectors   || []
    const bStockInfo = backup.stockInfo || backup.customStockInfo || {}
    const bExtras    = backup.extras    || backup.builtinExtras   || {}
    const hasData    = bSectors.length > 0 || Object.keys(bStockInfo).length > 0
    if (hasData) {
      console.log(`[ZG] 從備份 ${bKey} 還原:`, {
        sectors: bSectors.length, stocks: Object.keys(bStockInfo).length,
      })
      return { sectors: bSectors, stockInfo: bStockInfo, extras: bExtras }
    }
  }

  // 沒有任何資料 → 空白開始
  return { sectors: [], stockInfo: {}, extras: {} }
}

// ── 保存所有資料（含備份）───────────────────────────────
function persistAll(sectors, stockInfo, extras) {
  safeWrite(LS.SECTORS, sectors)
  safeWrite(LS.STOCKS,  stockInfo)
  safeWrite(LS.EXTRAS,  extras)

  // 備份
  const backup = { sectors, stockInfo, extras, ts: Date.now() }
  try { localStorage.setItem(LS.BACKUP, JSON.stringify(backup)) } catch {}
}

function persistEmergency(sectors, stockInfo, extras) {
  try {
    localStorage.setItem(LS.EMERG, JSON.stringify({
      sectors, stockInfo, extras, ts: Date.now(),
    }))
  } catch {}
}

// ═══════════════════════════════════════════════════════
export function useCustomStocks() {
  // 初始化（只跑一次）
  const initial = useRef(loadInitial())

  const [customSectors,   setCustomSectors]   = useState(initial.current.sectors)
  const [customStockInfo, setCustomStockInfo] = useState(initial.current.stockInfo)
  const [builtinExtras,   setBuiltinExtras]   = useState(initial.current.extras)

  // 初始化保護標記：初始化完成後才允許寫入
  const readyRef    = useRef(false)
  const saveTimer   = useRef(null)

  // 初始化完成後才開始寫入
  useEffect(() => {
    const t = setTimeout(() => { readyRef.current = true }, 200)
    return () => clearTimeout(t)
  }, [])

  // 定期緊急備份（每10分鐘）
  useEffect(() => {
    const t = setInterval(() => {
      if (readyRef.current) {
        persistEmergency(customSectors, customStockInfo, builtinExtras)
      }
    }, 10 * 60 * 1000)
    return () => clearInterval(t)
  }, [customSectors, customStockInfo, builtinExtras])

  // 防抖寫入（狀態改變時）
  const scheduleSave = useCallback((sectors, stockInfo, extras) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (!readyRef.current) return  // 初始化未完成，不寫入
      persistAll(sectors, stockInfo, extras)
    }, 500)
  }, [])

  useEffect(() => {
    if (!readyRef.current) return
    scheduleSave(customSectors, customStockInfo, builtinExtras)
  }, [customSectors, customStockInfo, builtinExtras])

  // ── 操作函式 ──────────────────────────────────────────

  function addSector(name, tag = '⭐') {
    const id    = `custom_${Date.now()}`
    const color = COLORS[customSectors.length % COLORS.length]
    setCustomSectors(p => [...p, { id, name, tag, color, stocks: [] }])
    return id
  }

  function deleteSector(id) {
    setCustomSectors(p => p.filter(s => s.id !== id))
  }

  function addStock(sectorId, stock) {
    const info = {
      code: stock.code,
      name: stock.name || stock.code,
      base: stock.base || 100,
      otc:  stock.otc  || false,
    }

    setCustomStockInfo(p => ({ ...p, [stock.code]: info }))

    if (BUILTIN_KEYS.includes(sectorId)) {
      setBuiltinExtras(p => ({
        ...p,
        [sectorId]: [...new Set([...(p[sectorId] || []), stock.code])],
      }))
    } else {
      setCustomSectors(p => p.map(s =>
        s.id === sectorId
          ? { ...s, stocks: [...new Set([...s.stocks, stock.code])] }
          : s
      ))
    }
  }

  function removeStock(sectorId, code) {
    if (BUILTIN_KEYS.includes(sectorId)) {
      setBuiltinExtras(p => ({
        ...p,
        [sectorId]: (p[sectorId] || []).filter(c => c !== code),
      }))
    } else {
      setCustomSectors(p => p.map(s =>
        s.id === sectorId ? { ...s, stocks: s.stocks.filter(c => c !== code) } : s
      ))
    }
  }

  function exportData() {
    return JSON.stringify({
      version: 3,
      exportedAt: new Date().toISOString(),
      customSectors,
      customStockInfo,
      builtinExtras,
    }, null, 2)
  }

  function importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr)
      // 相容各種格式
      const sectors   = data.customSectors   || data.sectors   || []
      const stockInfo = data.customStockInfo || data.stockInfo || {}
      const extras    = data.builtinExtras   || data.extras    || {}
      if (sectors.length || Object.keys(stockInfo).length) {
        setCustomSectors(sectors)
        setCustomStockInfo(stockInfo)
        setBuiltinExtras(extras)
        // 立即強制寫入
        setTimeout(() => persistAll(sectors, stockInfo, extras), 100)
        return { ok: true, msg: `✅ 匯入成功：${Object.keys(stockInfo).length} 檔股票` }
      }
      return { ok: false, msg: '資料中沒有自選股' }
    } catch (e) {
      return { ok: false, msg: '格式錯誤：' + e.message }
    }
  }

  function diagnose() {
    return {
      memory: { sectors: customSectors.length, stocks: Object.keys(customStockInfo).length, extras: Object.values(builtinExtras).flat().length },
      ls:     { sectors: safeRead(LS.SECTORS,[])?.length, stocks: Object.keys(safeRead(LS.STOCKS,{})).length },
      backup: safeRead(LS.BACKUP, null),
      emerg:  safeRead(LS.EMERG,  null),
    }
  }

  return {
    customSectors, customStockInfo, builtinExtras,
    addSector, deleteSector, addStock, removeStock,
    exportData, importData, diagnose,
  }
}
