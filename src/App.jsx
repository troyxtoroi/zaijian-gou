import { useState, useCallback, useEffect, useRef } from 'react'
import { SECTORS, INITIAL_CAPITAL } from './data/sectors.js'
import {
  CANDLES_CACHE, initCandleCache, loadRealCandlesForSector,
  generateCandles, calcMA, calcRSI,
} from './services/stockApi.js'
import { analyzeLocally } from './services/localAnalysis.js'
import { analyzeStock   } from './services/claudeApi.js'
import { useCustomStocks } from './hooks/useCustomStocks.js'

import Header        from './components/Header.jsx'
import NavTabs       from './components/NavTabs.jsx'
import Toast         from './components/Toast.jsx'
import MarketTab     from './components/MarketTab.jsx'
import AnalysisTab   from './components/AnalysisTab.jsx'
import SignalsTab    from './components/SignalsTab.jsx'
import PortfolioTab  from './components/PortfolioTab.jsx'
import ScannerTab    from './components/ScannerTab.jsx'
import OrderModal    from './components/OrderModal.jsx'
import ApiKeyModal   from './components/ApiKeyModal.jsx'
import AddStockModal from './components/AddStockModal.jsx'

const LS_KEY = 'zaijian_api_key'
initCandleCache(SECTORS)

export default function App() {
  const [tab,       setTab]         = useState('market')
  const [sector,    setSector]      = useState('ai')
  const [selStock,  setSelStock]    = useState(null)
  const [selSector, setSelSector]   = useState(null)
  const [analyses,  setAnalyses]    = useState({})
  const [signals,   setSignals]     = useState([])
  const [orderSig,  setOrderSig]    = useState(null)
  const [cash,      setCash]        = useState(INITIAL_CAPITAL)
  const [holdings,  setHoldings]    = useState([])
  const [busy,      setBusy]        = useState(false)
  const [toast,     setToast]       = useState(null)
  const [apiKey,    setApiKeyState] = useState(() => localStorage.getItem(LS_KEY) || '')
  const [showKey,   setShowKey]     = useState(false)
  const [showAdd,   setShowAdd]     = useState(false)
  const [loadedSectors, setLoadedSectors] = useState({})
  const [loading,   setLoading]     = useState(false)
  const [analyzeMode, setAnalyzeMode] = useState('local')
  const refreshTimer = useRef(null)

  const {
    customSectors, customStockInfo, builtinExtras,
    addSector, deleteSector, addStock, removeStock,
  } = useCustomStocks()

  const setApiKey = k => {
    setApiKeyState(k)
    k ? localStorage.setItem(LS_KEY, k) : localStorage.removeItem(LS_KEY)
  }

  const pop = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── 建立完整族群資料（原有 + 自訂 + 加入原有的自選股）────────
  const allSectors = {
    // 原有族群（含加入的自選股）
    ...Object.fromEntries(
      Object.entries(SECTORS).map(([k, sec]) => [k, {
        ...sec,
        stocks: [
          ...sec.stocks,
          ...(builtinExtras[k] || []).map(code => ({
            code,
            name: customStockInfo[code]?.name || code,
            base: customStockInfo[code]?.base || 100,
            otc:  customStockInfo[code]?.otc  || false,
            isExtra: true,
          })),
        ],
      }])
    ),
    // 自訂族群
    ...Object.fromEntries(
      customSectors.map(s => [s.id, {
        name: s.name, tag: s.tag, color: s.color,
        stocks: s.stocks.map(code => ({
          code,
          name: customStockInfo[code]?.name || code,
          base: customStockInfo[code]?.base || 100,
          otc:  customStockInfo[code]?.otc  || false,
        })),
        isCustom: true, sectorId: s.id,
      }])
    ),
  }

  // ── 初始化自選股的 K 線快取 ─────────────────────────────────
  useEffect(() => {
    const allCustomCodes = [
      ...Object.values(builtinExtras).flat(),
      ...customSectors.flatMap(s => s.stocks),
    ]
    allCustomCodes.forEach(code => {
      if (!CANDLES_CACHE[code]) {
        const info = customStockInfo[code]
        CANDLES_CACHE[code] = generateCandles(info?.base || 100, code)
      }
    })
  }, [customStockInfo, builtinExtras, customSectors])

  // ── 載入真實股價 ─────────────────────────────────────────────
  const loadSector = useCallback(async sKey => {
    const sec = allSectors[sKey]
    if (!sec?.stocks?.length) return
    setLoading(true)
    await loadRealCandlesForSector(sec.stocks)
    setLoadedSectors(p => ({ ...p, [sKey]: Date.now() }))
    setLoading(false)
  }, [])

  // 族群切換時載入
  useEffect(() => {
    if (!loadedSectors[sector]) loadSector(sector)
  }, [sector])

  // 自選股加入後重新載入當前族群
  const prevExtraCountRef = useRef(0)
  useEffect(() => {
    const currCount = Object.values(builtinExtras).flat().length + customSectors.flatMap(s => s.stocks).length
    if (currCount !== prevExtraCountRef.current) {
      prevExtraCountRef.current = currCount
      // 強制重新載入當前族群
      setLoadedSectors(p => { const n = {...p}; delete n[sector]; return n })
    }
  }, [builtinExtras, customSectors])

  // 自動刷新（每 5 分鐘）
  useEffect(() => {
    clearInterval(refreshTimer.current)
    refreshTimer.current = setInterval(() => {
      const sec = allSectors[sector]
      if (!sec?.stocks?.length) return
      loadRealCandlesForSector(sec.stocks).then(() =>
        setLoadedSectors(p => ({ ...p, [sector]: Date.now() }))
      )
    }, 5 * 60 * 1000)
    return () => clearInterval(refreshTimer.current)
  }, [sector])

  const totalValue = cash + holdings.reduce((s, h) => {
    const cs = CANDLES_CACHE[h.code]
    return s + (cs ? cs[cs.length - 1].close : h.buyPrice) * h.shares
  }, 0)

  // ── 分析核心 ─────────────────────────────────────────────────
  const doAnalyze = useCallback(async (stock, sKey, force = false) => {
    setSelStock(stock); setSelSector(sKey); setTab('analysis')
    if (analyses[stock.code] && !force) return
    if (busy) return
    setBusy(true)
    try {
      const cs = CANDLES_CACHE[stock.code]
      if (!cs || cs.length < 5) throw new Error('K線資料不足，請稍後再試')
      const ma5   = calcMA(cs, 5)
      const ma10  = calcMA(cs, 10)
      const ma20  = calcMA(cs, 20)
      const rsi14 = calcRSI(cs, 14)
      let result

      if (analyzeMode === 'local' || !apiKey) {
        result = analyzeLocally({ stock, candles: cs, ma5, ma10, ma20, sectorKey: sKey })
        result.isLocal = true
      } else {
        try {
          result = await analyzeStock({ stock, candles: cs, ma5, ma10, ma20, rsi14, apiKey, sectorKey: sKey })
          result.isLocal = false
        } catch (e) {
          if (e.message === 'NO_CREDITS') pop('⚠️ API 餘額不足，請至 console.anthropic.com 儲值', 'err')
          if (e.message === 'INVALID_KEY') { setApiKey(''); setShowKey(true) }
          result = analyzeLocally({ stock, candles: cs, ma5, ma10, ma20, sectorKey: sKey })
          result.isLocal = true
        }
      }

      setAnalyses(p => ({ ...p, [stock.code]: result }))
      if (result.signal === '買入' && result.confidence >= 65) {
        const sig = { id: Date.now() + Math.random(), stock, analysis: result,
          price: cs[cs.length - 1].close, time: new Date(), done: false }
        setSignals(p => [sig, ...p].slice(0, 15))
        pop(`🔔 ${stock.name} 買入信號！信心 ${result.confidence}%`, 'buy')
      }
    } catch (err) {
      setAnalyses(p => ({
        ...p, [stock.code]: { pattern: '分析失敗', trend: '—', signal: '觀望',
          confidence: 0, analysis: err.message, error: true, isLocal: true },
      }))
    } finally {
      setBusy(false)
    }
  }, [analyses, busy, apiKey, analyzeMode])

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
    const cs    = CANDLES_CACHE[h.code]
    const price = cs ? cs[cs.length - 1].close : h.buyPrice
    const profit = (price - h.buyPrice) * h.shares
    setCash(p => p + price * h.shares)
    setHoldings(p => p.filter(x => x.uid !== h.uid))
    pop(`💰 賣出 ${h.name}，${profit >= 0 ? '盈利' : '虧損'} NT$${Math.abs(Math.round(profit)).toLocaleString('zh-TW')}`,
      profit >= 0 ? 'buy' : 'err')
  }

  const handleAddStock = (sectorId, stock) => {
    addStock(sectorId, stock)
    pop(`✅ ${stock.name || stock.code} 已加入`, 'buy')
  }

  const pendingCnt = signals.filter(s => !s.done).length

  return (
    <div style={{
      background: '#0b0f1e', minHeight: '100vh',
      color: '#e2e8f0', fontFamily: 'system-ui,-apple-system,sans-serif',
      overflow: 'hidden', position: 'relative',
    }}>
      <Toast toast={toast} />

      {/* 右上角控制列 */}
      <div style={{
        position: 'absolute', top: 14, right: 14, zIndex: 50,
        display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end',
      }}>
        <div style={{ display: 'flex', background: '#0f1628', border: '1px solid #1e2d4d', borderRadius: 6, overflow: 'hidden' }}>
          {[
            { k: 'local',  label: '📐 免費分析' },
            { k: 'claude', label: '🤖 Claude AI' },
          ].map(m => (
            <button key={m.k} onClick={() => setAnalyzeMode(m.k)} style={{
              padding: '5px 11px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              background: analyzeMode === m.k ? '#1e2d4d' : 'transparent',
              border: 'none', color: analyzeMode === m.k ? '#818cf8' : '#475569',
              fontWeight: analyzeMode === m.k ? 700 : 400,
            }}>{m.label}</button>
          ))}
        </div>

        <button onClick={() => {
          setLoadedSectors(p => { const n = {...p}; delete n[sector]; return n })
          pop('🔄 刷新中...', 'ok')
        }} style={{
          padding: '5px 9px', fontSize: 13, borderRadius: 6, cursor: 'pointer',
          background: '#151d35', border: '1px solid #1e2d4d', color: '#64748b', fontFamily: 'inherit',
        }}>⟳</button>

        <button onClick={() => setShowAdd(true)} style={{
          padding: '5px 11px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
          background: '#1e3a2f', border: '1px solid #22c55e44', color: '#22c55e', fontFamily: 'inherit',
        }}>＋ 自選</button>

        <button onClick={() => setShowKey(true)} style={{
          padding: '5px 11px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
          background: apiKey ? '#0f2b1e' : '#151d35',
          border: `1px solid ${apiKey ? '#22c55e44' : '#1e2d4d'}`,
          color: apiKey ? '#22c55e' : '#64748b', fontFamily: 'inherit',
        }}>{apiKey ? '🔑 API✓' : '🔑 API'}</button>
      </div>

      <Header totalValue={totalValue} />
      <NavTabs tab={tab} setTab={setTab} pendingCount={pendingCnt} holdingCount={holdings.length} />

      <div style={{ padding: '14px 16px', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
        {tab === 'market' && (
          <MarketTab
            sector={sector} setSector={setSector} allSectors={allSectors}
            onAnalyze={doAnalyze} loading={loading}
            onDeleteSector={id => { if(confirm('確定刪除此分類？')) { deleteSector(id); if(sector===id) setSector('ai') }}}
            onRemoveStock={removeStock}
          />
        )}
        {tab === 'analysis' && (
          <AnalysisTab stock={selStock} sectorKey={selSector} allSectors={allSectors}
            analysis={selStock ? analyses[selStock.code] : null}
            busy={busy} onReanalyze={(s, sk) => doAnalyze(s, sk, true)} />
        )}
        {tab === 'scanner' && (
          <ScannerTab allSectors={allSectors} onAnalyze={(s, sk) => doAnalyze(s, sk, true)} />
        )}
        {tab === 'signals'   && <SignalsTab signals={signals} onOrder={setOrderSig} />}
        {tab === 'portfolio' && <PortfolioTab holdings={holdings} cash={cash} onSell={sell} />}
      </div>

      {orderSig && <OrderModal sig={orderSig} cash={cash} onBuy={buy} onClose={() => setOrderSig(null)} />}
      {showKey  && <ApiKeyModal onSave={k => { setApiKey(k); setShowKey(false); pop('✅ API Key 已儲存', 'buy') }} />}
      {showAdd  && (
        <AddStockModal
          customSectors={customSectors}
          onAddStock={handleAddStock}
          onAddSector={(n, t) => { addSector(n, t); pop(`✅ 分類「${n}」已建立`, 'buy') }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
