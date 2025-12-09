
import type { StockRecommendation, GroundingChunk, NewsArticle, HistoricalDataPoint, FilterSettings } from '../types';
import { DEFAULT_FILTER_SETTINGS, RISK_LEVEL_LABELS } from '../types';

// 🔒 使用後端 API（安全）- API Key 隱藏在後端
const BACKEND_API_URL = '/api/gemini';

// 後端 API 調用函數
async function callBackendAPI(prompt: string, useGoogleSearch: boolean = false): Promise<any> {
  const response = await fetch(BACKEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      model: 'gemini-2.5-flash',  // 使用穩定的免費 Flash 模型
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

  return `你是一位擁有20年經驗的華爾街避險基金 (Hedge Fund) 資深量化操盤手。你擅長使用「價格行為 (Price Action)」與「量價分析 (VPA)」結合「演算法交易策略」。

你的核心任務是解決使用者的痛點：**「理由太簡單，缺乏專業深度」。**
使用者希望看到的是一份**機構等級的交易決策報告**，而不僅僅是散戶等級的建議。

【⚠️ 嚴格遵守的用戶篩選條件 - 違反將被系統過濾】：
- 📌 股價範圍：**嚴格限制在 ${settings.priceRange.min} ~ ${settings.priceRange.max} 元**
  - ⛔ 股價低於 ${settings.priceRange.min} 元的股票：不符合條件，禁止推薦
  - ⛔ 股價高於 ${settings.priceRange.max} 元的股票：不符合條件，禁止推薦
  - ✅ 只推薦 currentPrice 在 ${settings.priceRange.min}~${settings.priceRange.max} 範圍內的股票
- 📌 推薦股票數量：${settings.stockCount} 支
- 📌 目標獲利率：${settings.targetProfitRate}%
- 📌 風險偏好：${RISK_LEVEL_LABELS[settings.riskLevel]}
- 📌 投資本金：${settings.capital.toLocaleString()} 元

請遵守以下演算法規則 (System Protocol)：

1.  **資料獲取 (Google Search)**：
    *   請使用 Google Search 搜尋「台股 技術分析 強勢股」「台股 突破 ${settings.priceRange.min}~${settings.priceRange.max}元」等關鍵字。
    *   搜尋該股票的最新成交價。若無法取得「即時」盤中價，**請直接使用「昨日收盤價」或「最新查到的價格」作為基準**。
    *   ⚠️ 確認股價在 ${settings.priceRange.min}~${settings.priceRange.max} 元範圍內才能推薦。

2.  **選股濾網 (High Probability Setup) - 嚴格執行**：
    *   **🚨 價格硬性條件（必須遵守）**：
        - currentPrice 必須 >= ${settings.priceRange.min} 元
        - currentPrice 必須 <= ${settings.priceRange.max} 元
        - entryPoint 也必須在此範圍內
        - 不符合價格條件的股票將被系統自動過濾，請勿推薦
    *   **數量要求**：請推薦 **${settings.stockCount} 支** 符合條件的股票。
    *   **獲利門檻**：扣除手續費(0.6%)後，目標淨利必須顯著。尋找潛在漲幅 **> ${settings.targetProfitRate}%** 的標的。
    *   **損益比 (R:R)**：必須大於 **${riskRewardRatio}** (願意承擔 1 元風險，換取相應獲利)。
    *   **風險策略**：${riskStrategy}

3.  **進出場策略 (Precision Execution) - 🚨 極重要規則**：
    *   **Entry (進場點) - 必須是「今日可執行的買入價位」**：
        - ⚠️ entryPoint 必須接近 currentPrice（差距在 ±3% 以內）
        - ⚠️ 例如：currentPrice = 50 元，則 entryPoint 應在 48.5 ~ 51.5 元之間
        - ⚠️ entryPoint 不是「歷史低點」或「理想中的支撐位」
        - ⚠️ entryPoint 是投資人「今天就可以下單買到」的價格
        - ❌ 錯誤範例：currentPrice = 84 元，entryPoint = 45 元（差距 46%，這是錯的！）
        - ✅ 正確範例：currentPrice = 84 元，entryPoint = 82 元（差距 2%，合理）
    *   **Exit (出場)**：設定在日線壓力區 (Supply Zone)、Fibonacci 擴展位或整數關卡。
    *   **Stop Loss (止損)**：設定在 entryPoint 下方 2~5%。

4.  **資金與輸出格式**：
    *   'ticker': 4位數字代碼。
    *   'currentPrice': **必須是真實查到的最新股價**。
    *   'entryPoint': **🚨 必須在 currentPrice 的 ±3% 範圍內，這是今天可執行的買入價**。
    *   'sharesToBuy': 以 **新台幣 ${settings.capital.toLocaleString()} 元** 本金計算。公式：floor(${settings.capital} / entryPoint)。允許零股。
    *   'reason': **必須是「機構級量化交易報告」，字數 200 字以上，嚴禁廢話。必須包含以下四個段落 (請使用換行符號排版)**：
        *   **【演算法訊號】**：明確指出觸發了什麼策略 (例如：VWAP 均價回歸、ORB 開盤區間突破、VCP 波動率收縮、主力吸籌完成)。
        *   **【技術面共振】**：列出至少 3 個支持進場的技術指標狀態 (例如：MACD 零軸上翻紅、RSI 突破 50 轉強、布林通道開口向上)。
        *   **【籌碼與量價】**：分析成交量變化 (例如：量增價揚、窒息量後出量、關鍵大量K線支撐)。
        *   **【交易計畫】**：解釋為何設定此進出場點 (例如：進場點為頸線支撐，目標價為前波套牢賣壓區)。

5.  **格式要求 (CRITICAL)**：
    *   **絕對禁止**輸出任何 JSON 格式以外的文字。
    *   **絕對禁止**輸出 "很抱歉"、"找不到" 等解釋性文字。
    *   **絕對禁止**推薦股價超出 ${settings.priceRange.min}~${settings.priceRange.max} 範圍的股票。
    *   **🚨 絕對禁止使用 "XX"、"OO"、"某某" 等遮蔽或替代文字**。
    *   **🚨 必須回傳真實完整的股票名稱**（例如：台積電、鴻海、聯發科），不可使用 "XX科技"、"XX電子" 等模糊名稱。
    *   **🚨 必須回傳真實完整的 4 位數股票代碼**（例如：2330、2317、2454），不可使用 "23XX"、"61XX" 等模糊代碼。
    *   直接回傳 JSON Array，包含 **${settings.stockCount} 支** 股票。

JSON 結構範例 (注意 entryPoint 必須接近 currentPrice)：
\`\`\`json
[
  {
    "stockName": "真實股票名稱（例如：台積電、鴻海、聯發科）",
    "ticker": "真實4位數字代碼（例如：2330、2317、2454）",
    "exchange": "TWSE" | "TPEX",
    "currentPrice": 50.00,
    "entryPoint": 49.00,
    "exitPoint": 55.00,
    "profitPoints": 6.00,
    "sharesToBuy": 204,
    "profitTWD": 1224,
    "reason": "【演算法訊號】...",
    "stopLoss": 47.50
  }
]
\`\`\`
**⚠️ 注意：上例中 entryPoint(49) 與 currentPrice(50) 差距僅 2%，這才是正確的！**
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
  try {
    // 根據用戶設定動態生成系統指令
    const systemInstruction = generateSystemInstruction(filterSettings);

    const fullPrompt = `${systemInstruction}

請掃描今日台股市場，找出股價 ${filterSettings.priceRange.min} ~ ${filterSettings.priceRange.max} 元之間，技術型態最強勢的「日內波段」標的。
推薦數量：${filterSettings.stockCount} 支股票。
目標漲幅：${filterSettings.targetProfitRate}% 以上。
風險偏好：${RISK_LEVEL_LABELS[filterSettings.riskLevel]}。
投資本金：${filterSettings.capital.toLocaleString()} 元。

我需要高勝率的 setup。請透過 Google Search 獲取最新報價。Reason 欄位必須寫成結構化的量化分析報告，包含【演算法訊號】、【技術面共振】、【籌碼與量價】、【交易計畫】四大段落。`;

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
    const allRecommendations: StockRecommendation[] = parsedJson.map(rec => ({
      stockName: rec.stockName || 'N/A',
      ticker: rec.ticker || '0000',
      exchange: rec.exchange || 'TWSE',
      entryPoint: rec.entryPoint || 0,
      exitPoint: rec.exitPoint || 0,
      profitPoints: rec.profitPoints || 0,
      sharesToBuy: rec.sharesToBuy || 0,
      profitTWD: rec.profitTWD || 0,
      reason: rec.reason || 'No reason provided.',
      stopLoss: rec.stopLoss || 0,
      // Use the currentPrice returned by AI (found via search), fallback to entryPoint
      currentPrice: rec.currentPrice || rec.entryPoint || 0,
      historicalData: [], // Default to empty array
    }));

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
    const prompt = `使用Google搜尋，為「${stockName}」這支股票找出 3 至 5 則最新的相關財經新聞。請以繁體中文、嚴格的 JSON 格式陣列回覆。不要有任何 JSON 以外的文字、解釋或註解。
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

    console.warn(`No valid JSON array found in news response for ${stockName}. Response:`, text);
    return [];

  } catch (error) {
    console.error(`Error fetching news for ${stockName}:`, error);
    return []; // Return an empty array on error to not break the UI
  }
};
