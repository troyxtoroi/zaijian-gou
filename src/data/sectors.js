export const SECTORS = {
  ai: {
    name: 'AI 相關', tag: '🤖', color: '#818cf8',
    stocks: [
      { code: '2382', name: '廣達',  base: 385 },
      { code: '6669', name: '緯穎',  base: 2280 },
      { code: '2376', name: '技嘉',  base: 358 },
      { code: '3034', name: '聯詠',  base: 295 },
      { code: '3231', name: '緯創',  base: 118 },
    ],
  },
  memory: {
    name: '記憶體', tag: '💾', color: '#c084fc',
    stocks: [
      { code: '2408', name: '南亞科', base: 82 },
      { code: '2344', name: '華邦電', base: 24 },
      { code: '2337', name: '旺宏',   base: 52 },
      { code: '3260', name: '威剛',   base: 68 },
    ],
  },
  satellite: {
    name: '低軌衛星', tag: '🛰️', color: '#22d3ee',
    stocks: [
      { code: '3491', name: '昇達科', base: 195 },
      { code: '2314', name: '台揚',   base: 68 },
      { code: '5371', name: '中光電', base: 42 },
    ],
  },
  passive: {
    name: '被動元件', tag: '⚡', color: '#fbbf24',
    stocks: [
      { code: '2327', name: '國巨',   base: 612 },
      { code: '2492', name: '華新科', base: 85 },
      { code: '3026', name: '禾伸堂', base: 138 },
    ],
  },
  thermal: {
    name: '散熱', tag: '❄️', color: '#34d399',
    stocks: [
      { code: '3324', name: '雙鴻', base: 285 },
      { code: '6230', name: '超眾', base: 328 },
      { code: '3017', name: '奇鋐', base: 412 },
    ],
  },
  packaging: {
    name: '封裝', tag: '📦', color: '#fb7185',
    stocks: [
      { code: '3711', name: '日月光', base: 182 },
      { code: '6239', name: '力成',   base: 95 },
      { code: '2449', name: '京元電', base: 48 },
    ],
  },
}

export const INITIAL_CAPITAL = 100000
export const TARGET_CAPITAL  = 5000000
