import { useState, useEffect } from 'react'

const LS_SECTORS = 'zaijian_custom_sectors'
const LS_STOCKS  = 'zaijian_custom_stocks'

const SECTOR_COLORS = [
  '#f472b6', '#a78bfa', '#34d399', '#fbbf24',
  '#60a5fa', '#f87171', '#2dd4bf', '#fb923c',
]

function loadFromLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

export function useCustomStocks() {
  const [customSectors, setCustomSectors] = useState(() =>
    loadFromLS(LS_SECTORS, [])
  )
  const [customStockInfo, setCustomStockInfo] = useState(() =>
    loadFromLS(LS_STOCKS, {})
  )

  // Persist to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem(LS_SECTORS, JSON.stringify(customSectors))
  }, [customSectors])

  useEffect(() => {
    localStorage.setItem(LS_STOCKS, JSON.stringify(customStockInfo))
  }, [customStockInfo])

  /** Add a new custom category */
  function addSector(name, tag = '⭐') {
    const id = `custom_${Date.now()}`
    const color = SECTOR_COLORS[customSectors.length % SECTOR_COLORS.length]
    setCustomSectors(prev => [...prev, { id, name, tag, color, stocks: [] }])
    return id
  }

  /** Rename a custom category */
  function renameSector(id, name, tag) {
    setCustomSectors(prev => prev.map(s =>
      s.id === id ? { ...s, name, tag } : s
    ))
  }

  /** Delete a custom category */
  function deleteSector(id) {
    setCustomSectors(prev => prev.filter(s => s.id !== id))
  }

  /** Add a stock to a sector (built-in key or custom id) */
  function addStock(sectorId, stock) {
    // Save stock info
    setCustomStockInfo(prev => ({
      ...prev,
      [stock.code]: { code: stock.code, name: stock.name, base: stock.base || 100 },
    }))
    // Add to sector
    setCustomSectors(prev => prev.map(s =>
      s.id === sectorId
        ? { ...s, stocks: s.stocks.includes(stock.code) ? s.stocks : [...s.stocks, stock.code] }
        : s
    ))
  }

  /** Remove a stock from a sector */
  function removeStock(sectorId, code) {
    setCustomSectors(prev => prev.map(s =>
      s.id === sectorId ? { ...s, stocks: s.stocks.filter(c => c !== code) } : s
    ))
  }

  return {
    customSectors, customStockInfo,
    addSector, renameSector, deleteSector,
    addStock, removeStock,
  }
}
