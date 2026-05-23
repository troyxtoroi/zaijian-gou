/**
 * Claude AI analysis — direct browser call.
 * Requires 'anthropic-dangerous-direct-browser-access: true'
 * 
 * ⚠️ API Key 需要在 console.anthropic.com 購買 Credits 才能使用。
 */

// 依序嘗試的 models（由快到慢）
const MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-3-5-haiku-20241022',
  'claude-3-haiku-20240307',
]

export async function analyzeStock({ stock, candles, ma5, ma10, ma20, rsi14, apiKey }) {
  if (!apiKey) throw new Error('NO_API_KEY')

  const last     = candles[candles.length - 1]
  const priceStr = candles.slice(-10)
    .map((c, i) => `D${i+1}:O${c.open}H${c.high}L${c.low}C${c.close}V${c.volume}`)
    .join('|')

  const prompt = `台股技術分析師。分析：${stock.code} ${stock.name}，現價${last.close}，MA5:${ma5?.toFixed(1)} MA10:${ma10?.toFixed(1)} MA20:${ma20?.toFixed(1)}，RSI:${rsi14?.toFixed(1)}
近10日K線: ${priceStr}
只回純JSON：{"pattern":"K線型態","trend":"上漲/下跌/盤整","signal":"買入/賣出/觀望","confidence":0到100整數,"analysis":"技術分析50字","entry":數字,"stopLoss":數字,"target":數字,"timeframe":"短線/中線/長線","risk":"低/中/高"}`

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
          max_tokens: 500,
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
