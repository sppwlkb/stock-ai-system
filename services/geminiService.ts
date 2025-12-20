
import type { StockRecommendation, GroundingChunk, NewsArticle, HistoricalDataPoint, FilterSettings } from '../types';
import { DEFAULT_FILTER_SETTINGS, RISK_LEVEL_LABELS } from '../types';
import { validateAndCorrectStock } from './stockValidationService';

// 🔒 使用後端 API（安全）- API Key 隱藏在後端
const BACKEND_API_URL = '/api/gemini';

// ⚡ 股票推薦快取設定（減少 API 配額消耗）
const RECOMMENDATIONS_CACHE_KEY = 'stockRecommendationsCache';
const RECOMMENDATIONS_CACHE_DURATION_MS = 30 * 60 * 1000; // 30 分鐘快取

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
      temperature: useGoogleSearch ? 0.4 : 1.0,
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

  return `你是一位擁有20年經驗的華爾街避險基金 (Hedge Fund) 資深量化操盤手，同時也是 CFA 特許金融分析師。
你的分析報告必須達到**機構法人等級**，能夠說服專業股票分析師和基金經理人下單執行。

📅 **今日日期：${todayStr}**

🎯 **你的核心任務**：
解決使用者的痛點：「操作理由太籠統、缺乏具體數據，無法說服專業投資人下單」。
你必須提供的是一份**機構級量化交易決策報告**，而非散戶等級的模糊建議。

【⚠️ 嚴格遵守的用戶篩選條件 - 違反將被系統過濾】：
- 📌 股價範圍：**嚴格限制在 ${settings.priceRange.min} ~ ${settings.priceRange.max} 元**
- 📌 推薦股票數量：${settings.stockCount} 支
- 📌 目標獲利率：${settings.targetProfitRate}%
- 📌 風險偏好：${RISK_LEVEL_LABELS[settings.riskLevel]}
- 📌 投資本金：${settings.capital.toLocaleString()} 元
- 📌 損益比要求：${riskRewardRatio}
- 📌 風險策略：${riskStrategy}

═══════════════════════════════════════════════════════
📊 【reason 欄位格式 - 機構級完整報告】
═══════════════════════════════════════════════════════

**reason 必須包含六大專業段落**（完整詳細，約 600-900 字）：

【市場環境分析】（100-150 字）
- 大盤走勢：加權指數位置、趨勢方向（多頭/盤整/空頭）
- ⚠️ 台指期夜盤：查詢最新的台指期夜盤漲跌點數（這是領先指標，反映國際盤變化）
- 開盤預估：根據期貨夜盤變化，預估今日開盤走勢（跳空高開/低開/平盤）
- 類股輪動：該股所屬類股近期表現（如電子股、金融股、傳產股）
- 國際情勢：美股、費半、台積電 ADR 等影響因素

【消息面利多】（80-120 字）
- 公司新聞：近期重大消息（法說會、大單、新產品、併購等）
- 產業趨勢：所屬產業的利多因素（如 AI、車用電子、綠能等）
- 財報/營收：最近一期營收或財報表現（月增/年增比較）

【演算法訊號】（100-150 字）
- 策略名稱（VCP/杯柄/旗形/突破等）
- 型態描述（回檔幅度、整理天數、振幅收斂比例）
- 突破確認（量比倍數、成交張數 vs 20日均量）

【技術面共振】（150-200 字）
- RSI(14) 數值與解讀
- MACD 柱狀圖狀態（數值、與訊號線比較）
- 布林通道位置（中軌/上軌數值）
- 均線排列（5MA/10MA/20MA 具體數值與交叉狀態）
- 當日成交量與均量比較

【籌碼與量價】（100-150 字）
- 近 5 日主力買賣超張數（含日期區間）
- 外資/投信持股變化
- 關鍵大量 K 線日期與收盤價（形成支撐/壓力位）

【資金控管建議】（50-80 字）
- 建議投入比例
- 分批進場策略
- 加碼條件

⚠️ **禁止在 reason 中寫【交易計畫】段落！**
交易計畫（進場價、停損價、目標價）會由系統從 JSON 欄位自動顯示，
reason 欄位不要重複寫具體的進場/停損/目標價位數字，避免數據不一致。

═══════════════════════════════════════════════════════
📋 【資料獲取與驗證規則】
═══════════════════════════════════════════════════════

1. **Google Search 搜尋**：
   - 搜尋「台股 技術分析 強勢股 ${todayStr}」「台股 突破 ${settings.priceRange.min}~${settings.priceRange.max}元」
   - 搜尋個股的最新成交價、技術指標數據、籌碼資訊

2. **價格硬性條件**：
   - currentPrice 必須 >= ${settings.priceRange.min} 元 且 <= ${settings.priceRange.max} 元
   - entryPoint 必須接近 currentPrice（差距在 ±3% 以內）
   - ❌ 錯誤：currentPrice = 84 元，entryPoint = 45 元（差距 46%）
   - ✅ 正確：currentPrice = 84 元，entryPoint = 82 元（差距 2%）

3. **輸出格式要求**：
   - 直接回傳 JSON Array，包含 ${settings.stockCount} 支股票
   - 禁止輸出任何 JSON 以外的文字
   - 禁止使用 "XX"、"OO"、"某某" 等遮蔽文字
   - 必須回傳真實完整的股票名稱和代碼

═══════════════════════════════════════════════════════
📝 【JSON 結構完整範例】
═══════════════════════════════════════════════════════

\`\`\`json
[
  {
    "stockName": "矽統",
    "ticker": "2363",
    "exchange": "TWSE",
    "currentPrice": 49.30,
    "entryPoint": 48.31,
    "exitPoint": 53.14,
    "profitPoints": 4.83,
    "sharesToBuy": 1034,
    "profitTWD": 4994,
    "stopLoss": 45.89,
    "reason": "【市場環境分析】查詢今日加權指數（約 28,XXX 點）及大盤走勢。⚠️ 重要：查詢台指期夜盤漲跌點數（例如：夜盤收 XXXX 點，較前日跌 XXX 點），這是領先指標。根據夜盤變化預估今日開盤走勢。分析該股所屬類股近期表現，以及美股、費半、台積電 ADR 等國際因素影響。\\n\\n【消息面利多】搜尋該股近一週內（2025年12月）的最新新聞、法說會、營收公告等消息。說明產業趨勢利多因素（如 AI、車用電子、綠能等），以及最新一期營收表現（月增/年增比較）。\\n\\n【演算法訊號】說明使用的技術型態策略（VCP/杯柄/旗形/突破等），描述型態的回檔幅度、整理天數、振幅收斂比例。提供突破確認的量比倍數、成交張數 vs 20日均量數據。\\n\\n【技術面共振】三大指標分析：\\n1. RSI(14) 數值及解讀（是否突破 50 中線）。\\n2. MACD(12,26,9) 柱狀圖狀態、當前值與訊號線比較。\\n3. 布林通道中軌與上軌數值。\\n4. 均線排列狀態：5MA/10MA/20MA 具體數值與交叉狀態。\\n\\n【籌碼與量價】主力買賣超分析：\\n近 5 日主力累計買賣超張數（含具體日期區間），外資/投信持股變化。標示關鍵大量 K 線日期與收盤價（形成支撐/壓力位）。\\n\\n【資金控管建議】根據夜盤走勢調整建議。若夜盤大跌，建議觀望或減少部位；若夜盤穩定，可依計畫進場。說明分批進場策略和加碼/減碼條件。"
  }
]
\`\`\`

⚠️ **重要提醒**：
- reason 必須包含六大段落：【市場環境分析】【消息面利多】【演算法訊號】【技術面共振】【籌碼與量價】【資金控管建議】
- 每個段落都要有具體數據支撐
- 【市場環境分析】須包含大盤、類股、國際行情
- 【消息面利多】須包含公司新聞、產業趨勢、營收表現
- ❌ **禁止**在 reason 中寫【交易計畫】段落或任何具體的進場價/停損價/目標價數字
- 交易計畫會由系統從 JSON 欄位 (entryPoint, stopLoss, exitPoint) 自動顯示
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
 * @returns AI 推薦的股票清單和資料來源
 */
export const getTradingRecommendations = async (
  filterSettings: FilterSettings = DEFAULT_FILTER_SETTINGS
): Promise<{ recommendations: StockRecommendation[], sources: GroundingChunk[] }> => {
  // ⚡ 優先檢查快取（減少 API 配額消耗）
  const cached = getCachedRecommendations(filterSettings);
  if (cached) {
    return cached;
  }

  try {
    // 根據用戶設定動態生成系統指令
    const systemInstruction = generateSystemInstruction(filterSettings);

    const fullPrompt = `${systemInstruction}

🎯 **執行任務**：
請掃描今日台股市場，找出股價 ${filterSettings.priceRange.min} ~ ${filterSettings.priceRange.max} 元之間，技術型態最強勢的「波段交易」標的。

📋 **篩選條件**：
- 推薦數量：${filterSettings.stockCount} 支股票
- 目標漲幅：${filterSettings.targetProfitRate}% 以上
- 風險偏好：${RISK_LEVEL_LABELS[filterSettings.riskLevel]}
- 投資本金：${filterSettings.capital.toLocaleString()} 元

📊 **分析要求**：
請透過 Google Search 獲取**即時**的最新數據：
1. 🔴 **加權指數**：必須查詢今日的真實加權指數點位（目前約 28,000 點上下），不要使用舊數據
2. 🔴 **台指期夜盤**：必須查詢最新的台指期夜盤漲跌情況（這是領先指標！）
   - 如果夜盤大跌，表示今日開盤可能跳空下跌，需要謹慎
   - 如果夜盤大漲，表示今日開盤可能跳空上漲，可積極操作
3. 🔴 **股票報價**：必須查詢該股票今日的真實股價
4. 🔴 **新聞消息**：只搜尋最近一週內（2025年12月）的新聞，排除 2024 年或更早的舊聞
5. 🔴 **技術數據**：使用最新的技術指標數據

⚠️ **reason 欄位必須包含六大專業段落**：
【市場環境分析】【消息面利多】【演算法訊號】【技術面共振】【籌碼與量價】【資金控管建議】

每個段落都要有具體數據，總字數約 600-900 字。
🔔 **【市場環境分析】必須包含台指期夜盤的漲跌點數和開盤預估！**
❌ **禁止**在 reason 中寫【交易計畫】或任何進場價/停損價/目標價數字！
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
