/**
 * 台股常用個股代號 ↔ 中文名稱對照表
 * 輸入代號自動帶名稱，或輸入中文模糊搜尋代號
 */
export const TW_STOCKS = {
  // ── 台積電/半導體 ──
  '2330': { name: '台積電', otc: false }, '2303': { name: '聯電', otc: false },
  '2454': { name: '聯發科', otc: false }, '2379': { name: '瑞昱', otc: false },
  '2345': { name: '智邦', otc: false  }, '3034': { name: '聯詠', otc: false },
  '2388': { name: '威盛', otc: false  }, '3443': { name: '創意', otc: false },
  '3661': { name: '世芯-KY', otc: false }, '3529': { name: '力旺', otc: false },
  '6415': { name: '矽力-KY', otc: true }, '3035': { name: '智原', otc: false },

  // ── AI伺服器/ODM ──
  '2317': { name: '鴻海', otc: false   }, '2382': { name: '廣達', otc: false },
  '2356': { name: '英業達', otc: false }, '2324': { name: '仁寶', otc: false },
  '2353': { name: '宏碁', otc: false   }, '2357': { name: '華碩', otc: false },
  '6669': { name: '緯穎', otc: false   }, '3231': { name: '緯創', otc: false },
  '2376': { name: '技嘉', otc: false   }, '2301': { name: '光寶科', otc: false },
  '2308': { name: '台達電', otc: false }, '3017': { name: '奇鋐', otc: false },
  '3324': { name: '雙鴻', otc: true    }, '6230': { name: '超眾', otc: true  },
  '8299': { name: '群電', otc: false   }, '3018': { name: '同欣電', otc: false },

  // ── 記憶體 ──
  '2408': { name: '南亞科', otc: false }, '2344': { name: '華邦電', otc: false },
  '2337': { name: '旺宏',   otc: false }, '3260': { name: '威剛', otc: true   },
  '5483': { name: '中美晶', otc: false },

  // ── PCB/電路板 ──
  '2313': { name: '華通',   otc: false }, '2367': { name: '燿華', otc: false },
  '3037': { name: '欣興',   otc: false }, '2383': { name: '台光電', otc: false },
  '6269': { name: '台燿',   otc: true  }, '2304': { name: '聯德', otc: false },
  '2333': { name: '橙的電', otc: false }, '3189': { name: '景碩', otc: false },

  // ── 封裝測試 ──
  '3711': { name: '日月光', otc: false }, '6239': { name: '力成', otc: false },
  '2449': { name: '京元電', otc: true  }, '2458': { name: '義隆', otc: false },
  '5274': { name: '信驊',   otc: true  }, '6515': { name: '穎崴', otc: true  },

  // ── 被動元件 ──
  '2327': { name: '國巨',   otc: false }, '2492': { name: '華新科', otc: false },
  '3026': { name: '禾伸堂', otc: true  }, '2399': { name: '映泰', otc: false },
  '3624': { name: '光頡',   otc: true  }, '6642': { name: '富致', otc: true  },

  // ── 低軌衛星/通訊 ──
  '3491': { name: '昇達科', otc: true  }, '2314': { name: '台揚', otc: false },
  '5371': { name: '中光電', otc: false }, '3706': { name: '神達', otc: false },
  '6285': { name: '啟碁',   otc: false }, '4977': { name: '眾達', otc: true  },

  // ── 電源/散熱 ──
  '6443': { name: '元晶',   otc: false }, '6770': { name: '力智', otc: true  },
  '3563': { name: '牧德',   otc: true  }, '3653': { name: '健策', otc: false },
  '2441': { name: '超豐',   otc: false }, '3005': { name: '神基', otc: false },

  // ── 光通訊/CPO ──
  '3406': { name: '玉晶光', otc: false }, '3491': { name: '昇達科', otc: true },
  '6274': { name: '台燿',   otc: false },

  // ── 金融 ──
  '2882': { name: '國泰金', otc: false }, '2881': { name: '富邦金', otc: false },
  '2884': { name: '玉山金', otc: false }, '2886': { name: '兆豐金', otc: false },
  '2887': { name: '台新金', otc: false }, '2891': { name: '中信金', otc: false },
  '2885': { name: '元大金', otc: false }, '2880': { name: '華南金', otc: false },

  // ── 傳產/其他 ──
  '1301': { name: '台塑',   otc: false }, '1303': { name: '南亞', otc: false  },
  '1326': { name: '台化',   otc: false }, '2002': { name: '中鋼', otc: false  },
  '2603': { name: '長榮',   otc: false }, '2615': { name: '萬海', otc: false  },
  '2609': { name: '陽明',   otc: false }, '2412': { name: '中華電', otc: false},
  '4904': { name: '遠傳',   otc: false }, '3045': { name: '台灣大', otc: false},
  '1402': { name: '遠東新', otc: false }, '2207': { name: '和泰車', otc: false},

  // ── AI概念/機器人 ──
  '6414': { name: '樺漢',   otc: false }, '3221': { name: '台嘉碩', otc: true },
  '5009': { name: '榮成',   otc: false }, '2059': { name: '川湖', otc: false  },
  '2049': { name: '上銀',   otc: false }, '6488': { name: '環球晶', otc: false},
  '3661': { name: '世芯-KY', otc: false }, '6510': { name: '精測', otc: false},
}

/** 用代號查名稱 */
export function getNameByCode(code) {
  return TW_STOCKS[code]?.name || null
}

/** 用代號查是否為上櫃 */
export function getOTCByCode(code) {
  return TW_STOCKS[code]?.otc ?? false
}

/** 用中文模糊搜尋，回傳 [{code, name, otc}] */
export function searchByName(query) {
  if (!query || query.length < 1) return []
  const q = query.trim()
  return Object.entries(TW_STOCKS)
    .filter(([code, info]) => info.name.includes(q) || code.startsWith(q))
    .map(([code, info]) => ({ code, ...info }))
    .slice(0, 8)
}
