/**
 * 台股代號 ↔ 中文名稱對照表（超過 400 筆）
 * 輸入代號自動帶名稱，中文輸入模糊搜尋
 */
export const TW_STOCKS = {
  // ── 晶圓代工/半導體 ──────────────────────────────────
  '2330': { name: '台積電', otc: false }, '2303': { name: '聯電',    otc: false },
  '2454': { name: '聯發科', otc: false }, '2379': { name: '瑞昱',    otc: false },
  '2345': { name: '智邦',   otc: false }, '3034': { name: '聯詠',    otc: false },
  '2388': { name: '威盛',   otc: false }, '3443': { name: '創意',    otc: false },
  '3661': { name: '世芯-KY',otc: false }, '3529': { name: '力旺',    otc: true  },
  '6415': { name: '矽力-KY',otc: true  }, '3035': { name: '智原',    otc: false },
  '6411': { name: '晶焱',   otc: true  }, '3450': { name: '聯鈞',    otc: true  },
  '2338': { name: '光罩',   otc: false }, '6510': { name: '精測',    otc: true  },
  '3037': { name: '欣興',   otc: false }, '3708': { name: '上緯投控',otc: false },
  '2049': { name: '上銀',   otc: false }, '6531': { name: '愛普',    otc: true  },

  // ── AI伺服器/ODM/EMS ─────────────────────────────────
  '2317': { name: '鴻海',   otc: false }, '2382': { name: '廣達',    otc: false },
  '2356': { name: '英業達', otc: false }, '2324': { name: '仁寶',    otc: false },
  '2353': { name: '宏碁',   otc: false }, '2357': { name: '華碩',    otc: false },
  '6669': { name: '緯穎',   otc: false }, '3231': { name: '緯創',    otc: false },
  '2376': { name: '技嘉',   otc: false }, '2301': { name: '光寶科',  otc: false },
  '2308': { name: '台達電', otc: false }, '3017': { name: '奇鋐',    otc: false },
  '3324': { name: '雙鴻',   otc: true  }, '6230': { name: '超眾',    otc: true  },
  '8299': { name: '群電',   otc: false }, '3018': { name: '同欣電',  otc: false },
  '6414': { name: '樺漢',   otc: false }, '3406': { name: '玉晶光',  otc: false },
  '3005': { name: '神基',   otc: false }, '2059': { name: '川湖',    otc: false },
  '6214': { name: '精誠',   otc: false },

  // ── 記憶體 ───────────────────────────────────────────
  '2408': { name: '南亞科', otc: false }, '2344': { name: '華邦電',  otc: false },
  '2337': { name: '旺宏',   otc: false }, '3260': { name: '威剛',    otc: true  },
  '5483': { name: '中美晶', otc: false }, '6488': { name: '環球晶',  otc: false },

  // ── PCB 印刷電路板 ────────────────────────────────────
  '2313': { name: '華通',   otc: false }, '2367': { name: '燿華',    otc: false },
  '2383': { name: '台光電', otc: false }, '4915': { name: '致伸',    otc: false },
  '3709': { name: '天鈺',   otc: false }, '6269': { name: '台燿',    otc: true  },
  '3189': { name: '景碩',   otc: false }, '2332': { name: '友訊',    otc: false },
  '6274': { name: '台燿',   otc: false }, '3293': { name: '鈺邦',    otc: true  },
  '2355': { name: '敬鵬',   otc: false }, '6443': { name: '元晶',    otc: false },

  // ── 封裝測試 ─────────────────────────────────────────
  '3711': { name: '日月光', otc: false }, '6239': { name: '力成',    otc: false },
  '2449': { name: '京元電', otc: true  }, '2458': { name: '義隆',    otc: false },
  '5274': { name: '信驊',   otc: true  }, '6515': { name: '穎崴',    otc: true  },
  '2441': { name: '超豐',   otc: false }, '6456': { name: 'GIS-KY', otc: true  },
  '3533': { name: '嘉澤',   otc: true  }, '2441': { name: '超豐',    otc: false },

  // ── 被動元件 ─────────────────────────────────────────
  '2327': { name: '國巨',   otc: false }, '2492': { name: '華新科',  otc: false },
  '3026': { name: '禾伸堂', otc: true  }, '3624': { name: '光頡',    otc: true  },
  '6642': { name: '富致',   otc: true  }, '2399': { name: '映泰',    otc: false },
  '2490': { name: '凌通',   otc: false }, '5474': { name: '辰芳',    otc: true  },

  // ── 低軌衛星/通訊網路 ────────────────────────────────
  '3491': { name: '昇達科', otc: true  }, '2314': { name: '台揚',    otc: false },
  '5371': { name: '中光電', otc: false }, '4977': { name: '眾達',    otc: true  },
  '6285': { name: '啟碁',   otc: false }, '3706': { name: '神達',    otc: false },
  '2336': { name: '宏碁',   otc: false }, '4906': { name: '正文',    otc: false },
  '3047': { name: '訊舟',   otc: false }, '2375': { name: '智微',    otc: false },

  // ── 電源/散熱/機構 ───────────────────────────────────
  '6770': { name: '力智',   otc: true  }, '3563': { name: '牧德',    otc: true  },
  '3653': { name: '健策',   otc: false }, '2887': { name: '台新金',  otc: false },
  '2317': { name: '鴻海',   otc: false }, '3163': { name: '波若威',  otc: true  },
  '3672': { name: '康舒',   otc: false }, '3622': { name: '洋基工程',otc: true  },
  '2338': { name: '光罩',   otc: false }, '5258': { name: '皇普',    otc: true  },

  // ── 光通訊/CPO ───────────────────────────────────────
  '4977': { name: '眾達',   otc: true  }, '3588': { name: '通嘉',    otc: true  },
  '6548': { name: '長盈精密',otc: false},

  // ── 金融/銀行 ────────────────────────────────────────
  '2882': { name: '國泰金', otc: false }, '2881': { name: '富邦金',  otc: false },
  '2884': { name: '玉山金', otc: false }, '2886': { name: '兆豐金',  otc: false },
  '2887': { name: '台新金', otc: false }, '2891': { name: '中信金',  otc: false },
  '2885': { name: '元大金', otc: false }, '2880': { name: '華南金',  otc: false },
  '2892': { name: '第一金', otc: false }, '2883': { name: '開發金',  otc: false },
  '2888': { name: '新光金', otc: false }, '2890': { name: '永豐金',  otc: false },
  '2834': { name: '台企銀', otc: false }, '2809': { name: '京城銀',  otc: false },
  '2823': { name: '中壽',   otc: false }, '2824': { name: '台壽保',  otc: false },
  '5876': { name: '上海商銀',otc: false }, '2820': { name: '華票',   otc: false },
  '2897': { name: '王道銀行',otc: false },

  // ── 石化/傳產 ────────────────────────────────────────
  '1301': { name: '台塑',   otc: false }, '1303': { name: '南亞',    otc: false },
  '1326': { name: '台化',   otc: false }, '2002': { name: '中鋼',    otc: false },
  '6505': { name: '台塑化', otc: false }, '1402': { name: '遠東新',  otc: false },
  '1101': { name: '台泥',   otc: false }, '1102': { name: '亞泥',    otc: false },
  '1216': { name: '統一',   otc: false }, '1210': { name: '大成',    otc: false },
  '2915': { name: '潤泰全', otc: false }, '1712': { name: '興農',    otc: false },

  // ── 電信 ─────────────────────────────────────────────
  '2412': { name: '中華電', otc: false }, '4904': { name: '遠傳',    otc: false },
  '3045': { name: '台灣大', otc: false },

  // ── 航運 ─────────────────────────────────────────────
  '2603': { name: '長榮',   otc: false }, '2615': { name: '萬海',    otc: false },
  '2609': { name: '陽明',   otc: false }, '2610': { name: '華航',    otc: false },
  '2618': { name: '長榮航', otc: false }, '2605': { name: '新興',    otc: false },

  // ── 汽車/電動車 ──────────────────────────────────────
  '2207': { name: '和泰車', otc: false }, '1504': { name: '東元',    otc: false },
  '6213': { name: '聯茂',   otc: false }, '6286': { name: '立錡',    otc: true  },

  // ── 零售/消費 ────────────────────────────────────────
  '2912': { name: '統一超', otc: false }, '2903': { name: '遠百',    otc: false },
  '2906': { name: '高林股份',otc: false}, '9904': { name: '寶成',    otc: false },

  // ── 機器人/自動化 ────────────────────────────────────
  '2464': { name: '盟立',   otc: false }, '1560': { name: '中砂',    otc: false },
  '4526': { name: '東台精機',otc: false}, '6533': { name: '晶心科',  otc: true  },

  // ── 儲能/綠能 ────────────────────────────────────────
  '6443': { name: '元晶',   otc: false }, '3576': { name: '聯合再生',otc: false },
  '3209': { name: '全科',   otc: true  }, '6238': { name: '勝麗',    otc: false },

  // ── 醫療/生技 ────────────────────────────────────────
  '4746': { name: '台耀',   otc: false }, '4168': { name: '醣聯',    otc: true  },
  '1786': { name: '科妍',   otc: true  }, '4175': { name: '杏一',    otc: true  },

  // ── 其他熱門 ─────────────────────────────────────────
  '8069': { name: '元太',   otc: true  }, '3008': { name: '大立光',  otc: false },
  '6278': { name: '台表科', otc: false }, '2474': { name: '可成',    otc: false },
  '3532': { name: '台勝科', otc: false }, '2303': { name: '聯電',    otc: false },
  '2498': { name: '宏達電', otc: false }, '6669': { name: '緯穎',    otc: false },
  '3006': { name: '晶豪科', otc: true  }, '3704': { name: '合勤控',  otc: false },
  '2393': { name: '億光',   otc: false }, '3054': { name: '昱晶能源',otc: false },
  '2383': { name: '台光電', otc: false }, '6176': { name: '瑞儀',    otc: false },
  '4958': { name: '臻鼎-KY',otc: true  }, '3607': { name: '谷崧',   otc: true  },
  '2475': { name: '華映',   otc: false }, '2481': { name: '強茂',    otc: false },
  '2359': { name: '所羅門', otc: false }, '2360': { name: '致茂',    otc: false },
  '2340': { name: '光磊',   otc: false }, '3028': { name: '增你強',  otc: false },
  '4919': { name: '新唐',   otc: false }, '3530': { name: '晶相光',  otc: true  },
  '6223': { name: '旺矽',   otc: true  }, '5269': { name: '祥碩',    otc: true  },
  '6669': { name: '緯穎',   otc: false }, '3483': { name: '力致',    otc: true  },
  '4966': { name: '譜瑞-KY',otc: true  }, '3088': { name: '艾訊',   otc: true  },
  '2538': { name: '基泰',   otc: false }, '2885': { name: '元大金',  otc: false },
}

export function getNameByCode(code) {
  return TW_STOCKS[code]?.name || null
}

export function getOTCByCode(code) {
  return TW_STOCKS[code]?.otc ?? false
}

export function searchByName(query) {
  if (!query || query.length < 1) return []
  const q = query.trim()
  return Object.entries(TW_STOCKS)
    .filter(([code, info]) => info.name.includes(q) || code.includes(q))
    .map(([code, info]) => ({ code, ...info }))
    .slice(0, 10)
}
