import { useState, useCallback, useEffect } from 'react'
import { SECTORS, INITIAL_CAPITAL } from './data/sectors.js'
import { DEFAULT_API_KEY } from './config.js'
import {
  CANDLES_CACHE, initCandleCache, loadRealCandlesForSector,
  generateCandles, calcMA, calcRSI,
} from './services/stockApi.js'
import { analyzeStock } from './services/claudeApi.js'
import { useCustomStocks } from './hooks/useCustomStocks.js'

import Header        from './components/Header.jsx'
import NavTabs       from './components/NavTabs.jsx'
import Toast         from './components/Toast.jsx'
import MarketTab     from './components/MarketTab.jsx'
import AnalysisTab   from './components/AnalysisTab.jsx'
import SignalsTab    from './components/SignalsTab.jsx'
import PortfolioTab  from './components/PortfolioTab.jsx'
import OrderModal    from './components/OrderModal.jsx'
import ApiKeyModal   from './components/ApiKeyModal.jsx'
import AddStockModal from './components/AddStockModal.jsx'

initCandleCache(SECTORS)

export default function App() {
  const [tab,       setTab]       = useState('market')
  const [sector,    setSector]    = useState('ai')
  const [selStock,  setSelStock]  = useState(null)
  const [selSector, setSelSector] = useState(null)
  const [analyses,  setAnalyses]  = useState({})
  const [signals,   setSignals]   = useState([])
  const [orderSig,  setOrderSig]  = useState(null)
  const [cash,      setCash]      = useState(INITIAL_CAPITAL)
  const [holdings,  setHoldings]  = useState([])
  const [busy,      setBusy]      = useState(false)
  const [toast,     setToast]     = useState(null)
  const [apiKey,    setApiKey]    = useState(DEFAULT_API_KEY)
  const [showKey,   setShowKey]   = useState(false)
  const [showAdd,   setShowAdd]   = useState(false)
  const [loadedSectors, setLoadedSectors] = useState({})
  const [loading,   setLoading]   = useState(false)

  const {
    customSectors, customStockInfo,
    addSector, renameSector, deleteSector,
    addStock, removeStock,
  } = useCustomStocks()

  const pop = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Merge built-in + custom sectors for display
  const allSectors = {
    ...SECTORS,
    ...Object.fromEntries(
      customSectors.map(s => [s.id, {
        name: s.name, tag: s.tag, color: s.color,
        stocks: s.stocks.map(code => ({
          code,
          name: customStockInfo[code]?.name || code,
          base: customStockInfo[code]?.base || 100,
        })),
        isCustom: true,
        sectorId: s.id,
      }])
    ),
  }

  // Init candle cache for custom stocks
  useEffect(() => {
    Object.values(customStockInfo).forEach(st => {
      if (!CANDLES_CACHE[st.code]) {
        CANDLES_CACHE[st.code] = generateCandles(st.base, st.code)
      }
    })
  }, [customStockInfo])

  // Load real data when sector changes
  useEffect(() => {
    if (loadedSectors[sector]) return
    const sec = allSectors[sector]
    if (!sec?.stocks?.length) return
    setLoading(true)
    loadRealCandlesForSector(sec.stocks).then(() => {
      setLoadedSectors(p => ({ ...p, [sector]: true }))
      setLoading(false)
    })
  }, [sector])

  const totalValue = cash + holdings.reduce((s, h) => {
    const cs = CANDLES_CACHE[h.code]
    return s + (cs ? cs[cs.length - 1].close : h.buyPrice) * h.shares
  }, 0)

  const doAnalyze = useCallback(async (stock, sKey, force = false) => {
    if (!apiKey) { setShowKey(true); return }
    setSelStock(stock)
    setSelSector(sKey)
    setTab('analysis')
    if ((analyses[stock.code] && !force) || busy) return

    setBusy(true)
    const cs    = CANDLES_CACHE[stock.code]
    const ma5   = calcMA(cs, 5)
    const ma10  = calcMA(cs, 10)
    const ma20  = calcMA(cs, 20)
    const rsi14 = calcRSI(cs, 14)

    try {
      const result = await analyzeStock({ stock, candles: cs, ma5, ma10, ma20, rsi14, apiKey })
      setAnalyses(p => ({ ...p, [stock.code]: result }))
      if (result.signal === '買入' && (result.confidence || 0) >= 60) {
        const sig = { id: Date.now() + Math.random(), stock, analysis: result,
          price: cs[cs.length - 1].close, time: new Date(), done: false }
        setSignals(p => [sig, ...p].slice(0, 12))
        pop(`🔔 ${stock.name} 買入信號！信心 ${result.confidence}%`, 'buy')
      }
    } catch (e) {
      let msg = `分析失敗：${e.message}`
      if (e.message === 'INVALID_KEY') { msg = 'API Key 無效'; setApiKey(''); setShowKey(true) }
      if (e.message === 'NO_CREDITS') msg = '⚠️ API 帳戶餘額不足！請至 console.anthropic.com 購買 Credits'
      setAnalyses(p => ({
        ...p, [stock.code]: { pattern: '分析失敗', trend: '—', signal: '觀望',
          confidence: 0, analysis: msg, error: true },
      }))
    }
    setBusy(false)
  }, [analyses, busy, apiKey])

  const buy = (sig, shares) => {
    const cost = sig.price * shares
    if (cost > cash) { pop('資金不足！', 'err'); return }
    const uid = `${sig.stock.code}-${Date.now()}`
    setCash(p => p - cost)
    setHoldings(p => [...p, { ...sig.stock, buyPrice: sig.price, shares,
      when: new Date(), target: sig.analysis.target, stop: sig.analysis.stopLoss, uid }])
    setSignals(p => p.map(s => s.id === sig.id ? { ...s, done: true } : s))
    setOrderSig(null)
    pop(`✅ 買入 ${sig.stock.name} ${shares.toLocaleString()} 股`, 'buy')
  }

  const sell = (h) => {
    const cs = CANDLES_CACHE[h.code]
    const price = cs ? cs[cs.length - 1].close : h.buyPrice
    const profit = (price - h.buyPrice) * h.shares
    setCash(p => p + price * h.shares)
    setHoldings(p => p.filter(x => x.uid !== h.uid))
    pop(`💰 賣出 ${h.name}，${profit >= 0 ? '盈利' : '虧損'} NT$${Math.abs(Math.round(profit)).toLocaleString('zh-TW')}`,
      profit >= 0 ? 'buy' : 'err')
  }

  const handleAddStock = (sectorId, stock) => {
    addStock(sectorId, stock)
    // reset loaded state so real data gets fetched
    setLoadedSectors(p => { const n = {...p}; delete n[sectorId]; return n })
    pop(`✅ ${stock.name || stock.code} 已加入自選`, 'buy')
  }

  const handleAddSector = (name, tag) => {
    addSector(name, tag)
    pop(`✅ 分類「${name}」已建立`, 'buy')
  }

  const handleDeleteSector = (id) => {
    if (!confirm('確定刪除此分類？')) return
    deleteSector(id)
    if (sector === id) setSector('ai')
    pop('分類已刪除')
  }

  const handleRemoveStock = (sectorId, code) => {
    removeStock(sectorId, code)
  }

  const pendingCnt = signals.filter(s => !s.done).length

  return (
    <div style={{
      background: '#0b0f1e', minHeight: '100vh',
      color: '#e2e8f0', fontFamily: 'system-ui,-apple-system,sans-serif',
      overflow: 'hidden', position: 'relative',
    }}>
      <Toast toast={toast} />

      {/* Top-right controls */}
      <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 50, display: 'flex', gap: 6 }}>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '4px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
          background: '#1e3a2f', border: '1px solid #22c55e44', color: '#22c55e', fontFamily: 'inherit',
        }}>＋ 自選股</button>
        <button onClick={() => setShowKey(true)} style={{
          padding: '4px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
          background: apiKey ? '#0f2b1e' : '#2b1a0f',
          border: `1px solid ${apiKey ? '#22c55e44' : '#f59e0b44'}`,
          color: apiKey ? '#22c55e' : '#f59e0b', fontFamily: 'inherit',
        }}>{apiKey ? '🔑 API已設定' : '🔑 設定API'}</button>
      </div>

      <Header totalValue={totalValue} />
      <NavTabs tab={tab} setTab={setTab} pendingCount={pendingCnt} holdingCount={holdings.length} />

      <div style={{ padding: '14px 16px', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
        {tab === 'market' && (
          <MarketTab
            sector={sector} setSector={setSector}
            allSectors={allSectors}
            onAnalyze={doAnalyze} loading={loading}
            onDeleteSector={handleDeleteSector}
            onRemoveStock={handleRemoveStock}
          />
        )}
        {tab === 'analysis' && (
          <AnalysisTab
            stock={selStock} sectorKey={selSector}
            allSectors={allSectors}
            analysis={selStock ? analyses[selStock.code] : null}
            busy={busy}
            onReanalyze={(s, sk) => doAnalyze(s, sk, true)}
          />
        )}
        {tab === 'signals' && <SignalsTab signals={signals} onOrder={setOrderSig} />}
        {tab === 'portfolio' && <PortfolioTab holdings={holdings} cash={cash} onSell={sell} />}
      </div>

      {orderSig && <OrderModal sig={orderSig} cash={cash} onBuy={buy} onClose={() => setOrderSig(null)} />}
      {showKey   && <ApiKeyModal onSave={k => { setApiKey(k); setShowKey(false); pop('✅ API Key 設定成功', 'buy') }} />}
      {showAdd   && (
        <AddStockModal
          customSectors={customSectors}
          onAddStock={handleAddStock}
          onAddSector={handleAddSector}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
