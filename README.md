# 🐕 賺錢狗 — 自動看盤與下單系統

> **AI 驅動的台灣股市 K 線分析平台**  
> 目標：10 萬本金 → 500 萬（AI 輔助，人工決策）

🌐 **線上網址**：[https://troytoroi.github.io/zaijian-gou/](https://troytoroi.github.io/zaijian-gou/)

---

## ✨ 功能特色

| 功能 | 說明 |
|------|------|
| 📊 市場概覽 | 六大熱門族群即時瀏覽（AI/記憶體/衛星/被動元件/散熱/封裝） |
| 🧠 AI K線分析 | Claude AI 分析 K 線型態、趨勢、支撐壓力、RSI 指標 |
| 🔔 交易信號 | 信心度 ≥60% 自動產生買入信號，下單前跳出確認通知 |
| 💼 持倉追蹤 | 即時損益、停損/目標提醒、市價賣出 |
| 📈 資金追蹤 | 10 萬→500 萬進度條，即時總資產顯示 |

---

## 🗂️ 專案結構

```
zaijian-gou/
├── src/
│   ├── App.jsx                  # 主應用程式
│   ├── data/
│   │   └── sectors.js           # 六大族群股票設定
│   ├── services/
│   │   ├── claudeApi.js         # Claude AI 分析服務
│   │   └── stockApi.js          # 股價資料服務（可換真實 API）
│   └── components/
│       ├── Header.jsx           # 頂部資產顯示
│       ├── NavTabs.jsx          # 導覽列
│       ├── CandleChart.jsx      # SVG K 線圖
│       ├── MarketTab.jsx        # 市場概覽頁
│       ├── AnalysisTab.jsx      # 個股分析頁
│       ├── SignalsTab.jsx       # 交易信號頁
│       ├── PortfolioTab.jsx     # 持倉管理頁
│       ├── OrderModal.jsx       # 下單確認彈窗
│       └── Toast.jsx            # 通知元件
├── .github/workflows/
│   └── deploy.yml               # 自動部署到 GitHub Pages
├── index.html
├── vite.config.js
└── package.json
```

---

## 🚀 本機開發

```bash
# 安裝套件
npm install

# 啟動開發伺服器
npm run dev

# 打包
npm run build
```

---

## 🔄 換用真實股價資料

編輯 `src/services/stockApi.js`，將 `generateCandles()` 替換為真實 API 呼叫：

### FinMind（免費，需 Token）
```js
const res = await fetch(
  `https://api.finmind.tw/api/latest/taiwan/TaiwanStockPrice` +
  `?dataset=TaiwanStockPrice&data_id=${code}&start_date=${startDate}&token=${YOUR_TOKEN}`
)
```

### Yahoo Finance（需後端 Proxy，避免 CORS）
```
https://query1.finance.yahoo.com/v8/finance/chart/{code}.TW
```

---

## 📊 六大熱門族群

| 族群 | 主要個股 |
|------|----------|
| 🤖 AI 相關 | 廣達(2382)、緯穎(6669)、技嘉(2376)、聯詠(3034)、緯創(3231) |
| 💾 記憶體 | 南亞科(2408)、華邦電(2344)、旺宏(2337)、威剛(3260) |
| 🛰️ 低軌衛星 | 昇達科(3491)、台揚(2314)、中光電(5371) |
| ⚡ 被動元件 | 國巨(2327)、華新科(2492)、禾伸堂(3026) |
| ❄️ 散熱 | 雙鴻(3324)、超眾(6230)、奇鋐(3017) |
| 📦 封裝 | 日月光(3711)、力成(6239)、京元電(2449) |

---

## ⚠️ 免責聲明

本系統為 **輔助分析工具**，不構成投資建議。  
股市投資有風險，所有買賣決策由使用者自行負責。  
10 萬→500 萬為高風險目標，不保證達成。

---

*Powered by [Claude AI](https://claude.ai) · Built with React + Vite*
