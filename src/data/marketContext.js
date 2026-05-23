/**
 * 市場情境資料庫 — 2026年5月24日更新
 * 涵蓋：Computex、CEO來台、各國AI需求、外資評等、券商評分
 */

export const MARKET_CONTEXT = {
  lastUpdate: '2026-05-24',

  // ── 全球市場總覽 ──────────────────────────────────────
  global: {
    sentiment: 9,  // 1-10
    summary: 'AI伺服器超級週期持續，Computex 2026即將引爆行情，外資持續加碼台灣供應鏈，台股基本面強勁。',
    bullFactors: [
      '黃仁勳5/27抵台，6/1 Computex發表Rubin平台與Feynman架構',
      '蘇姿丰5/22已抵台，AMD AI GPU訂單大幅拉升',
      'Intel CEO陳立武、Qualcomm CEO、Arm CEO齊聚Computex',
      '鴻海董事長劉揚偉首度重返Computex，聚焦AI伺服器與機器人',
      '美國微軟、Google、Meta、AWS 2026年資本支出合計超4000億美元',
      '台股加權指數突破4萬點，AI族群領軍',
      'DRAM價格Q2累計漲幅達40%，記憶體超級週期確認',
    ],
    riskFactors: [
      '融資水位偏高，短線過熱風險',
      '中美科技戰不確定性，出口管制擴大疑慮',
      '台股近期漲多回調壓力',
      '美元升值壓力',
    ],
  },

  // ── 六大族群市場情境 ──────────────────────────────────
  sectors: {
    ai: {
      score: 9,
      outlook: '強烈看多',
      catalysts: [
        '黃仁勳6/1 Computex演講：Rubin平台、Feynman架構全面揭露，GB300/HGX新平台發表',
        '蘇姿丰抵台拜會台積電，AMD MI400系列GPU訂單確認大幅上調',
        '廣達、緯穎為NVIDIA/AMD主要伺服器代工廠，訂單能見度到2027年',
        '技嘉強化NVIDIA GPU平台，歐亞市場通路持續擴展',
        'AWS、Google、Azure合計資本支出4000億美元，AI伺服器需求爆炸性成長',
        '緯創追加4.55億美元美國AI製造產能，業務重心轉向高利潤AI伺服器',
      ],
      analystConsensus: '外資一致給予「強力買進」，目標價多有上調空間',
      keyRisk: '股價漲幅已大，短線震盪風險',
    },
    memory: {
      score: 8,
      outlook: '看多',
      catalysts: [
        'IDC：2026年DRAM供應成長率僅16%，遠低於歷史均值，供不應求',
        'Q2記憶體價格累計漲幅達40%，HBM價格更創歷史高點',
        '記憶體產能從手機PC轉向AI資料中心，高價HBM比重大幅提升',
        '旺宏投信連續買超7446張，外資也大量加碼南亞科',
        '韓國SK海力士、三星HBM缺貨，台廠受益替代需求',
        '南亞科HBM3擴產計畫，2026年下半年量產目標',
      ],
      analystConsensus: '多家外資將南亞科、旺宏目標價上調15-25%',
      keyRisk: '韓廠HBM擴產速度若超預期，恐壓縮台廠空間',
    },
    satellite: {
      score: 8,
      outlook: '看多',
      catalysts: [
        'SpaceX Starlink V3衛星2026年大量部署，低軌衛星通訊設備需求暴增',
        '昇達科主要受惠低軌衛星通訊模組，訂單能見度強',
        'AI資料中心連接低軌衛星趨勢，帶動台揚、中光電邊緣AI通訊需求',
        'Amazon Kuiper開始商業服務，競爭拉動整體市場規模',
        '全球各國加速部署低軌衛星網路，政府訂單陸續到位',
      ],
      analystConsensus: '昇達科被多家法人列入重點觀察名單，目標價持續上修',
      keyRisk: '股價已大漲，短線融資水位偏高，處置股風險',
    },
    passive: {
      score: 8,
      outlook: '看多',
      catalysts: [
        '國巨5/18逆勢漲停501元（分割後新高），外資最新目標價大幅上修',
        'AI伺服器MLCC用量是傳統伺服器的5-10倍，需求爆炸性成長',
        '日韓MLCC大廠產能利用率接近滿載，部分AI規格訂單外溢至台廠',
        '鉭電容剛果衝突導致供給緊縮，KEMET擴產30%仍難補缺口，漲價確定',
        '禾伸堂、華新科一同被列入AI被動元件重點受惠清單',
        'Computex展出AI伺服器新規格，MLCC/鉭電容用量將進一步明朗',
      ],
      analystConsensus: '外資給予「買進」，國巨目標價區間520-600元',
      keyRisk: '禾伸堂、華新科近期遭列處置股，短線交易受限',
    },
    thermal: {
      score: 9,
      outlook: '強烈看多',
      catalysts: [
        'NVIDIA推出單機架800V直流電架構，液冷散熱成為AI伺服器標準配備',
        '2026年AI資料中心液冷滲透率從15%快速提升至35%',
        '奇鋐、雙鴻、超眾為NVIDIA/AMD主要液冷散熱供應商，訂單滿載',
        '鴻海Computex展示液冷散熱AI伺服器整機，台廠散熱方案直接受益',
        'Google、Meta自建液冷資料中心，採購台廠散熱組件',
        '微通道水冷板（MLCP）成為下一代散熱主流，台廠正積極切入',
      ],
      analystConsensus: '奇鋐、雙鴻外資目標價創歷史新高，散熱族群為最強AI次族群',
      keyRisk: '股價已超高，奇鋐站上2500元，本益比偏高需留意',
    },
    packaging: {
      score: 7,
      outlook: '偏多',
      catalysts: [
        '台積電CoWoS封裝月產能2026年底突破4萬片，外包訂單挹注日月光',
        'AMD攜手日月光切入CoWoS封裝，強化NVIDIA以外的訂單多元化',
        '京元電為NVIDIA Rubin晶片樣品主要測試廠，自製預燒爐優勢顯著',
        '力成受惠AI HBM測試需求，高附加價值訂單比重提升',
        '先進封裝產值2026年年增估達35%，台灣封裝廠全面受益',
      ],
      analystConsensus: '日月光外資給予「買進」，目標價220-240元；封裝族群整體評等中性偏多',
      keyRisk: '非NVIDIA訂單稀釋高利潤率，整體毛利率仍偏低',
    },
  },

  // ── 個股特定外資/券商評等 ──────────────────────────────
  stockRatings: {
    '2382': { rating: '強力買進', target: 380, broker: '摩根士丹利、高盛', note: '廣達AI伺服器佔比持續提升，2026年EPS估達20元' },
    '6669': { rating: '買進',     target: 6200, broker: '瑞銀、美林', note: '緯穎AI伺服器客戶集中度高，訂單能見度強' },
    '2376': { rating: '買進',     target: 360, broker: '花旗、德意志', note: '技嘉GPU主板+AI伺服器雙引擎' },
    '3034': { rating: '中性偏多', target: 520, broker: '摩根大通', note: '聯詠AI顯示晶片業績逐季走強' },
    '3231': { rating: '買進',     target: 165, broker: '高盛', note: '緯創AI伺服器美國廠產能開出' },
    '2408': { rating: '強力買進', target: 320, broker: '野村、瑞銀', note: '南亞科HBM3量產，記憶體超級週期核心受益' },
    '2344': { rating: '買進',     target: 145, broker: '元大投顧', note: '華邦電AI Edge記憶體切入高成長' },
    '2337': { rating: '中性',     target: 185, broker: '凱基投顧', note: '旺宏NOR Flash需求回溫，評等觀察升級' },
    '3491': { rating: '買進',     target: 2200, broker: '國泰投顧', note: '昇達科低軌衛星通訊訂單大幅成長' },
    '2327': { rating: '強力買進', target: 600, broker: '高盛、花旗', note: '國巨AI被動元件訂單爆發，目標價持續上修' },
    '2492': { rating: '買進',     target: 165, broker: '元大投顧', note: '華新科MLCC AI規格比重提升' },
    '3026': { rating: '買進',     target: 320, broker: '富邦投顧', note: '禾伸堂鉭電容缺貨受惠，評等大幅升級' },
    '3324': { rating: '強力買進', target: 1200, broker: '摩根士丹利', note: '雙鴻液冷散熱AI訂單滿載到2027年' },
    '6230': { rating: '買進',     target: 750, broker: '凱基投顧', note: '超眾（尼得科超眾）NVIDIA GB200液冷組件主力供應商' },
    '3017': { rating: '強力買進', target: 3000, broker: '高盛、美林', note: '奇鋐散熱龍頭，NVIDIA黑名單外最強散熱股' },
    '3711': { rating: '買進',     target: 240, broker: '野村', note: '日月光CoWoS外包訂單確認，估2026年大幅成長' },
    '6239': { rating: '中性偏多', target: 280, broker: '玉山投顧', note: '力成HBM測試需求強勁，毛利率有望提升' },
    '2449': { rating: '買進',     target: 110, broker: '富邦投顧', note: '京元電Rubin晶片測試主力廠，2026H2業績爆發' },
  },

  // ── 全球各區域AI需求 ──────────────────────────────────
  globalDemand: {
    us: {
      score: 10,
      summary: 'Microsoft 800億美元、Google 750億美元、Meta 600億美元、Amazon 1000億美元，2026年資本支出創歷史新高，AI伺服器採購量年增60%+',
    },
    europe: {
      score: 7,
      summary: 'EU AI法案通過後，歐洲企業加速AI部署。SAP、西門子等大廠採購台灣AI伺服器，歐洲政府AI基礎建設補貼帶動需求',
    },
    japan: {
      score: 8,
      summary: '日本政府推動AI立國戰略，SoftBank孫正義宣布1000億美元AI基金。NTT、富士通大量採購AI伺服器，台廠直接受益',
    },
    korea: {
      score: 7,
      summary: '三星、SK海力士HBM大幅擴產，但同時也是台灣AI伺服器代工的競爭對手。韓國整體AI投資規模位居亞洲前列',
    },
    china: {
      score: 6,
      summary: '美國出口管制限制高階AI晶片輸中，但中國仍有大量中低階AI需求。百度、阿里、騰訊繼續擴建AI資料中心，部分零組件仍向台廠採購',
    },
  },

  // ── Computex 2026 特別催化劑 ──────────────────────────
  computex2026: {
    date: '2026年6月1日-6月5日',
    theme: 'AI Together',
    venue: '台北南港展覽館 + 世貿中心',
    keyEvents: [
      { date: '5/22', event: '蘇姿丰（AMD）抵台演講，拜會台積電，AMD概念股催油門' },
      { date: '5/27', event: '黃仁勳（NVIDIA）預計抵台，舉辦「兆元宴」廣邀台灣供應鏈龍頭' },
      { date: '6/1',  event: '黃仁勳主題演講：Rubin平台、Feynman架構完整揭露，GTC Taipei同步' },
      { date: '6/1',  event: '劉揚偉（鴻海）演講：AI伺服器組裝、液冷散熱、機器人業務' },
      { date: '6/2',  event: 'Intel CEO陳立武演講（報名已額滿）' },
      { date: '6/2',  event: 'Qualcomm CEO Amon演講' },
      { date: '6/3',  event: 'Arm CEO Rene Haas演講' },
    ],
    impactedSectors: ['ai', 'thermal', 'packaging', 'memory', 'satellite', 'passive'],
    marketImpact: 'Computex前一週通常是台股AI族群最強催化劑，歷史上Computex週漲幅平均達5-15%',
  },
}

/**
 * 取得指定族群的市場情境摘要（用於AI分析提示詞）
 */
export function getSectorContext(sectorKey) {
  const ctx = MARKET_CONTEXT.sectors[sectorKey]
  if (!ctx) return ''
  const computex = MARKET_CONTEXT.computex2026
  const global = MARKET_CONTEXT.global

  return `
【市場情境 ${MARKET_CONTEXT.lastUpdate}】
📅 重大事件：${computex.date} Computex 2026「${computex.theme}」即將登場
  - ${computex.keyEvents.slice(0, 3).map(e => `${e.date} ${e.event}`).join('\n  - ')}

📊 ${sectorKey === 'ai' ? 'AI族群' : sectorKey === 'memory' ? '記憶體族群' : sectorKey === 'thermal' ? '散熱族群' : sectorKey === 'packaging' ? '封裝族群' : sectorKey === 'passive' ? '被動元件族群' : '低軌衛星族群'}市場動態：
  展望：${ctx.outlook}（市場情境分數：${ctx.score}/10）
  催化劑：${ctx.catalysts.slice(0, 4).join('；')}
  法人評等：${ctx.analystConsensus}
  風險：${ctx.keyRisk}

🌍 全球AI需求：
  美國：${MARKET_CONTEXT.globalDemand.us.summary.slice(0, 80)}
  日本：${MARKET_CONTEXT.globalDemand.japan.summary.slice(0, 60)}
  
⚠️ 市場風險：${global.riskFactors.slice(0, 2).join('；')}
`.trim()
}

/**
 * 取得個股外資/券商評等
 */
export function getStockRating(code) {
  return MARKET_CONTEXT.stockRatings[code] || null
}

/**
 * 取得整體市場情緒分數（用於本地分析加分）
 */
export function getMarketSentimentBonus(sectorKey) {
  const sectorScore = MARKET_CONTEXT.sectors[sectorKey]?.score || 5
  const globalScore = MARKET_CONTEXT.global.sentiment
  // Computex即將登場，給予額外加分
  const computexBonus = 10 // 電腦展前一週
  return {
    sectorScore,
    globalScore,
    computexBonus,
    totalBonus: Math.round((sectorScore + globalScore) / 2) + computexBonus,
  }
}
