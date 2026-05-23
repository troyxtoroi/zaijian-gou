/**
 * 六大熱門族群股票設定
 * base 價格來源：PChome/Anue 2026年5月即時行情（作為模擬資料備援）
 * 真實股價由 stockApi.js 透過 CORS proxy 從 Yahoo Finance 即時抓取
 */

export const SECTORS = {
  ai: {
    name: 'AI 相關', tag: '🤖', color: '#818cf8',
    stocks: [
      { code: '2382', name: '廣達',  base: 316  },   // 實際 316
      { code: '6669', name: '緯穎',  base: 5545 },   // 實際 5525~5545 !!
      { code: '2376', name: '技嘉',  base: 295  },   // 實際約 280~310
      { code: '3034', name: '聯詠',  base: 420  },   // 實際約 400~440
      { code: '3231', name: '緯創',  base: 112  },   // 實際約 105~120
    ],
  },
  memory: {
    name: '記憶體', tag: '💾', color: '#c084fc',
    stocks: [
      { code: '2408', name: '南亞科', base: 274 },   // 實際 274
      { code: '2344', name: '華邦電', base: 125 },   // 實際 125
      { code: '2337', name: '旺宏',   base: 52  },   // 實際 52~53
      { code: '3260', name: '威剛',   base: 95  },   // 實際約 90~100
    ],
  },
  satellite: {
    name: '低軌衛星', tag: '🛰️', color: '#22d3ee',
    stocks: [
      { code: '3491', name: '昇達科', base: 185 },   // 實際約 170~200
      { code: '2314', name: '台揚',   base: 68  },   // 實際約 60~75
      { code: '5371', name: '中光電', base: 42  },   // 實際約 38~46
    ],
  },
  passive: {
    name: '被動元件', tag: '⚡', color: '#fbbf24',
    stocks: [
      { code: '2327', name: '國巨',   base: 520  },  // 實際 520~572 (漲停創高)
      { code: '2492', name: '華新科', base: 88   },  // 實際約 80~95
      { code: '3026', name: '禾伸堂', base: 145  },  // 實際約 135~155
    ],
  },
  thermal: {
    name: '散熱', tag: '❄️', color: '#34d399',
    stocks: [
      { code: '3324', name: '雙鴻', base: 1000 },   // 實際 1000 !!
      { code: '6230', name: '超眾', base: 620  },   // 實際約 580~650
      { code: '3017', name: '奇鋐', base: 2500 },   // 實際 2500 !!
    ],
  },
  packaging: {
    name: '封裝', tag: '📦', color: '#fb7185',
    stocks: [
      { code: '3711', name: '日月光', base: 205 },  // 實際約 195~215
      { code: '6239', name: '力成',   base: 257 },  // 實際 257
      { code: '2449', name: '京元電', base: 88  },  // 實際約 82~95
    ],
  },
}

export const INITIAL_CAPITAL = 100000
export const TARGET_CAPITAL  = 5000000
