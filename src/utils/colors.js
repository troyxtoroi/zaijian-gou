/**
 * 台灣股市色彩系統
 * 漲 = 紅色 | 跌 = 綠色（台灣慣例，與歐美相反）
 * 買入 = 蒂芬妮藍 | 賣出 = 金黃 | 觀望 = 亮灰
 */

export const C = {
  // 漲跌（台灣慣例）
  up:     '#ef4444',   // 漲 = 紅
  down:   '#22c55e',   // 跌 = 綠

  // 操作信號
  buy:    '#0abab5',   // 買入 = 蒂芬妮藍
  sell:   '#f59e0b',   // 賣出 = 金黃
  hold:   '#94a3b8',   // 觀望 = 亮灰

  // 市場情緒
  pos:    '#ef4444',   // 正面 = 紅
  neg:    '#22c55e',   // 負面 = 綠
  neu:    '#94a3b8',   // 中性 = 亮灰

  // 背景色
  upBg:   '#2b0f0f',   // 漲背景（深紅）
  downBg: '#0f2b1e',   // 跌背景（深綠）
  buyBg:  '#062020',   // 買入背景（深藍綠）
  sellBg: '#2b1e00',   // 賣出背景（深金）
  holdBg: '#1e2d4d',   // 觀望背景

  // 邊框
  upBorder:   '#ef444444',
  downBorder: '#22c55e44',
  buyBorder:  '#0abab555',
  sellBorder: '#f59e0b55',
}

/** 價格漲跌顏色 */
export const priceColor  = chg  => chg  >= 0 ? C.up   : C.down
/** 操作信號顏色 */
export const sigColor    = sig  => sig  === '買入' ? C.buy  : sig === '賣出' ? C.sell  : C.hold
export const sigBg       = sig  => sig  === '買入' ? C.buyBg : sig === '賣出' ? C.sellBg : C.holdBg
export const sigBorder   = sig  => sig  === '買入' ? C.buyBorder : sig === '賣出' ? C.sellBorder : '#475569'
/** 市場情緒顏色 */
export const sentColor   = sent => sent === '正面' ? C.pos  : sent === '負面' ? C.neg  : C.neu
