/**
 * Claude AI 分析 — 整合市場情境、Computex、外資評等
 */
import { getSectorContext, getStockRating, MARKET_CONTEXT } from '../data/marketContext.js'

const MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-3-5-haiku-20241022',
  'claude-3-haiku-20240307',
]

export async function analyzeStock({ stock, candles, ma5, ma10, ma20, rsi14, apiKey, sectorKey }) {
  if (!apiKey) throw new Error('NO_API_KEY')

  const last     = candles[candles.length - 1]
  const priceStr = candles.slice(-10)
    .map((c, i) => `D${i+1}:O${c.open}H${c.high}L${c.low}C${c.close}V${c.volume}`)
    .join('|')

  const marketCtx  = getSectorContext(sectorKey || '')
  const stockRating = getStockRating(stock.code)
  const ratingStr  = stockRating
    ? `外資/券商評等：${stockRating.rating}，目標價${stockRating.target}元（${stockRating.broker}）—— ${stockRating.note}`
    : '暫無外資評等資料'

  const prompt = `你是台股頂尖技術分析師，同時精通基本面與市場動態。請對以下股票進行全面分析：

【股票基本資訊】
代號：${stock.code}  名稱：${stock.name}
現價：${last.close}  MA5:${ma5?.toFixed(1)} MA10:${ma10?.toFixed(1)} MA20:${ma20?.toFixed(1)}  RSI(14):${rsi14?.toFixed(1)}
近10日K線(開高低收量)：${priceStr}

【外資/券商評等】
${ratingStr}

${marketCtx}

請綜合K線技術面 + 市場消息面 + 外資評等，給出完整分析。
只回純JSON，不加任何說明：
{"pattern":"K線型態","trend":"上漲/下跌/盤整","signal":"買入/賣出/觀望","confidence":整數0到100,"analysis":"結合技術面與市場面的分析說明（100字以內）","marketSentiment":"正面/中性/負面","computexCatalyst":"此股與Computex相關度說明（20字）","entry":數字,"stopLoss":數字,"target":數字,"timeframe":"短線3-5天/中線2-4週/長線1-3月","risk":"低/中/高","analystRating":"${stockRating?.rating || '無評等'}"}`

  let lastErr = null
  for (const model of MODELS) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model,
          max_tokens: 700,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      const data = await res.json()
      if (res.status === 401) throw new Error('INVALID_KEY')
      if (data.error?.message?.includes('credit')) throw new Error('NO_CREDITS')
      if (!res.ok) { lastErr = new Error(`API_ERROR_${res.status}`); continue }

      let text = data.content?.[0]?.text || '{}'
      text = text.replace(/```json|```/g, '').trim()
      const s = text.indexOf('{'), e = text.lastIndexOf('}')
      if (s >= 0 && e > s) text = text.slice(s, e + 1)

      return JSON.parse(text)
    } catch (e) {
      if (e.message === 'INVALID_KEY' || e.message === 'NO_CREDITS') throw e
      lastErr = e
    }
  }
  throw lastErr || new Error('ALL_MODELS_FAILED')
}
