import { useState, useCallback, useEffect } from 'react'
import { SECTORS, INITIAL_CAPITAL } from './data/sectors.js'
import { CANDLES_CACHE, initCandleCache, calcMA, calcRSI } from './services/stockApi.js'
import { analyzeStock } from './services/claudeApi.js'

import Header      from './components/Header.jsx'
import NavTabs     from './components/NavTabs.jsx'
import Toast       from './components/Toast.jsx'
import MarketTab   from './components/MarketTab.jsx'
import AnalysisTab from './components/AnalysisTab.jsx'
import SignalsTab  from './components/SignalsTab.jsx'
import PortfolioTab from './components/PortfolioTab.jsx'
import OrderModal  from './components/OrderModal.jsx'

// Initialise candle data once
initCandleCache(SECTORS)

export default function App() {
  const [tab,        setTab]        = useState('market')
  const [sector,     setSector]     = useState('ai')
  const [selStock,   setSelStock]   = useState(null)
  const [selSector,  setSelSector]  = useState(null)
  const [analyses,   setAnalyses]   = useState({})
  const [signals,    setSignals]    = useState([])
  const [orderSig,   setOrderSig]   = useState(null)
  const [cash,       setCash]       = useState(INITIAL_CAPITAL)
  const [holdings,   setHoldings]   = useState([])
  const [busy,       setBusy]       = useState(false)
  const [toast,      setToast]      = useState(null)

  const pop = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const totalValue = cash + holdings.reduce((s, h) => {
    const cs = CANDLES_CACHE[h.code]
    return s + (cs ? cs[cs.length - 1].close : h.buyPrice) * h.shares
  }, 0)

  const doAnalyze = useCallback(async (stock, sKey, force = false) => {
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
      const result = await analyzeStock({ stock, candles: cs, ma5, ma10, ma20, rsi14 })
      setAnalyses(p => ({ ...p, [stock.code]: result }))

      if (result.signal === '買入' && (result.confidence || 0) >= 60) {
        const last = cs[cs.length - 1]
        const sig  = {
          id:       Date.now() + Math.random(),
          stock,
          analysis: result,
          price:    last.close,
          time:     new Date(),
          done:     false,
        }
        setSignals(p => [sig, ...p].slice(0, 12))
        pop(`🔔 ${stock.name} 買入信號！信心 ${result.confidence}%`, 'buy')
      }
    } catch {
      setAnalyses(p => ({
        ...p,
        [stock.code]: {
          pattern: '分析失敗', trend: '—', signal: '觀望',
          confidence: 0, analysis: '無法連接 Claude API，請確認網路與 API 設定', error: true,
        },
      }))
    }
    setBusy(false)
  }, [analyses, busy])

  const buy = (sig, shares) => {
    const cost = sig.price * shares
    if (cost > cash) { pop('資金不足！', 'err'); return }
    const uid = `${sig.stock.code}-${Date.now()}`
    setCash(p => p - cost)
    setHoldings(p => [...p, {
      ...sig.stock,
      buyPrice: sig.price,
      shares,
      when:   new Date(),
      target: sig.analysis.target,
      stop:   sig.analysis.stopLoss,
      uid,
    }])
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
    pop(
      `💰 賣出 ${h.name}，${profit >= 0 ? '盈利' : '虧損'} NT$${Math.abs(Math.round(profit)).toLocaleString('zh-TW')}`,
      profit >= 0 ? 'buy' : 'err',
    )
  }

  return (
    <div style={{
      background: '#0b0f1e', minHeight: '100vh', borderRadius: 12,
      color: '#e2e8f0', fontFamily: "system-ui,-apple-system,sans-serif",
      overflow: 'hidden', position: 'relative',
    }}>
      <Toast toast={toast} />

      <Header totalValue={totalValue} />

      <NavTabs
        tab={tab} setTab={setTab}
        pendingCount={signals.filter(s => !s.done).length}
        holdingCount={holdings.length}
      />

      <div style={{ padding: '14px 16px', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
        {tab === 'market' && (
          <MarketTab sector={sector} setSector={setSector} onAnalyze={doAnalyze} />
        )}
        {tab === 'analysis' && (
          <AnalysisTab
            stock={selStock} sectorKey={selSector}
            analysis={selStock ? analyses[selStock.code] : null}
            busy={busy}
            onReanalyze={(s, sk) => doAnalyze(s, sk, true)}
          />
        )}
        {tab === 'signals' && (
          <SignalsTab signals={signals} onOrder={setOrderSig} />
        )}
        {tab === 'portfolio' && (
          <PortfolioTab holdings={holdings} cash={cash} onSell={sell} />
        )}
      </div>

      {orderSig && (
        <OrderModal sig={orderSig} cash={cash} onBuy={buy} onClose={() => setOrderSig(null)} />
      )}
    </div>
  )
}
