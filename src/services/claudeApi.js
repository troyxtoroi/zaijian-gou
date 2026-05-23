/**
 * Claude AI analysis — direct browser call with user-provided API key.
 * Requires 'anthropic-dangerous-direct-browser-access: true' header.
 */

const MODEL = 'claude-sonnet-4-20250514'

export async function analyzeStock({ stock, candles, ma5, ma10, ma20, rsi14, apiKey }) {
  if (!apiKey) throw new Error('NO_API_KEY')

  const last     = candles[candles.length - 1]
  const priceStr = candles.slice(-10)
    .map((c, i) => `D${i+1}:O${c.open}H${c.high}L${c.low}C${c.close}V${c.volume}`)
    .join('|')

  const prompt = `你是資深台股技術分析師。請分析以下股票K線型態並給出操作建議。

股票：${stock.code} ${stock.name}
現價：${last.close}
MA5：${ma5?.toFixed(1)}  MA10：${ma10?.toFixed(1)}  MA20：${ma20?.toFixed(1)}
RSI(14)：${rsi14?.toFixed(1)}

近10日K線 (開/高/低/收/量)：${priceStr}

分析重點：K線型態識別、多空趨勢、支撐壓力、具體進出場策略。

只回純JSON，不加任何說明或markdown：
{"pattern":"K線型態","trend":"上漲/下跌/盤整","signal":"買入/賣出/觀望","confidence":整數0到100,"analysis":"技術分析說明60字以內","entry":進場價格數字,"stopLoss":停損價格數字,"target":目標價格數字,"timeframe":"短線3-5天/中線2-4週/長線1-3月","risk":"低/中/高"}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (res.status === 401) throw new Error('INVALID_KEY')
  if (!res.ok) throw new Error(`API_ERROR_${res.status}`)

  const data  = await res.json()
  let text    = data.content?.[0]?.text || '{}'
  text        = text.replace(/```json|```/g, '').trim()
  const start = text.indexOf('{'), end = text.lastIndexOf('}')
  if (start >= 0 && end > start) text = text.slice(start, end + 1)

  return JSON.parse(text)
}
