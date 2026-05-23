import { useState, useEffect } from 'react'

const LS_SECTORS  = 'zaijian_custom_sectors'
const LS_STOCKS   = 'zaijian_custom_stocks'
const LS_EXTRAS   = 'zaijian_builtin_extras'   // 加到原有族群的自選股

const COLORS = ['#f472b6','#a78bfa','#34d399','#fbbf24','#60a5fa','#f87171','#2dd4bf','#fb923c']
const BUILTIN_KEYS = ['ai','memory','satellite','passive','thermal','packaging']

function fromLS(key, fb) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fb } catch { return fb }
}

export function useCustomStocks() {
  const [customSectors,   setCustomSectors]   = useState(() => fromLS(LS_SECTORS, []))
  const [customStockInfo, setCustomStockInfo] = useState(() => fromLS(LS_STOCKS,  {}))
  const [builtinExtras,   setBuiltinExtras]   = useState(() => fromLS(LS_EXTRAS,  {}))
  // builtinExtras: { ai: ['2330','0050'], memory: [...], ... }

  useEffect(() => { localStorage.setItem(LS_SECTORS, JSON.stringify(customSectors)) },  [customSectors])
  useEffect(() => { localStorage.setItem(LS_STOCKS,  JSON.stringify(customStockInfo)) }, [customStockInfo])
  useEffect(() => { localStorage.setItem(LS_EXTRAS,  JSON.stringify(builtinExtras)) },  [builtinExtras])

  /** 新增自訂分類 */
  function addSector(name, tag = '⭐') {
    const id    = `custom_${Date.now()}`
    const color = COLORS[customSectors.length % COLORS.length]
    setCustomSectors(p => [...p, { id, name, tag, color, stocks: [] }])
    return id
  }

  /** 刪除自訂分類 */
  function deleteSector(id) {
    setCustomSectors(p => p.filter(s => s.id !== id))
  }

  /** 加入股票到任一族群（原有或自訂） */
  function addStock(sectorId, stock) {
    // 1. 存股票資訊
    setCustomStockInfo(p => ({
      ...p,
      [stock.code]: { code: stock.code, name: stock.name, base: stock.base || 100, otc: stock.otc || false },
    }))

    // 2. 加到正確的族群
    if (BUILTIN_KEYS.includes(sectorId)) {
      // 原有族群 → 存到 builtinExtras
      setBuiltinExtras(p => ({
        ...p,
        [sectorId]: [...new Set([...(p[sectorId] || []), stock.code])],
      }))
    } else {
      // 自訂族群 → 存到 customSectors
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

  return {
    customSectors, customStockInfo, builtinExtras,
    addSector, deleteSector, addStock, removeStock,
  }
}
