# 🚀 小七AI選股系統 v2.0

> **專業級台股分析系統 - 真實數據 × AI智能 × 風險管理**

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/yourusername/stock-ai)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178c6.svg)](https://www.typescriptlang.org/)

---

## 📖 系統簡介

小七AI選股系統 v2.0 是一個整合**台灣證交所真實股價 API**、**Google Gemini AI 分析**與**專業風險管理**的台股分析工具。

### 🎯 核心特色

- ✅ **真實數據保證**：使用台灣證交所官方 API，告別模擬數據
- 🤖 **AI 智能分析**：Google Gemini 2.5 Flash 模型，結合網路即時資訊
- ⚡ **專業風險管理**：5項風險指標、4級風險分類、智能資金管理
- ⚖️ **法律合規完善**：詳盡免責聲明、資料來源透明化、強制風險確認
- 📊 **視覺化圖表**：整合 TradingView 專業圖表
- 📱 **響應式設計**：支援桌面、平板、手機多種裝置

---

## 🆕 v2.0 重大更新

### 第一優先：資料真實性 ✅

| 項目 | v1.0 | v2.0 |
|------|------|------|
| 即時股價 | ❌ 隨機模擬 | ✅ 證交所 API |
| 歷史數據 | ❌ AI 生成 | ✅ 證交所真實歷史 |
| 資料來源標記 | ❌ 無 | ✅ 完整透明化 |

### 第二優先：風險管理 ✅

- ✅ 風險報酬比計算
- ✅ 歷史波動率分析（年化）
- ✅ 最大回撤評估
- ✅ 夏普比率計算
- ✅ 4級風險分類（低/中/高/極高）
- ✅ 智能資金管理建議
- ✅ 動態止損計算（ATR 基礎）

### 第三優先：法律合規 ✅

- ✅ 強化版免責聲明（6大章節）
- ✅ 首次使用強制風險確認彈窗
- ✅ 資料來源完整透明化
- ✅ 系統限制詳細說明

---

## 🛠️ 技術架構

### 前端技術棧

```
React 18.2.0          - UI 框架
TypeScript 5.8.2      - 型別安全
Vite 6.2.0            - 建置工具
Tailwind CSS          - 樣式框架
TradingView Widget    - 圖表元件
```

### 後端服務

```
Google Gemini 2.5 Flash  - AI 分析引擎
TWSE API                 - 台灣證交所即時股價
TWSE OpenAPI             - 歷史K線數據
Google Search            - 新聞與市場資訊
```

### 核心模組

```
services/
├── twseDataService.ts      - 證交所資料服務（新增）
├── riskManagement.ts       - 風險管理系統（新增）
├── geminiService.ts        - AI 分析服務（升級）
├── stockDataService.ts     - 股價資料服務（重寫）
└── backtestService.ts      - 回測服務

components/
├── EnhancedDisclaimer.tsx  - 強化免責聲明（新增）
├── StockTable.tsx          - 股票表格（升級）
├── StockChart.tsx          - 圖表元件
└── BacktestResult.tsx      - 回測結果
```

---

## 🚀 快速開始

### 1. 環境需求

- Node.js 18+ 
- npm 或 yarn
- Google Gemini API 金鑰（[免費申請](https://ai.google.dev/)）

### 2. 安裝步驟

```bash
# 1. 進入專案目錄
cd "Downloads/小七ai選股系統"

# 2. 安裝依賴
npm install

# 3. 設定環境變數
# 創建 .env.local 檔案並加入：
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# 4. 啟動開發伺服器
npm run dev

# 5. 開啟瀏覽器
# 訪問 http://localhost:3000
```

### 3. 建置生產版本

```bash
npm run build
npm run preview
```

---

## 📊 功能說明

### 1. 真實股價整合

```typescript
// 使用台灣證交所 API 獲取即時股價
const price = await fetchRealtimePrice('2330', 'TWSE');

// 批次獲取多支股票
const prices = await fetchBatchRealtimePrices([
  { ticker: '2330', exchange: 'TWSE' },
  { ticker: '2454', exchange: 'TWSE' }
]);

// 獲取90天歷史數據
const history = await fetchHistoricalData('2330', 90);
```

### 2. 風險評估

```typescript
// 綜合風險評估
const assessment = assessRisk(
  entryPrice: 45,
  exitPrice: 50,
  stopLoss: 43,
  historicalData: [...] 
);

// 輸出範例：
{
  level: 'medium',
  riskRewardRatio: 2.5,
  volatility: 35.2,
  maxDrawdown: 12.5,
  sharpeRatio: 1.8,
  winProbability: 65.5,
  recommendation: '⚠️ 中等風險：風險報酬比尚可，需注意波動風險'
}
```

### 3. 資金管理

```typescript
// 計算建議倉位
const position = calculatePositionSize(
  accountBalance: 100000,
  riskPercentage: 2,
  entryPrice: 45,
  stopLoss: 43
);

// 輸出範例：
{
  recommendedShares: 1000,
  maxPositionSize: 45000,
  riskAmount: 2000,
  riskPercentage: 2,
  stopLossDistance: 2
}
```

---

## ⚠️ 重要聲明

### 免責聲明

本系統為**學術研究與教育用途**，所有資訊僅供參考，**不構成任何投資建議**。

- ⚠️ 股票投資具有高度風險，可能導致本金全部損失
- ⚠️ AI 分析可能存在誤差或不準確的情況
- ⚠️ 歷史績效不代表未來表現
- ⚠️ 使用者應自行評估並承擔所有投資決策的責任
- ⚠️ 本系統開發者不對任何投資損失負責

### 資料來源

- **即時股價**：台灣證交所 API（優先）→ AI 搜尋（備援）
- **歷史數據**：台灣證交所 OpenAPI
- **AI 分析**：Google Gemini 2.5 Flash
- **新聞資訊**：AI 搜尋整合

---

## 📚 文件

- [升級報告](UPGRADE_REPORT.md) - 詳細的 v2.0 升級說明
- [測試指南](TESTING_GUIDE.md) - 完整的功能測試步驟
- [API 文件](docs/API.md) - API 使用說明（待補充）

---

## 🤝 貢獻指南

歡迎提交 Issue 或 Pull Request！

### 開發流程

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📄 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

---

## 📞 聯絡方式

- **GitHub Issues**: [提交問題](https://github.com/yourusername/stock-ai/issues)
- **Email**: your.email@example.com

---

## 🙏 致謝

- [Google Gemini](https://ai.google.dev/) - AI 分析引擎
- [台灣證券交易所](https://www.twse.com.tw/) - 官方資料 API
- [TradingView](https://www.tradingview.com/) - 圖表元件
- [React](https://reactjs.org/) - UI 框架

---

<div align="center">

**⭐ 如果這個專案對您有幫助，請給我們一個 Star！**

Made with ❤️ by 小七AI選股系統團隊

</div>

