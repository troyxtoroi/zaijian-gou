/**
 * 全球市場情境資料庫 — 2026年5月24日（爬文整合最新消息）
 * 資料來源：Tom's Hardware, CNBC, Financial Times, 鉅亨網, 工商時報, 玩股網
 */

export const MARKET_CONTEXT = {
  lastUpdate: '2026-05-24',

  global: {
    sentiment: 9,
    summary: '四大超大規模雲端業者2026年AI資本支出合計7250億美元（年增77%），CoWoS封裝供不應求，記憶體漲價推高支出，Computex前夕科技巨頭齊聚台灣。',
    bullFactors: [
      '🇺🇸 Google/Amazon/Microsoft/Meta 2026年AI資本支出合計7250億美元，年增77%（FT統計）',
      '🇺🇸 微軟2026年資本支出1900億美元（年增24%），明顯超越市場預期1520億美元',
      '🇺🇸 Amazon 2026年資本支出2000億美元，Google 1850億美元，Meta 1350億美元',
      '💡 Jefferies分析師：「AI空頭論點是垃圾」，AI經濟健康，需求超越供給',
      '📦 CoWoS先進封裝供不應求，NVIDIA包下台積電2026年逾半產能，至少延續到2026年中',
      '💾 記憶體漲價推動資本支出走高：微軟明確指出250億美元增量源自記憶體價格上漲',
      '🎪 Computex 2026（6/1-6/5）黃仁勳/蘇姿丰/Intel CEO/Qualcomm CEO/Arm CEO齊聚台灣',
      '🤖 Agentic AI崛起帶動算力分工：CPU+GPU+LPU+TPU+ASIC協作時代到來',
      '🇯🇵 日本SoftBank孫正義1000億美元AI基金、NTT大量採購AI伺服器',
      '🇸🇦 沙烏地阿拉伯ARAMCO宣布百億美元AI投資計畫，中東AI建設啟動',
      'Wall Street估2027年四大雲端資本支出突破兆美元（BofA/Evercore）',
    ],
    riskFactors: [
      '⚡ 全球電力基礎設施瓶頸：大型變壓器交期128週，IEA估20%資料中心計畫面臨電網延遲',
      '💸 Amazon/Microsoft自由現金流大幅萎縮（Amazon恐為負），市場關注ROI時程',
      '📉 台股融資水位偏高，短線漲多回調壓力',
      '🇨🇳 美中科技戰：出口管制持續擴大，中國AI晶片需求受限',
      '🇰🇷 韓國三星/SK海力士持續擴產HBM，中期恐影響台廠市佔',
      'TrendForce下調全年伺服器出貨成長預估，需留意庫存修正風險',
    ],
  },

  sectors: {
    ai: {
      score: 9,
      outlook: '強烈看多',
      catalysts: [
        '黃仁勳5/27抵台舉辦「兆元宴」，6/1 Computex發表Rubin平台與Feynman架構',
        'NVIDIA Rubin Ultra/LPX：GB300 GPU、NVLink Fusion開放異質晶片整合',
        '蘇姿丰5/22抵台拜會台積電，AMD MI400 GPU訂單大幅上調，台廠受益',
        '緯穎/廣達為NVIDIA/AMD AI伺服器主力代工廠，訂單能見度至2027年',
        'Microsoft資本支出1900億美元（年增24%），約2/3用於GPU/CPU採購',
        '技嘉GPU主板+AI伺服器雙引擎，歐亞市場通路持續擴展',
        '緯創追加4.55億美元美國AI製造廠，業務重心轉向高利潤AI伺服器',
        'Edge AI/Agentic AI崛起，AI從雲端下沉至邊緣終端，帶動新一輪硬體需求',
      ],
      risks: ['股價已大幅上漲，短線本益比偏高；融資水位升高', 'ASIC晶片發展可能分流部分GPU訂單'],
      analystConsensus: '外資普遍給予「強力買進」，目標價多有上調空間',
      keyRisk: '短線漲多震盪風險；若黃仁勳Computex演講低於預期，可能引發獲利了結',
      globalNews: [
        '微軟Q1法說會：AI業務毛利率已優於雲端事業同期，且仍處供不應求',
        'Google雲端Q1營收年增63%至200億美元，AI服務需求「前所未有」',
        'OpenAI與NVIDIA達成戰略合作，NVIDIA投資至少1000億美元',
      ],
    },

    memory: {
      score: 8,
      outlook: '看多',
      catalysts: [
        'HBM3E供不應求：NVIDIA包下台積電CoWoS逾半產能，至少延續到2026年中',
        '微軟明確表示250億美元增量資本支出源自記憶體/晶片漲價，需求確認',
        'Meta法說會：資本支出增加主因是「記憶體漲價」（CEO親口確認）',
        'DDR5受CoWoS產能擠壓暴漲，SRAM成AI推理核心規格',
        'IDC：2026年DRAM供應成長率僅16%，遠低於AI需求成長',
        'Q2記憶體價格累計漲幅達40%，旺宏投信連續大量買超',
        '南亞科HBM3擴產計畫，2026年下半年量產目標',
        'NVIDIA已取得Groq技術授權，確立AI訓練/推理分流架構，推升SRAM需求',
      ],
      risks: ['韓國SK海力士/三星HBM持續擴產，中期供給壓力漸增', '若AI熱潮降溫，記憶體庫存修正風險'],
      analystConsensus: '多家外資將南亞科、旺宏目標價上調15-25%',
      keyRisk: '韓廠HBM擴產速度若超預期，可能壓縮台廠空間',
      globalNews: [
        'HBM3E漲價：AI推理市場需求遠超預期，供給至少緊張到2026年底',
        'SRAM異軍突起：低延遲特性使其成為Agentic AI推理優化核心規格',
        '記憶體漲價推高Big Tech成本：Apple、Google均面臨零組件成本壓力',
      ],
    },

    satellite: {
      score: 8,
      outlook: '看多',
      catalysts: [
        'SpaceX Starlink V3衛星2026年大量部署，低軌衛星通訊設備訂單暴增',
        'Amazon Kuiper開始商業服務，與Starlink競爭拉動整體市場規模',
        '昇達科低軌衛星通訊模組客戶集中度高，2026年訂單能見度強',
        'AI資料中心連結低軌衛星趨勢：邊緣AI節點需要高頻寬低延遲連結',
        '台揚/中光電受惠衛星通訊+AI邊緣運算設備雙引擎需求',
        '全球各國政府加速低軌衛星部署，軍事/民用雙軌訂單挹注',
      ],
      risks: ['昇達科股價已暴漲，融資水位高，目前遭列注意股', 'OneWeb/Telesat等競爭對手加速部署'],
      analystConsensus: '昇達科被多家法人列入重點觀察名單，目標價持續上修',
      keyRisk: '股價過熱，短線處置股風險；需等實際出貨數字驗證',
      globalNews: [
        'SpaceX Starlink已服務全球400萬用戶，V3衛星效能提升3倍',
        'Amazon Kuiper商業服務啟動，已在多國取得頻段授權',
        '低軌衛星成AI邊緣運算基礎設施：微軟Azure與SpaceX簽訂雲端互連協議',
      ],
    },

    passive: {
      score: 8,
      outlook: '看多',
      catalysts: [
        '國巨5/18逆勢漲停501元，AI伺服器MLCC用量是傳統伺服器5-10倍',
        '日韓MLCC大廠產能接近滿載，AI規格外溢訂單流向台廠',
        '鉭電容：剛果衝突導致供給緊縮，KEMET擴產30%仍難補缺口',
        'Meta與Corning簽60億美元光纖長約、Vistra核能協議，AI基建全面升溫',
        'Computex將明確AI伺服器新規格，MLCC/鉭電容需求進一步明朗',
        '被動元件族群：華新科、禾伸堂、光頡等同步受益AI訂單',
        '出口管制使台廠取代日韓供應商機率提升（反應速度快優勢）',
      ],
      risks: ['禾伸堂、華新科近期遭列處置股，短線交易受限', '關稅壓力：台灣被動元件面臨15%對美關稅'],
      analystConsensus: '外資給予「買進」，國巨目標價區間520-600元',
      keyRisk: '貿易戰擴大恐墊高成本；鉭原料持續漲價壓縮毛利',
      globalNews: [
        'AI伺服器電源密度從500W提升至1000W+，電容需求量增3-5倍',
        'MLCC日系大廠TDK/村田：2026年AI規格產品已供不應求',
        '美國對中國電子零組件實施更嚴格管制，台廠替代需求增加',
      ],
    },

    thermal: {
      score: 9,
      outlook: '強烈看多',
      catalysts: [
        'NVIDIA Blackwell GB300：單機架800V直流電架構，液冷成AI伺服器標配',
        '2026年AI資料中心液冷滲透率從15%快速提升至35%+',
        '奇鋐/雙鴻/超眾為NVIDIA/AMD主要液冷供應商，訂單滿載到2027年',
        '鴻海Computex展示液冷整機AI伺服器，台廠散熱方案直接受益',
        'Google/Meta自建液冷資料中心，大量採購台廠液冷組件',
        '微通道水冷板（MLCP）成下一代散熱主流，台廠積極切入',
        '全球資料中心電力密度持續攀升，散熱解決方案需求剛性強',
        'CoWoS先進封裝發熱量大增，高效散熱模組成必須配件',
      ],
      risks: ['奇鋐股價站上2500元，本益比偏高；短線震盪風險大', '電力瓶頸可能延遲部分資料中心建設時程'],
      analystConsensus: '外資目標價創歷史新高，散熱族群為最強AI次族群',
      keyRisk: '股價已超高，若市場出現獲利了結，跌幅可能大',
      globalNews: [
        'NVIDIA：2026年Blackwell Ultra機架功耗高達1MW，液冷是唯一可行方案',
        'IEA報告：AI資料中心2026年用電量將達326TWh，相當於一個中型國家用電量',
        '台達電/奇鋐合作液冷基礎設施：完整液冷生態系統形成',
        'Microsoft/Google建設核能電廠供電AI資料中心，長期用電需求確立',
      ],
    },

    packaging: {
      score: 7,
      outlook: '偏多',
      catalysts: [
        'NVIDIA包下台積電2026年逾50% CoWoS封裝產能，外包訂單挹注日月光',
        'AMD攜手日月光切入CoWoS封裝，訂單多元化',
        '京元電為NVIDIA Rubin晶片樣品主要測試廠，2026H2業績爆發在即',
        '力成HBM測試需求強勁，高附加價值訂單比重提升',
        '先進封裝產值2026年估年增35%，台灣封裝廠全面受益',
        'Intel法說會：台灣先進封裝合作訂單維持，封裝業務穩定',
        '台積電美國封裝廠預計2028年才量產，短期海外競爭壓力有限',
      ],
      risks: ['非NVIDIA訂單稀釋高利潤率，整體毛利率仍偏低', 'CoWoS轉移需求高度集中在NVIDIA一客戶風險'],
      analystConsensus: '日月光外資「買進」目標價220-240元；封裝族群整體評等中性偏多',
      keyRisk: 'CoWoS產能高度集中NVIDIA，若NVIDIA訂單調整，台廠受衝擊大',
      globalNews: [
        'TSMC CoWoS 2026年底月產能突破4萬片，仍難滿足需求',
        'AMD MI400攻入微軟Azure，封裝測試需求擴散至非NVIDIA',
        '先進封裝成台灣半導體護城河：CoWoS/SoIC技術領先全球至少3年',
      ],
    },
  },

  stockRatings: {
    '2382': { rating: '強力買進', target: 390, broker: '摩根士丹利・高盛', note: '廣達AI伺服器佔比持續提升，2026年EPS估達20元' },
    '6669': { rating: '買進',     target: 6500, broker: '瑞銀・美林', note: '緯穎AI伺服器訂單能見度延伸至2027年' },
    '2376': { rating: '買進',     target: 360, broker: '花旗・德意志', note: '技嘉GPU主板+AI伺服器雙引擎成長' },
    '3034': { rating: '中性偏多', target: 530, broker: '摩根大通', note: '聯詠AI顯示晶片業績逐季走強' },
    '3231': { rating: '買進',     target: 168, broker: '高盛', note: '緯創AI伺服器美國廠產能開出' },
    '2408': { rating: '強力買進', target: 340, broker: '野村・瑞銀', note: '南亞科HBM3量產在即，記憶體超級週期核心受益' },
    '2344': { rating: '買進',     target: 148, broker: '元大投顧', note: '華邦電AI Edge記憶體切入高成長' },
    '2337': { rating: '中性偏多', target: 195, broker: '凱基投顧', note: '旺宏NOR Flash需求回溫，SRAM需求長線正面' },
    '3260': { rating: '中性',     target: 215, broker: '國泰投顧', note: '威剛DRAM模組受惠AI伺服器記憶體需求' },
    '3491': { rating: '買進',     target: 2200, broker: '國泰投顧・富邦', note: '昇達科低軌衛星模組訂單大幅成長' },
    '2314': { rating: '中性偏多', target: 275, broker: '元大投顧', note: '台揚低軌衛星PCB+AI通訊設備雙受惠' },
    '5371': { rating: '中性',     target: 82,  broker: '凱基投顧', note: '中光電背光模組+衛星通訊雙業務' },
    '2327': { rating: '強力買進', target: 620, broker: '高盛・花旗', note: '國巨AI被動元件訂單爆發，漲停刷新分割後新高' },
    '2492': { rating: '買進',     target: 165, broker: '元大投顧', note: '華新科MLCC AI規格佔比提升' },
    '3026': { rating: '買進',     target: 335, broker: '富邦投顧', note: '禾伸堂鉭電容缺貨受惠，評等大幅升級' },
    '3324': { rating: '強力買進', target: 1250, broker: '摩根士丹利', note: '雙鴻液冷訂單滿載至2027年，目標價持續上修' },
    '6230': { rating: '買進',     target: 780, broker: '凱基投顧', note: '超眾（尼得科超眾）NVIDIA GB200液冷主力供應商' },
    '3017': { rating: '強力買進', target: 3100, broker: '高盛・美林・摩根士丹利', note: '奇鋐散熱龍頭，液冷滲透率提升最大受益者' },
    '3711': { rating: '買進',     target: 245, broker: '野村', note: '日月光CoWoS外包訂單確認，AMD訂單多元化' },
    '6239': { rating: '中性偏多', target: 285, broker: '玉山投顧', note: '力成HBM測試需求強勁，毛利率有望提升' },
    '2449': { rating: '買進',     target: 115, broker: '富邦投顧', note: '京元電Rubin晶片測試主力廠，2026H2業績爆發' },
    '2313': { rating: '買進',     target: 320, broker: '凱基投顧', note: '華通PCB受益AI伺服器+低軌衛星雙族群，LEO板出貨高速成長' },
  },

  globalDemand: {
    us: { score: 10, summary: 'Google/Amazon/Microsoft/Meta 2026年AI資本支出合計7250億美元（年增77%），微軟1900億（超預期24%），Amazon 2000億，AI需求持續超越供給。BofA/Evercore估2027年突破兆美元。' },
    europe: { score: 7, summary: 'EU AI法案通過後加速部署，SAP/西門子/ASML等大廠採購增加。德法政府AI基礎建設補貼計畫落地。歐洲自建AI算力避免依賴美中。' },
    japan: { score: 8, summary: 'SoftBank孫正義1000億美元AI基金啟動，NTT/富士通大量採購AI伺服器。日本政府「AI立國」戰略，補貼台廠在日AI設施合作。' },
    korea: { score: 7, summary: '三星/SK海力士HBM積極擴產（競爭），但韓國科技巨頭AI投資規模僅次於美國。HBM定價談判緊繃，台廠議價空間有限。' },
    china: { score: 5, summary: '美國出口管制升級限制高階AI晶片輸中，但百度/阿里/騰訊持續中低階AI投資。中國自研AI晶片進展緩慢，台廠受管制影響部分業務。' },
    middleeast: { score: 7, summary: 'Saudi Aramco宣布百億美元AI投資，UAE/Qatar積極建設AI基礎設施，成為新興AI市場。台灣AI供應鏈已開始切入中東市場。' },
  },

  computex2026: {
    date: '2026年6月1日-6月5日',
    theme: 'AI Together',
    venue: '台北南港展覽館 + 世貿中心',
    keyEvents: [
      { date: '5/22', event: '蘇姿丰（AMD）抵台演講，拜會台積電爭取產能，AMD概念股漲停' },
      { date: '5/27', event: '黃仁勳（NVIDIA）預計抵台，舉辦「兆元宴」廣邀供應鏈龍頭' },
      { date: '6/1',  event: '黃仁勳主題演講：Rubin平台+Feynman架構完整揭露，GTC Taipei同步' },
      { date: '6/1',  event: '劉揚偉（鴻海）演講：AI伺服器組裝・液冷散熱・機器人（鴻海重返Computex）' },
      { date: '6/2',  event: 'Intel CEO陳立武演講（報名額滿），Intel台灣供應鏈深度合作細節' },
      { date: '6/2',  event: 'Qualcomm CEO Amon演講：AI Edge晶片新佈局' },
      { date: '6/3',  event: 'Arm CEO Rene Haas演講：Arm架構在AI時代的進化' },
    ],
    marketImpact: 'Computex前一週通常是台股AI族群最強催化劑，歷史平均漲幅5-15%',
    impactedSectors: ['ai', 'thermal', 'packaging', 'memory', 'satellite', 'passive'],
  },
}

export function getSectorContext(sectorKey) {
  const ctx      = MARKET_CONTEXT.sectors[sectorKey]
  const computex = MARKET_CONTEXT.computex2026
  const global   = MARKET_CONTEXT.global

  if (!ctx) {
    return `【全球AI市場 ${MARKET_CONTEXT.lastUpdate}】
四大超大規模雲端業者2026年AI資本支出合計7250億美元（年增77%）。
Computex 2026（6/1-6/5）：黃仁勳/蘇姿丰/Intel CEO齊聚台灣，AI供應鏈催化劑持續發酵。
主要風險：電力基礎設施瓶頸、台股融資水位偏高。`
  }

  return `【市場情境 ${MARKET_CONTEXT.lastUpdate}】
🎪 Computex 2026（${computex.date}）「${computex.theme}」：${computex.keyEvents.slice(0,2).map(e=>`${e.date} ${e.event}`).join('；')}
💰 全球AI資本支出：Google/Amazon/Microsoft/Meta合計7250億美元（年增77%），2027年估破兆
📊 ${ctx.outlook}（情境分 ${ctx.score}/10）
📈 主要催化劑：${ctx.catalysts.slice(0,3).join('；')}
🌍 全球需求：美國10/10・日本8/10・歐洲7/10・韓國7/10・中東7/10
⚠️ 風險：${ctx.keyRisk}
📰 最新消息：${ctx.globalNews?.slice(0,2).join('；') || ''}`
}

export function getStockRating(code) {
  return MARKET_CONTEXT.stockRatings[code] || null
}

export function getMarketSentimentBonus(sectorKey) {
  const sectorScore = MARKET_CONTEXT.sectors[sectorKey]?.score || 6
  const globalScore = MARKET_CONTEXT.global.sentiment
  const computexBonus = 10
  return {
    sectorScore,
    globalScore,
    computexBonus,
    totalBonus: Math.round((sectorScore + globalScore) / 2) + computexBonus,
  }
}
