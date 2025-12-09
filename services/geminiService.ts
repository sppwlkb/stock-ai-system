
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
📊 【reason 欄位必須包含的五大專業段落 - 機構級要求】
═══════════════════════════════════════════════════════

**【演算法訊號】** - 必須包含「具體策略名稱 + 觸發條件 + 具體數值」：
- ✅ 正確範例：「VCP 波動率收縮完成。股價自 11/15 高點 52.0 元回檔至 12/1 低點 45.5 元後，近 5 日在 47.0-49.0 元窄幅整理，振幅收斂至 4.3%。12/8 放量突破整理區，成交量 6,200 張為 20 日均量 3,400 張的 1.82 倍，符合 VCP 突破特徵。」
- ❌ 錯誤範例：「MACD 零軸上翻紅」（太籠統，沒有具體數值）

**【技術面共振】** - 必須列出「至少 3 個指標 + 每個指標的具體數值」：
- RSI(14) 當前值（例如：RSI(14) = 58.3，12/7 突破 50 中線轉強）
- MACD(12,26,9) 柱狀圖數值（例如：當前值 0.42 > 訊號線 0.31，柱狀圖連續 4 日擴大）
- 布林通道上中下軌的「具體價位」（例如：中軌 48.2 元，上軌 51.5 元形成第一壓力）
- 均線排列的「具體價格」（例如：5MA(48.8) > 10MA(47.5) > 20MA(46.2)，多頭排列）
- 成交量與 20 日均量的「具體比較」（例如：今日量 5,200 張，為 20 日均量 3,100 張的 1.68 倍）

**【籌碼與量價】** - 必須包含「具體數據和日期」：
- 近 5 日主力買賣超金額（例如：12/4-12/8 主力累計買超 2,850 張）
- 外資、投信持股變化（例如：外資連續 3 日買超共 1,500 張）
- 關鍵大量 K 線的「日期 + 價位 + 張數」（例如：11/25 出現 8,500 張爆量長紅 K，收 45.5 元形成關鍵支撐）

**【交易計畫】** - 必須明確量化所有價位：
- 進場價：具體價位 + 設定理由（例如：「建議 49.0-49.5 元分批進場，此為 10MA 支撐位 + 整理區上緣」）
- 停損價：具體價位 + 停損幅度（例如：「停損設在 46.0 元（-6.1%），跌破 20MA 即出場」）
- 目標價：第一目標 + 第二目標 + 預期漲幅（例如：「第一目標 54.0 元（+9.1%），第二目標 58.0 元（+17.3%）」）
- 風險報酬比：具體計算（例如：「風險 3.0 元 vs 報酬 8.5 元 = R:R 1:2.83」）

**【資金控管建議】**：
- 建議投入資金比例（例如：「建議投入總資金的 25%，分 2-3 批進場」）
- 加碼條件（例如：「若突破 51.5 元（布林上軌）且量能維持 5,000 張以上可加碼 10%」）

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
📝 【JSON 結構範例】
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
    "reason": "【演算法訊號】VCP 波動率收縮完成。股價自 11/15 高點 52.0 元回檔至 12/1 低點 45.5 元後，近 5 日在 47.0-49.0 元窄幅整理，振幅收斂至 4.3%。12/8 放量突破整理區，成交量 6,200 張為 20 日均量 3,400 張的 1.82 倍。\\n\\n【技術面共振】三大指標同步轉強：\\n1. RSI(14) = 58.3，12/7 突破 50 中線轉強\\n2. MACD(12,26,9) 柱狀圖連續 4 日擴大，當前值 0.42 > 訊號線 0.31\\n3. 布林通道開口向上，中軌 48.2 元，上軌 51.5 元\\n4. 均線多頭排列：5MA(48.8) > 10MA(47.5) > 20MA(46.2)\\n\\n【籌碼與量價】主力連續 3 日買超。12/6-12/8 主力累計買超 2,850 張，外資同步買超 1,500 張。11/25 出現 8,500 張爆量長紅 K，收 45.5 元形成關鍵支撐。\\n\\n【交易計畫】\\n- 進場：48.0-48.5 元分批進場（10MA 支撐 + 整理區上緣）\\n- 停損：45.89 元（-5%，跌破 20MA 即出場）\\n- 目標：第一目標 53.14 元（+10%），第二目標 55.0 元（+13.8%）\\n- R:R：風險 2.42 元 vs 報酬 4.83 元 = 1:2.0\\n\\n【資金控管建議】建議投入總資金 25%，若突破 51.5 元（布林上軌）且量能維持 5,000 張以上可加碼 10%"
  }
]
\`\`\`

⚠️ **重要提醒**：
- reason 欄位的五個段落缺一不可
- 每個段落都必須包含「具體數值」而非模糊描述
- 這份報告必須讓專業分析師看完後能夠自信執行交易
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

🎯 **執行任務**：
請掃描今日台股市場，找出股價 ${filterSettings.priceRange.min} ~ ${filterSettings.priceRange.max} 元之間，技術型態最強勢的「波段交易」標的。

📋 **篩選條件**：
- 推薦數量：${filterSettings.stockCount} 支股票
- 目標漲幅：${filterSettings.targetProfitRate}% 以上
- 風險偏好：${RISK_LEVEL_LABELS[filterSettings.riskLevel]}
- 投資本金：${filterSettings.capital.toLocaleString()} 元

📊 **分析要求（機構級標準）**：
請透過 Google Search 獲取最新報價和技術數據。

⚠️ **reason 欄位必須包含五大專業段落**：
1. 【演算法訊號】：策略名稱 + 觸發條件 + 具體數值（如 VCP 收斂幅度、突破量比）
2. 【技術面共振】：至少 3 個指標的「具體數值」（RSI=58.3、MACD=0.42、5MA=48.8 元）
3. 【籌碼與量價】：主力買賣超張數、外資持股變化、關鍵大量 K 線日期和價位
4. 【交易計畫】：進場/停損/目標的「具體價位」+ 風險報酬比計算
5. 【資金控管建議】：建議投入比例 + 加碼條件

🚨 **重要**：這份報告必須讓專業分析師看完後能夠自信執行交易，每個段落都必須包含「具體數值」而非模糊描述。`;

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
