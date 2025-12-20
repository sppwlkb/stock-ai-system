
import type { StockRecommendation, GroundingChunk, NewsArticle, HistoricalDataPoint, FilterSettings } from '../types';
import { DEFAULT_FILTER_SETTINGS, RISK_LEVEL_LABELS } from '../types';
import { validateAndCorrectStock } from './stockValidationService';

// 🔒 使用後端 API（安全）- API Key 隱藏在後端
const BACKEND_API_URL = '/api/gemini';

// ⚡ 股票推薦快取設定（減少 API 配額消耗）
const RECOMMENDATIONS_CACHE_KEY = 'stockRecommendationsCache';
const RECOMMENDATIONS_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 分鐘快取（縮短以增加多樣性）

// 🔄 上次選擇的股票（用於避免重複選股）
let lastSelectedTickers: string[] = [];

interface RecommendationsCacheData {
  data: {
    recommendations: StockRecommendation[];
    sources: GroundingChunk[];
  };
  settings: string; // 設定的 JSON 字串（用於比對）
  timestamp: number;
}

/**
 * 從快取獲取股票推薦（如果未過期且設定相同）
 */
function getCachedRecommendations(settings: FilterSettings): RecommendationsCacheData['data'] | null {
  try {
    const cached = localStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
    if (!cached) return null;

    const cacheData: RecommendationsCacheData = JSON.parse(cached);
    const now = Date.now();

    // 檢查是否過期
    if (now - cacheData.timestamp >= RECOMMENDATIONS_CACHE_DURATION_MS) {
      console.log('📦 股票推薦快取已過期');
      return null;
    }

    // 檢查設定是否相同
    const currentSettingsStr = JSON.stringify(settings);
    if (cacheData.settings !== currentSettingsStr) {
      console.log('📦 設定已變更，不使用快取');
      return null;
    }

    console.log('📦 使用快取的股票推薦資料');
    return cacheData.data;
  } catch {
    return null;
  }
}

/**
 * 儲存股票推薦到快取
 */
function setCachedRecommendations(
  settings: FilterSettings,
  recommendations: StockRecommendation[],
  sources: GroundingChunk[]
): void {
  try {
    const cacheData: RecommendationsCacheData = {
      data: { recommendations, sources },
      settings: JSON.stringify(settings),
      timestamp: Date.now(),
    };
    localStorage.setItem(RECOMMENDATIONS_CACHE_KEY, JSON.stringify(cacheData));
    console.log('📦 已儲存股票推薦到快取');
  } catch (e) {
    console.warn('無法儲存股票推薦快取:', e);
  }
}

/**
 * 清除股票推薦快取（用於強制刷新）
 */
export function clearRecommendationsCache(): void {
  localStorage.removeItem(RECOMMENDATIONS_CACHE_KEY);
  lastSelectedTickers = [];
  console.log('🗑️ 已清除股票推薦快取');
}

// 後端 API 調用函數
async function callBackendAPI(prompt: string, useGoogleSearch: boolean = false): Promise<any> {
  const response = await fetch(BACKEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      model: 'gemini-2.0-flash',  // 使用穩定的免費模型
      // 提高 temperature 增加選股隨機性，避免每次選到相同股票
      temperature: useGoogleSearch ? 0.8 : 1.0,
      useGoogleSearch: useGoogleSearch
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `API 錯誤: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success || !data.text) {
    throw new Error('無法從後端 API 獲取回應');
  }

  return {
    text: data.text,
    candidates: data.candidates || []
  };
}

/**
 * 根據用戶設定動態生成 AI 系統指令
 * @param settings 用戶篩選設定
 * @returns 動態生成的系統指令
 */
const generateSystemInstruction = (settings: FilterSettings): string => {
  // 根據風險等級決定損益比要求
  const riskRewardRatio = settings.riskLevel === 'conservative' ? '1:3' :
                          settings.riskLevel === 'moderate' ? '1:2' : '1:1.5';

  // 根據風險等級決定選股策略描述
  const riskStrategy = settings.riskLevel === 'conservative'
    ? '優先選擇低波動、業績穩定的大型股或權值股，避免投機性質高的標的'
    : settings.riskLevel === 'moderate'
    ? '平衡成長性與穩定性，選擇具有技術突破訊號的中型股'
    : '可以選擇高成長性、高波動的小型股或題材股，追求較高報酬';

  // 獲取今日日期
  const today = new Date();
  const todayStr = today.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

  return `你是一位擁有20年經驗的華爾街避險基金 (Hedge Fund) 資深量化操盤手，專精於「妖股」（高成長潛力股）挖掘。
你結合 CFA 金融分析師資格與程式化交易專業，擅長從 1700+ 支台股中發掘被市場低估的飆股。

📅 **今日日期：${todayStr}**

🎯 **你的核心任務 - 妖股獵人**：
專門挖掘具備「爆發潛力」的股票，特徵包括：
1. 技術面出現突破整理區訊號
2. 籌碼面有主力/法人大量進場跡象
3. 消息面有重大利多尚未完全反映在股價上
4. 估值面仍有上升空間（低本益比、低基期）

【🚨 最重要的硬性條件 - 違反將全部作廢】：

⛔⛔⛔ **股價範圍是最嚴格的限制** ⛔⛔⛔
- 用戶設定的價格範圍：**${settings.priceRange.min} ~ ${settings.priceRange.max} 元**
- 每支股票的 currentPrice 必須 >= ${settings.priceRange.min} 元 且 <= ${settings.priceRange.max} 元
- ❌ **絕對禁止**推薦超出價格範圍的股票！
- ❌ 即使技術面再好、消息面再利多，超出價格範圍的股票一律不選！
- ❌ 例如：如果上限是 50 元，絕對不能選 51 元以上的股票！
- ✅ 只從符合價格範圍的股票池中挑選妖股

📌 其他篩選條件：
- 推薦股票數量：${settings.stockCount} 支
- 目標獲利率：${settings.targetProfitRate}%
- 風險偏好：${RISK_LEVEL_LABELS[settings.riskLevel]}
- 投資本金：${settings.capital.toLocaleString()} 元
- 損益比要求：${riskRewardRatio}（至少 1:3 以上為佳）
- 📌 風險策略：${riskStrategy}

═══════════════════════════════════════════════════════
🔥 【妖股篩選核心條件 - 必須符合至少 3 項】
═══════════════════════════════════════════════════════

**技術指標訊號（至少符合 2 項）**：
✅ VCP 波動率收縮型態：股價回檔幅度逐漸縮小（如 15% → 8% → 4%），振幅收斂
✅ 突破整理區：股價突破近 10-20 日高點，且量能放大至 1.5 倍以上
✅ RSI(14) > 50：突破中線轉強，最佳買點在 55-70 區間
✅ MACD 黃金交叉：柱狀圖由負轉正，DIF 上穿 DEA
✅ KD 黃金交叉：K 值上穿 D 值，且 K > 50
✅ 均線多頭排列：5MA > 10MA > 20MA > 60MA
✅ 布林通道突破：股價突破上軌且量能放大

**籌碼面訊號（至少符合 1 項）**：
✅ 主力連續買超：近 5 日主力累計買超 > 500 張
✅ 外資大量進場：外資連續 3 日以上買超
✅ 投信積極布局：投信持股比例快速上升
✅ 融資餘額下降：籌碼洗清，浮額減少
✅ 法人持股比例上升：三大法人合計持股週增 > 0.5%

**消息面利多（優先選擇）**：
🔥 熱門題材股：AI、半導體、電動車、機器人、低軌衛星、綠能
🔥 法說會利多：公司釋出正面展望或調升財測
🔥 訂單暴增：取得大單、產能滿載
🔥 外資調升目標價：知名券商調升評等或目標價
🔥 營收創高：月營收創新高或年增率 > 20%
🔥 低本益比成長股：本益比 < 15 但營收持續成長

**量價特徵**：
✅ 爆量長紅：單日成交量 > 20 日均量 2 倍，收紅 K
✅ 縮量回檔：回檔時成交量萎縮，顯示惜售
✅ 突破時放量：突破壓力位時量能明顯放大

═══════════════════════════════════════════════════════
📊 【reason 欄位格式 - 專業分析師等級報告】
═══════════════════════════════════════════════════════

⚠️ **核心要求：個股差異化分析**
- 每支股票的分析必須是**獨一無二**的，不能套用固定範本
- 必須透過 Google Search 查詢該股票的**真實即時數據**
- 禁止虛構任何數字！所有數值必須來自搜尋結果
- 分析內容要讓 20 年經驗的專業分析師看完後願意下單

**reason 必須包含六大專業段落**（總字數 800-1200 字）：

═══════════════════════════════════════════════════════
【市場環境分析】（120-180 字）
═══════════════════════════════════════════════════════
🔍 **必須搜尋查詢**：「加權指數 今日」「台指期 夜盤」「費半指數」

必須包含：
1. 加權指數：今日收盤點位、漲跌點數、漲跌幅（例：23,150 點，跌 180 點，-0.77%）
2. 台指期夜盤：夜盤收盤點位、較前日漲跌（例：夜盤收 22,980 點，跌 170 點）
3. 開盤預估：根據夜盤走勢預估今日開盤方向
4. 類股表現：該股所屬類股今日表現排名（例：電子股今日漲幅 +1.2%，排名第 3）
5. 國際連動：美股道瓊、那斯達克、費半指數昨日表現

═══════════════════════════════════════════════════════
【消息面利多】（150-200 字）⭐ 這段是說服力關鍵
═══════════════════════════════════════════════════════
🔍 **必須搜尋查詢**：「[股票名稱] 新聞 2025年12月」「[股票名稱] 法說會」「[股票名稱] 營收」

必須包含（至少 3 項具體消息）：
1. 📰 **公司新聞**：搜尋該股近一週內的真實新聞
   - 引用新聞標題（例：「XX 公司取得蘋果 5 億美元訂單」）
   - 說明消息來源（例：經濟日報 12/18 報導）
   - 分析對股價的影響

2. 💰 **營收數據**：搜尋最新月營收公告
   - 具體數字（例：11 月營收 18.5 億元，月增 12.3%，年增 35.7%）
   - 是否創歷史新高或近 X 個月新高
   - 累計營收年增率

3. 🏭 **產業地位**：說明該公司在產業中的競爭優勢
   - 市佔率、技術門檻、客戶結構
   - 為什麼選這支而不是同業其他股票

4. 🎯 **題材加持**：是否受惠於熱門題材（AI/半導體/電動車/機器人）
   - 具體說明如何受惠（例：供應輝達 AI 伺服器散熱模組）

═══════════════════════════════════════════════════════
【演算法訊號】（150-200 字）
═══════════════════════════════════════════════════════
🔍 **必須搜尋查詢**：「[股票名稱] 技術分析」「[股票名稱] K線」

必須包含：
1. 🎯 **型態辨識**：明確指出使用的策略（VCP/杯柄/旗形/箱型突破）
2. 📉 **回檔分析**：
   - 近期高點價位和日期（例：12/5 創高點 58.5 元）
   - 回檔低點價位和日期（例：12/12 回測 52.0 元，回檔幅度 11.1%）
3. 📊 **整理型態**：
   - 盤整區間（例：在 52-55 元區間整理）
   - 整理天數（例：整理 8 個交易日）
   - 振幅收斂情況（例：振幅從 6% 收斂至 2.5%）
4. 🚀 **突破確認**：
   - 突破日期和價位（例：12/19 突破 55 元整理區）
   - 突破日成交量（例：成交 8,500 張，為 20 日均量 3,200 張的 2.66 倍）

═══════════════════════════════════════════════════════
【技術面共振】（180-250 字）⭐ 必須有具體數值
═══════════════════════════════════════════════════════
🔍 **必須搜尋查詢**：「[股票名稱] RSI」「[股票名稱] MACD」「[股票名稱] 均線」

必須包含所有指標的**具體數值**：
1. 📈 **RSI(14)**：
   - 當前數值（例：RSI = 67.2）
   - 解讀：是否突破 50 中線、是否超買（>80）或超賣（<20）
   - 趨勢：RSI 是上升還是下降

2. 📈 **MACD(12,26,9)**：
   - DIF 值（例：DIF = 1.25）
   - DEA 值（例：DEA = 0.87）
   - 柱狀圖（例：柱狀圖 = 0.38，連續 5 日擴大）
   - 是否黃金交叉或死亡交叉

3. 📈 **KD(9,3,3)**：
   - K 值和 D 值（例：K = 72.5，D = 65.3）
   - 是否黃金交叉

4. 📈 **布林通道**：
   - 中軌、上軌、下軌數值
   - 股價相對位置（例：股價 55.5 元，接近上軌 56.2 元）

5. 📈 **均線排列**：
   - 5MA、10MA、20MA、60MA 具體數值
   - 是否多頭排列（5MA > 10MA > 20MA > 60MA）
   - 關鍵均線支撐位

6. 📊 **共振解讀**：說明多個指標同時轉強的意義

═══════════════════════════════════════════════════════
【籌碼與量價】（150-200 字）⭐ 必須有日期和張數
═══════════════════════════════════════════════════════
🔍 **必須搜尋查詢**：「[股票名稱] 籌碼」「[股票名稱] 主力買超」「[股票名稱] 外資」

必須包含**具體日期區間和張數**：
1. 🏦 **主力動向**：
   - 日期區間（例：12/15-12/19）
   - 累計買賣超張數（例：主力累計買超 3,850 張）
   - 連續買超天數

2. 🏦 **外資動態**：
   - 近 5 日買賣超張數（例：外資連續 4 日買超，累計 2,150 張）
   - 持股比例變化

3. 🏦 **投信動態**：
   - 投信買賣超情況（例：投信近 5 日買超 580 張）
   - 持股水位

4. 💹 **融資融券**：
   - 融資餘額變化（例：融資減少 1,200 張，籌碼洗清）
   - 融券餘額變化

5. 📊 **關鍵 K 線**：
   - 標示爆量長紅日期（例：12/10 爆量 12,000 張，收 52.5 元長紅）
   - 該 K 線形成的支撐意義

6. 📊 **支撐壓力**：
   - 短期支撐位（例：52.0 元，為 12/10 爆量 K 線低點）
   - 短期壓力位（例：58.5 元，為 12/5 前波高點）

═══════════════════════════════════════════════════════
【資金控管建議】（100-150 字）
═══════════════════════════════════════════════════════
必須包含：
1. 💰 **投入比例**：建議佔總資金的百分比（例：建議投入 25%）
2. 💰 **分批策略**：
   - 分幾批進場（例：分 3 批）
   - 首批比例和條件（例：首批 40%，於現價附近進場）
   - 加碼比例和條件（例：第二批 30%，突破 XX 元時加碼）
3. ⚠️ **風險提醒**：
   - 潛在風險因素（例：大盤若跌破 22,500 點需謹慎）
   - 減碼條件（例：跌破 XX 元減碼 50%）
4. 📊 **風險報酬比**：計算風險報酬比（例：風險報酬比 1:4.2）

═══════════════════════════════════════════════════════
⚠️ **嚴格禁止事項**
═══════════════════════════════════════════════════════
❌ 禁止虛構任何數字！所有數值必須來自 Google Search
❌ 禁止使用「約」「大約」「可能」等模糊用語
❌ 禁止套用固定範本！每支股票必須獨特分析
❌ 禁止在 reason 中寫【交易計畫】或任何進場/停損/目標價
❌ 禁止使用 2024 年或更早的舊數據

═══════════════════════════════════════════════════════
📋 【資料獲取與驗證規則 - 必須執行】
═══════════════════════════════════════════════════════

🔍 **每支股票必須執行以下搜尋**：
1. 搜尋「[股票名稱] 股價」→ 獲取真實股價
2. 搜尋「[股票名稱] 新聞 2025年12月」→ 獲取最新消息
3. 搜尋「[股票名稱] 營收」→ 獲取營收數據
4. 搜尋「[股票名稱] 技術分析 RSI MACD」→ 獲取技術指標
5. 搜尋「[股票名稱] 籌碼 主力」→ 獲取籌碼資訊
6. 搜尋「[股票名稱] 外資 投信」→ 獲取法人動態

📌 **價格硬性條件**：
- currentPrice 必須 >= ${settings.priceRange.min} 元 且 <= ${settings.priceRange.max} 元
- entryPoint 必須接近 currentPrice（差距在 ±3% 以內）
- ❌ 錯誤：currentPrice = 84 元，entryPoint = 45 元（差距 46%）
- ✅ 正確：currentPrice = 84 元，entryPoint = 82 元（差距 2%）

📌 **數據真實性要求**：
- 所有數字必須來自 Google Search 搜尋結果
- 禁止虛構任何數值！
- 如果搜尋不到某項數據，請標註「查無資料」而非編造

📌 **輸出格式要求**：
- 直接回傳 JSON Array，包含 ${settings.stockCount} 支股票
- 禁止輸出任何 JSON 以外的文字
- 禁止使用 "XX"、"OO"、"某某" 等遮蔽文字

═══════════════════════════════════════════════════════
📝 【專業分析師等級 reason 範例】
═══════════════════════════════════════════════════════

以下是一個達到專業分析師水準的 reason 範例（注意具體數據和個股特色）：

\`\`\`json
[
  {
    "stockName": "緯創",
    "ticker": "3231",
    "exchange": "TWSE",
    "currentPrice": 118.50,
    "entryPoint": 116.00,
    "exitPoint": 153.05,
    "profitPoints": 37.05,
    "sharesToBuy": 430,
    "profitTWD": 15932,
    "stopLoss": 110.20,
    "reason": "【市場環境分析】加權指數今日收 23,156 點，小跌 45 點（-0.19%），守穩 23,000 點整數關卡。台指期夜盤收 23,080 點，較日盤小跌 76 點，顯示國際盤影響有限。電子類股今日上漲 0.35%，其中 AI 伺服器族群表現強勢。美股費半指數昨日收 5,285 點，上漲 1.2%，輝達創歷史新高，帶動 AI 供應鏈氣氛。\\n\\n【消息面利多】緯創為輝達 GB200 伺服器主要組裝廠，市佔率約 35%，技術門檻高。據經濟日報 12/18 報導，緯創取得 Meta 新一代 AI 伺服器訂單，預計 2025 年 Q1 開始出貨。11 月營收 1,052 億元，月增 8.7%，年增 42.3%，創歷史新高，累計前 11 月營收年增 31.5%。相較同業廣達（營收年增 28%）、英業達（年增 22%），緯創成長動能最強。本益比僅 12.5 倍，低於 AI 伺服器族群平均 18 倍，估值仍有上升空間。\\n\\n【演算法訊號】採用 VCP 波動率收縮策略。股價 12/5 創高點 125.5 元後回檔，12/12 回測 108.0 元（回檔幅度 13.9%），隨後在 108-118 元區間整理 7 個交易日，振幅從初期 8.5% 收斂至 3.2%。12/19 放量突破 118 元整理區上緣，成交 28,500 張，為 20 日均量 12,300 張的 2.32 倍，突破有效。\\n\\n【技術面共振】多重指標同步轉強：RSI(14) = 68.5，12/16 突破 50 中線後持續上升，尚未超買。MACD(12,26,9) 呈現黃金交叉，DIF = 2.85 上穿 DEA = 1.92，柱狀圖 = 0.93 連續 6 日擴大。KD(9,3,3) 黃金交叉，K = 75.2 > D = 68.7。布林通道中軌 112.5 元，上軌 122.8 元，股價 118.5 元位於中上軌之間，仍有上漲空間。均線多頭排列：5MA(116.8) > 10MA(114.2) > 20MA(112.5) > 60MA(105.3)，短中長期均線向上發散。\\n\\n【籌碼與量價】主力連續進場：12/15-12/19 主力累計買超 8,520 張，連續 5 日買超。外資同步加碼：近 5 日外資買超 12,350 張，持股比例從 42.3% 上升至 43.1%。投信積極布局：投信近 5 日買超 2,180 張。融資餘額減少 3,500 張（從 28,000 張降至 24,500 張），籌碼明顯洗清。關鍵 K 線：12/12 出現 35,000 張爆量長下影線，收 110.5 元，形成短期強力支撐。短期支撐 110 元（爆量 K 線低點），短期壓力 125.5 元（12/5 前波高點）。\\n\\n【資金控管建議】建議投入總資金 25%，分 3 批進場。首批 40%（約 10% 總資金）於 116-118 元附近進場；第二批 35%（約 9% 總資金）待突破 125 元時加碼；第三批 25%（約 6% 總資金）待突破 130 元時追買。風險提醒：若大盤跌破 22,500 點或個股跌破 110 元支撐，應減碼 50%。若跌破 105 元（60MA），全數出場。風險報酬比：潛在獲利 37 元 vs 潛在虧損 8.3 元 = 1:4.5，符合標準。"
  }
]
\`\`\`

⚠️ **重要：上述範例展示的分析深度和具體程度是最低標準**
- 每支股票都必須達到這個水準
- 數據必須透過 Google Search 查詢真實值
- 禁止套用範本！每支股票的分析必須獨特
- ❌ **禁止**在 reason 中寫【交易計畫】或任何進場/停損/目標價數字
`;
};

/**
 * Helper function to retry API calls with exponential backoff on 429/503 errors.
 */
async function retryWithBackoff<T>(operation: () => Promise<T>, retries: number = 3, initialDelay: number = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      // Check specifically for 429 (Quota Exceeded) or 503 (Service Unavailable)
      const status = error.status || error.response?.status;
      const message = error.message || JSON.stringify(error);
      
      const isTransientError = 
        status === 429 || 
        status === 503 || 
        message.includes('429') || 
        message.includes('quota') || 
        message.includes('RESOURCE_EXHAUSTED');
      
      if (isTransientError && i < retries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`API Limit Hit or Service Busy. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}


/**
 * 獲取 AI 股票推薦
 * @param filterSettings 用戶篩選設定（可選，預設使用 DEFAULT_FILTER_SETTINGS）
 * @param forceRefresh 是否強制刷新（跳過快取）
 * @returns AI 推薦的股票清單和資料來源
 */
export const getTradingRecommendations = async (
  filterSettings: FilterSettings = DEFAULT_FILTER_SETTINGS,
  forceRefresh: boolean = false
): Promise<{ recommendations: StockRecommendation[], sources: GroundingChunk[] }> => {

  // 🔄 生成唯一的隨機種子
  const randomSeed = Date.now() + Math.random();
  console.log(`🎲 隨機種子: ${randomSeed}`);
  console.log(`📊 上次選股: ${lastSelectedTickers.length > 0 ? lastSelectedTickers.join(', ') : '無'}`);

  // ⚡ 優先檢查快取（減少 API 配額消耗）
  if (!forceRefresh) {
    const cached = getCachedRecommendations(filterSettings);
    if (cached) {
      console.log('📦 使用快取結果（如需新選股，請等待 5 分鐘或強制刷新）');
      return cached;
    }
  } else {
    console.log('🔄 強制刷新：跳過快取');
    // 清除快取
    localStorage.removeItem(RECOMMENDATIONS_CACHE_KEY);
  }

  try {
    // 根據用戶設定動態生成系統指令
    const systemInstruction = generateSystemInstruction(filterSettings);

    // 生成避免重複選股的指令
    const avoidStocksInstruction = lastSelectedTickers.length > 0
      ? `\n\n🚫 **禁止選擇以下股票（上次已選過）**：${lastSelectedTickers.join('、')}\n必須選擇與上述完全不同的股票！`
      : '';

    const fullPrompt = `${systemInstruction}

🎯 **執行任務 - 專業分析師妖股獵人模式**：

⛔⛔⛔ **最重要：股價範圍限制** ⛔⛔⛔
用戶設定的價格範圍：**${filterSettings.priceRange.min} ~ ${filterSettings.priceRange.max} 元**
- 你推薦的每一支股票，currentPrice 必須在 ${filterSettings.priceRange.min} ~ ${filterSettings.priceRange.max} 元之間
- ❌ 絕對禁止推薦超出這個價格範圍的股票！
- ❌ 聯發科(1410元)、台達電(911元)、台積電(1100元) 這些高價股如果超出範圍就不能選！
- ✅ 只能從價格 ${filterSettings.priceRange.min} ~ ${filterSettings.priceRange.max} 元的股票中挑選

請掃描今日台股市場中，**股價 ${filterSettings.priceRange.min} ~ ${filterSettings.priceRange.max} 元**的股票，挖掘具有「爆發潛力」的妖股標的。
${avoidStocksInstruction}

🎲 **多樣性要求（極度重要！）**
- 唯一隨機種子：${randomSeed}
- ⛔ **禁止連續兩次分析選擇相同的股票！**
- ❌ 禁止每次都選相同的熱門股（如聯電、華碩、鴻準、智邦）
- ✅ 優先發掘冷門但技術面強勢的潛力股
- ✅ 從不同產業類股中選擇（電子、金融、傳產、生技等）
- ✅ 考慮中小型股、上櫃股票

📋 **其他篩選條件**：
- 推薦數量：${filterSettings.stockCount} 支股票
- 目標漲幅：${filterSettings.targetProfitRate}% 以上
- 風險偏好：${RISK_LEVEL_LABELS[filterSettings.riskLevel]}
- 投資本金：${filterSettings.capital.toLocaleString()} 元
- 風險報酬比：至少 1:3 以上

═══════════════════════════════════════════════════════
⭐ **核心要求：專業分析師等級的 reason**
═══════════════════════════════════════════════════════

你生成的每個 reason 都必須讓 20 年經驗的專業分析師：
✅ 認同分析邏輯和數據支撐
✅ 願意考慮買進這支股票
✅ 感受到這是針對該股票的深度研究，而非套用範本
✅ 能夠清楚理解買進理由、風險和操作策略

🔴 **禁止制式化分析！每支股票必須獨特**：
- 每支股票的分析必須完全不同，不能套用相同範本
- 必須說明「為什麼選這支股票」而不是其他同類股
- 必須體現該公司的獨特競爭優勢和產業地位
- 必須引用具體的新聞標題、日期、數據來源

🔴 **數據真實性 - 這是最重要的要求**：
- 所有技術指標數值必須透過 Google Search 查詢真實數據
- 籌碼資訊必須有具體日期區間和張數
- 營收數據必須引用真實的月營收公告
- 新聞消息必須引用真實的報導標題和來源
- 禁止虛構任何數字！如果查不到就標註「查無資料」

📊 **必須執行的 Google Search 查詢（每支股票）**：
1. 搜尋「加權指數 今日」→ 獲取大盤點位
2. 搜尋「台指期 夜盤」→ 獲取夜盤漲跌
3. 搜尋「[股票名稱] 股價」→ 獲取真實股價
4. 搜尋「[股票名稱] 新聞 2025年12月」→ 獲取最新消息
5. 搜尋「[股票名稱] 11月營收」→ 獲取營收數據
6. 搜尋「[股票名稱] 技術分析」→ 獲取 RSI/MACD/KD 數值
7. 搜尋「[股票名稱] 籌碼 主力 外資」→ 獲取買賣超張數

⚠️ **reason 欄位格式要求**：

【市場環境分析】（必須包含）
- 加權指數今日收盤點位、漲跌點數、漲跌幅（具體數字）
- 台指期夜盤收盤點位、較前日漲跌（具體數字）
- 該股所屬類股今日表現
- 美股/費半/台積電 ADR 影響

【消息面利多】（必須包含至少 3 項具體消息）
- 引用真實新聞標題和來源（例：「據經濟日報 12/18 報導...」）
- 營收數據必須具體（例：「11 月營收 XX 億元，月增 XX%，年增 XX%」）
- 說明該公司的競爭優勢和為什麼選它而非同業

【演算法訊號】（必須包含）
- 型態名稱（VCP/杯柄/旗形/箱型突破）
- 高點/低點價位和日期
- 回檔幅度百分比
- 整理天數和區間
- 突破日成交量 vs 20 日均量倍數

【技術面共振】（必須包含所有指標的具體數值）
- RSI(14) = XX.X（不能寫「約 XX」）
- MACD：DIF = XX.XX，DEA = XX.XX，柱狀圖 = XX.XX
- KD：K = XX.X，D = XX.X
- 布林通道：中軌 XX.X 元，上軌 XX.X 元
- 均線：5MA = XX.X，10MA = XX.X，20MA = XX.X，60MA = XX.X

【籌碼與量價】（必須包含日期區間和張數）
- 主力：「12/XX-12/XX 累計買超 XXXX 張」（不能寫「約 XXX 張」）
- 外資：「近 5 日買超 XXXX 張」
- 投信：「近 5 日買超 XXX 張」
- 關鍵 K 線日期和價位

【資金控管建議】（必須包含）
- 投入比例（佔總資金 XX%）
- 分批策略
- 風險提醒
- 風險報酬比計算

總字數：800-1200 字
❌ **禁止**在 reason 中寫【交易計畫】或任何進場/停損/目標價數字！
❌ **禁止**使用模糊用語如「約」「大約」「可能」！
❌ **禁止**使用 2024 年或更早的舊數據！`;

    const response = await retryWithBackoff(() => callBackendAPI(fullPrompt, true));

    const text = response.text;
    
    // Extract JSON from the response text, which might be wrapped in markdown
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text?.match(jsonRegex);

    let parsedJson: any[] = [];

    if (match && match[1]) {
      parsedJson = JSON.parse(match[1]);
    } else {
      // Fallback if no markdown code block is found, try to parse the whole string
      try {
        const safeText = text || '';
        const lastBracketIndex = safeText.lastIndexOf(']');
        const firstBracketIndex = safeText.indexOf('[');
        if (lastBracketIndex > -1 && firstBracketIndex > -1) {
            const jsonString = safeText.substring(firstBracketIndex, lastBracketIndex + 1);
            parsedJson = JSON.parse(jsonString);
        } else {
           // If strict JSON parsing fails, check if it's an empty result or text apology
           console.warn("Valid JSON not found in response:", text);
           throw new Error("AI 未能回傳有效的 JSON 格式數據。");
        }
      } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", text);
        throw new Error("AI 回應的格式不正確，無法解析。請稍後再試。");
      }
    }
    
    // Sanitize data and add missing properties to match the StockRecommendation type.
    // 🔧 同時驗證並修正 AI 可能搞錯的股票名稱（使用同步靜態對照表，無 CORS 問題）
    const allRecommendations: StockRecommendation[] = parsedJson.map((rec: any) => {
      // 驗證並修正股票名稱（同步函數，使用靜態對照表）
      const validated = validateAndCorrectStock(
        rec.ticker || '0000',
        rec.stockName || 'N/A'
      );

      // 🔧 如果股票名稱被修正，也要修正 reason 中的錯誤名稱
      let correctedReason = rec.reason || 'No reason provided.';

      // 📊 診斷日誌：顯示 AI 返回的 reason 長度和前 200 字
      console.log(`📝 ${rec.stockName}(${rec.ticker}) reason 長度: ${correctedReason.length} 字`);
      console.log(`📝 ${rec.stockName} reason 前 300 字: ${correctedReason.substring(0, 300)}...`);
      if (validated.corrected && rec.stockName && rec.stockName !== validated.name) {
        // 替換 reason 中的錯誤股票名稱
        correctedReason = correctedReason.replace(
          new RegExp(rec.stockName, 'g'),
          validated.name
        );
        console.log(`🔧 股票 ${rec.ticker}: "${rec.stockName}" → "${validated.name}" (含 reason 修正)`);
      }

      // 🔧 格式化 reason：確保段落有正確的換行
      // 處理 AI 可能輸出的各種換行格式
      correctedReason = correctedReason
        // 處理 JSON 中的 \\n 轉義字符
        .replace(/\\n/g, '\n')
        // 在每個【段落標題】前加入換行（確保分段）
        .replace(/([。！？])\s*【/g, '$1\n\n【')
        // 確保段落標題後有換行
        .replace(/】(?!\n)/g, '】\n')
        // 移除連續多餘的換行（最多保留兩個）
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return {
        stockName: validated.name,
        ticker: validated.ticker,
        exchange: rec.exchange || 'TWSE',
        entryPoint: rec.entryPoint || 0,
        exitPoint: rec.exitPoint || 0,
        profitPoints: rec.profitPoints || 0,
        sharesToBuy: rec.sharesToBuy || 0,
        profitTWD: rec.profitTWD || 0,
        reason: correctedReason,
        stopLoss: rec.stopLoss || 0,
        currentPrice: rec.currentPrice || rec.entryPoint || 0,
        historicalData: [],
      };
    });

    // ✅ 驗證邏輯：過濾不符合用戶篩選條件的股票
    const { min: minPrice, max: maxPrice } = filterSettings.priceRange;
    const filteredRecommendations = allRecommendations.filter(rec => {
      const price = rec.currentPrice;

      // 檢查股價是否在用戶設定的範圍內
      const isPriceValid = price >= minPrice && price <= maxPrice;

      if (!isPriceValid) {
        console.warn(
          `⚠️ 過濾掉不符合價格範圍的股票: ${rec.stockName} (${rec.ticker})，` +
          `股價 ${price} 元不在 ${minPrice}~${maxPrice} 範圍內`
        );
      }

      return isPriceValid;
    });

    // 如果過濾後沒有符合條件的股票，給出警告
    if (filteredRecommendations.length === 0 && allRecommendations.length > 0) {
      console.warn(
        `⚠️ AI 推薦的 ${allRecommendations.length} 支股票全部不符合價格範圍 ${minPrice}~${maxPrice} 元，` +
        `已被過濾。請調整篩選條件或稍後再試。`
      );
    }

    // 記錄過濾結果
    if (filteredRecommendations.length < allRecommendations.length) {
      console.log(
        `📊 篩選結果：AI 推薦 ${allRecommendations.length} 支 → 符合條件 ${filteredRecommendations.length} 支`
      );
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];

    // 🔄 記錄本次選擇的股票（用於下次避免重複）
    lastSelectedTickers = filteredRecommendations.map(r => `${r.stockName}(${r.ticker})`);
    console.log(`✅ 本次選股: ${lastSelectedTickers.join(', ')}`);

    // ⚡ 儲存到快取（減少 API 配額消耗）
    setCachedRecommendations(filterSettings, filteredRecommendations, sources);

    return { recommendations: filteredRecommendations, sources };

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    
    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("AI 服務使用量已達上限 (429 Quota Exceeded)。請稍後再試，或檢查您的 Google AI Studio API 額度。");
    }

    if (error instanceof Error) {
        throw new Error(`與 AI 服務通訊失敗: ${error.message}`);
    }
    throw new Error("與 AI 服務通訊時發生未知錯誤。");
  }
};

/**
 * 獲取真實歷史股價數據（使用 TWSE API）
 * 不再使用 AI 生成模擬數據，改用台灣證交所真實歷史資料
 */
export const getHistoricalStockData = async (stockName: string, ticker: string, entryPoint: number): Promise<HistoricalDataPoint[]> => {
  try {
    // 動態導入 TWSE 資料服務
    const { fetchHistoricalData } = await import('./twseDataService');

    // 獲取真實的90天歷史數據
    const realData = await fetchHistoricalData(ticker, 90);

    if (realData && realData.length > 0) {
      console.log(`✅ 成功獲取 ${stockName} (${ticker}) 的真實歷史數據: ${realData.length} 筆`);
      return realData;
    }

    // 如果 TWSE API 失敗，記錄警告並返回空陣列
    console.warn(`⚠️ 無法獲取 ${stockName} (${ticker}) 的真實歷史數據，回測功能將無法使用`);
    return [];

  } catch (error: any) {
    console.error(`❌ 獲取 ${stockName} 歷史數據時發生錯誤:`, error);
    return [];
  }
};


export const getStockNews = async (stockName: string): Promise<NewsArticle[]> => {
  try {
    // 優先使用 Google News RSS API 獲取真實新聞
    console.log(`📰 正在獲取 ${stockName} 的真實新聞...`);

    const response = await fetch(`/api/stock-news?stock=${encodeURIComponent(stockName)}&limit=5`);

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.news && data.news.length > 0) {
        console.log(`✅ 成功獲取 ${data.count} 則真實新聞 (來源: ${data.source})`);

        // 轉換格式以符合 NewsArticle 介面
        return data.news.map((item: any) => ({
          title: item.title,
          link: item.link,
          source: item.source || 'Google News'
        }));
      }
    }

    // 如果 Google News RSS 失敗，回退到 AI 生成（會有警告標示）
    console.warn(`⚠️ Google News RSS 失敗，回退到 AI 搜尋...`);
    return await getStockNewsFromAI(stockName);

  } catch (error) {
    console.error(`Error fetching news for ${stockName}:`, error);
    // 嘗試 AI 備援
    try {
      return await getStockNewsFromAI(stockName);
    } catch {
      return [];
    }
  }
};

/**
 * 備援方案：使用 AI 搜尋新聞（可能有幻覺問題）
 */
async function getStockNewsFromAI(stockName: string): Promise<NewsArticle[]> {
  try {
    const today = new Date();
    const todayStr = today.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneWeekAgoStr = oneWeekAgo.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

    const prompt = `使用Google搜尋，為「${stockName}」這支股票找出 3 至 5 則**最近一週內**（${oneWeekAgoStr} ~ ${todayStr}）的相關財經新聞。

⚠️ **重要限制**：
- 只搜尋 2025 年 12 月的新聞
- 排除 2024 年或更早的舊新聞
- 必須提供真實可訪問的新聞連結

請以繁體中文、嚴格的 JSON 格式陣列回覆。不要有任何 JSON 以外的文字、解釋或註解。
回傳的 JSON 格式必須如下：
\`\`\`json
[
  {
    "title": "新聞標題",
    "link": "新聞的完整URL",
    "source": "新聞來源 (例如: 鉅亨網, Anue)"
  }
]
\`\`\``;

    const response = await retryWithBackoff(() => callBackendAPI(prompt, true));

    const text = response.text?.trim();
    if (!text) {
      return [];
    }

    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);

    let jsonString: string | null = null;
    if (match && match[1]) {
      jsonString = match[1];
    } else if (text.startsWith('[') && text.endsWith(']')) {
      jsonString = text;
    } else {
      const firstBracketIndex = text.indexOf('[');
      const lastBracketIndex = text.lastIndexOf(']');
      if (firstBracketIndex > -1 && lastBracketIndex > -1) {
        jsonString = text.substring(firstBracketIndex, lastBracketIndex + 1);
      }
    }

    if (jsonString) {
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        console.error(`Failed to parse news JSON for ${stockName}:`, jsonString, e);
        return [];
      }
    }

    return [];
  } catch (error) {
    console.error(`Error fetching AI news for ${stockName}:`, error);
    return [];
  }
}
