import { useState, useEffect, useRef } from 'react'

const LS_SECTORS  = 'zaijian_custom_sectors'
const LS_STOCKS   = 'zaijian_custom_stocks'
const LS_EXTRAS   = 'zaijian_builtin_extras'
// 備份鍵（雙重保護）
const LS_BACKUP   = 'zaijian_backup'

const COLORS = ['#f472b6','#a78bfa','#34d399','#fbbf24','#60a5fa','#f87171','#2dd4bf','#fb923c']
const BUILTIN_KEYS = ['ai','memory','satellite','passive','thermal','packaging']

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw || raw === 'null' || raw === 'undefined') return fallback
    const parsed = JSON.parse(raw)
    // 基本型態驗證
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback
    if (!Array.isArray(fallback) && typeof parsed !== 'object') return fallback
    return parsed ?? fallback
  } catch { return fallback }
}

function safeWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

/** 從備份恢復 */
function tryRestoreFromBackup() {
  try {
    const raw = localStorage.getItem(LS_BACKUP)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

/** 保存備份 */
function saveBackup(sectors, stockInfo, extras) {
  try {
    localStorage.setItem(LS_BACKUP, JSON.stringify({ sectors, stockInfo, extras, ts: Date.now() }))
  } catch {}
}

export function useCustomStocks() {
  const initRef = useRef(false)

  // 初始化：先讀主鍵，若空則嘗試備份
  const [customSectors, setCustomSectors] = useState(() => {
    let data = safeRead(LS_SECTORS, null)
    if (!data || !Array.isArray(data) || data.length === 0) {
      const backup = tryRestoreFromBackup()
      if (backup?.sectors?.length > 0) {
        console.log('[ZG] 從備份還原 customSectors:', backup.sectors.length, '筆')
        return backup.sectors
      }
    }
    return data || []
  })

  const [customStockInfo, setCustomStockInfo] = useState(() => {
    let data = safeRead(LS_STOCKS, null)
    if (!data || Object.keys(data).length === 0) {
      const backup = tryRestoreFromBackup()
      if (backup?.stockInfo && Object.keys(backup.stockInfo).length > 0) {
        console.log('[ZG] 從備份還原 stockInfo:', Object.keys(backup.stockInfo).length, '筆')
        return backup.stockInfo
      }
    }
    return data || {}
  })

  const [builtinExtras, setBuiltinExtras] = useState(() => {
    let data = safeRead(LS_EXTRAS, null)
    if (!data || Object.keys(data).length === 0) {
      const backup = tryRestoreFromBackup()
      if (backup?.extras && Object.keys(backup.extras).length > 0) {
        console.log('[ZG] 從備份還原 builtinExtras:', JSON.stringify(backup.extras))
        return backup.extras
      }
    }
    return data || {}
  })

  // 儲存到 localStorage（每次有變更就存，且寫備份）
  const saveTimer = useRef(null)
  const pendingSave = useRef({ sectors: null, stockInfo: null, extras: null })

  function debouncedSave() {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const s = pendingSave.current
      if (s.sectors !== null)   safeWrite(LS_SECTORS, s.sectors)
      if (s.stockInfo !== null) safeWrite(LS_STOCKS,  s.stockInfo)
      if (s.extras !== null)    safeWrite(LS_EXTRAS,  s.extras)
      // 備份（不管哪個有更新都存完整備份）
      saveBackup(
        s.sectors  ?? safeRead(LS_SECTORS, []),
        s.stockInfo ?? safeRead(LS_STOCKS, {}),
        s.extras   ?? safeRead(LS_EXTRAS, {})
      )
    }, 300)
  }

  useEffect(() => {
    if (!initRef.current) { initRef.current = true; return }
    pendingSave.current.sectors = customSectors
    debouncedSave()
  }, [customSectors])

  useEffect(() => {
    if (!initRef.current) return
    pendingSave.current.stockInfo = customStockInfo
    debouncedSave()
  }, [customStockInfo])

  useEffect(() => {
    if (!initRef.current) return
    pendingSave.current.extras = builtinExtras
    debouncedSave()
  }, [builtinExtras])

  /** 新增自訂分類 */
  function addSector(name, tag = '⭐') {
    const id    = `custom_${Date.now()}`
    const color = COLORS[customSectors.length % COLORS.length]
    const newSector = { id, name, tag, color, stocks: [] }
    setCustomSectors(p => [...p, newSector])
    return id
  }

  /** 刪除自訂分類 */
  function deleteSector(id) {
    setCustomSectors(p => p.filter(s => s.id !== id))
  }

  /** 加入股票到任一族群（原有或自訂） */
  function addStock(sectorId, stock) {
    const stockData = {
      code: stock.code,
      name: stock.name || stock.code,
      base: stock.base || 100,
      otc:  stock.otc  || false,
    }

    // 儲存股票資訊
    setCustomStockInfo(p => ({
      ...p,
      [stock.code]: stockData,
    }))

    // 加到正確族群
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

  /** 從族群移除股票 */
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

  /** 診斷：列出所有已存股票 */
  function diagnose() {
    const result = {
      customSectors,
      customStockInfo,
      builtinExtras,
      lsSectors:   safeRead(LS_SECTORS, []),
      lsStocks:    safeRead(LS_STOCKS,  {}),
      lsExtras:    safeRead(LS_EXTRAS,  {}),
      backup:      tryRestoreFromBackup(),
    }
    console.log('[ZG] 診斷資料:', result)
    return result
  }

  /** 匯出所有自選股資料（JSON字串） */
  function exportData() {
    return JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      customSectors,
      customStockInfo,
      builtinExtras,
    }, null, 2)
  }

  /** 匯入自選股資料 */
  function importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr)
      if (data.customSectors)   setCustomSectors(data.customSectors)
      if (data.customStockInfo) setCustomStockInfo(data.customStockInfo)
      if (data.builtinExtras)   setBuiltinExtras(data.builtinExtras)
      return { ok: true, msg: `匯入成功：${Object.keys(data.customStockInfo||{}).length} 檔自選股` }
    } catch (e) {
      return { ok: false, msg: '匯入失敗：' + e.message }
    }
  }

  return {
    customSectors,
    customStockInfo,
    builtinExtras,
    addSector,
    deleteSector,
    addStock,
    removeStock,
    diagnose,
    exportData,
    importData,
  }
}
