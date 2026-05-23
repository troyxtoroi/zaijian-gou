/**
 * Claude AI analysis service.
 * Calls Anthropic /v1/messages directly from the browser.
 * In production, proxy this through your own backend to protect the API key.
 */

const MODEL = 'claude-sonnet-4-20250514'

export async function analyzeStock({ stock, candles, ma5, ma10, ma20, rsi14 }) {
  const last = candles[candles.length - 1]
  const priceStr = candles.slice(-10)
    .map((c, i) => `D${i + 1}:O${c.open}H${c.high}L${c.low}C${c.close}V${c.volume}`)
    .join('|')

  const prompt = `你是資深台股技術分析師。請分析以下股票的K線型態並給出操作建議。

股票：${stock.code} ${stock.name}
現價：${last.close}
MA5：${ma5?.toFixed(1)}  MA10：${ma10?.toFixed(1)}  MA20：${ma20?.toFixed(1)}
RSI(14)：${rsi14?.toFixed(1)}

近10日K線 (開/高/低/收/量)：
${priceStr}

分析重點：
1. 識別K線型態（錘子、吞噬、十字、突破等）
2. 判斷多空趨勢
3. 確認支撐/壓力位
4. 給出具體進場、停損、目標

請只回傳純JSON，不加任何說明或markdown，格式：
{
  "pattern": "K線型態名稱",
  "trend": "上漲/下跌/盤整",
  "signal": "買入/賣出/觀望",
  "confidence": 整數0到100,
  "analysis": "技術分析說明，60字以內",
  "entry": 建議進場價格,
  "stopLoss": 停損價格,
  "target": 目標價格,
  "timeframe": "短線3-5天/中線2-4週/長線1-3月",
  "risk": "低/中/高"
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`API error: ${res.status}`)

  const data = await res.json()
  let text = data.content?.[0]?.text || '{}'
  text = text.replace(/```json|```/g, '').trim()
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start >= 0 && end > start) text = text.slice(start, end + 1)

  return JSON.parse(text)
}
