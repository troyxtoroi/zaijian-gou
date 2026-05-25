/**
 * 六大族群 — 股價來源 PChome/Anue 2026年5月23日
 * otc: true = 上櫃股 → Yahoo Finance 用 .TWO 後綴
 * otc: false/未設定 = 上市股 → Yahoo Finance 用 .TW 後綴
 */
export const SECTORS = {
  ai: {
    name: 'AI 相關', tag: '🤖', color: '#818cf8',
    stocks: [
      { code: '2382', name: '廣達',  base: 345   },   // 316
      { code: '6669', name: '緯穎',  base: 5545  },   // 5545
      { code: '2376', name: '技嘉',  base: 365   },   // ~310
      { code: '3034', name: '聯詠',  base: 510   },   // 485.5
      { code: '3231', name: '緯創',  base: 165   },   // 144.5
    ],
  },
  memory: {
    name: '記憶體', tag: '💾', color: '#c084fc',
    stocks: [
      { code: '2408', name: '南亞科', base: 285  },   // 274
      { code: '2344', name: '華邦電', base: 128  },   // 125
      { code: '2337', name: '旺宏',   base: 172  },   // 172
      { code: '3260', name: '威剛',   base: 195, otc: true },  // ~195
    ],
  },
  satellite: {
    name: '低軌衛星', tag: '🛰️', color: '#22d3ee',
    stocks: [
      { code: '3491', name: '昇達科', base: 1930, otc: true }, // 1930 !!
      { code: '2314', name: '台揚',   base: 265  },   // ~245
      { code: '5371', name: '中光電', base: 75   },   // 74.3
    ],
  },
  passive: {
    name: '被動元件', tag: '⚡', color: '#fbbf24',
    stocks: [
      { code: '2327', name: '國巨',   base: 501   },  // ~545
      { code: '2492', name: '華新科', base: 158   },  // ~138
      { code: '3026', name: '禾伸堂', base: 305, otc: true }, // ~271
    ],
  },
  thermal: {
    name: '散熱', tag: '❄️', color: '#34d399',
    stocks: [
      { code: '3324', name: '雙鴻',   base: 1050, otc: true }, // 1000
      { code: '6230', name: '超眾',   base: 720,  otc: true }, // ~650
      { code: '3017', name: '奇鋐',   base: 2500  },           // 2500
    ],
  },
  packaging: {
    name: '封裝', tag: '📦', color: '#fb7185',
    stocks: [
      { code: '3711', name: '日月光', base: 225   },  // ~210
      { code: '6239', name: '力成',   base: 268   },  // 257.5
      { code: '2449', name: '京元電', base: 108,   otc: true }, // ~92
    ],
  },
}

export const INITIAL_CAPITAL = 100000
export const TARGET_CAPITAL  = 5000000
