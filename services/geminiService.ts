
import type { StockRecommendation, GroundingChunk, NewsArticle, HistoricalDataPoint } from '../types';

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
      model: 'gemini-2.0-flash-exp',
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

const systemInstruction = `你是一位擁有20年經驗的華爾街避險基金 (Hedge Fund) 資深量化操盤手。你擅長使用「價格行為 (Price Action)」與「量價分析 (VPA)」結合「演算法交易策略」。

你的核心任務是解決使用者的痛點：**「理由太簡單，缺乏專業深度」。**
使用者希望看到的是一份**機構等級的交易決策報告**，而不僅僅是散戶等級的建議。

請遵守以下演算法規則 (System Protocol)：

1.  **資料獲取 (Google Search)**：
    *   搜尋該股票的最新成交價。若無法取得「即時」盤中價，**請直接使用「昨日收盤價」或「最新查到的價格」作為基準**。

2.  **選股濾網 (High Probability Setup)**：
    *   **首選條件**：股價 **50 元以下** (符合小資操作)。
    *   **獲利門檻**：扣除手續費(0.6%)後，目標淨利必須顯著。尋找潛在漲幅 **> 4%** 的標的。
    *   **損益比 (R:R)**：必須大於 **1:3** (願意承擔 1 元風險，換取 3 元獲利)。
    *   **例外處理**：若無完美標的，請放寬標準推薦「相對強勢」的股票，並在理由中註明風險。**絕對禁止**不回答或回傳錯誤。

3.  **進出場策略 (Precision Execution)**：
    *   **Entry (進場)**：尋找回測支撐 (Pullback)、突破盤整區 (Breakout) 或 均線糾結發散點。
    *   **Exit (出場)**：設定在日線壓力區 (Supply Zone)、Fibonacci 擴展位或整數關卡。
    *   **Stop Loss (止損)**：設定在關鍵K線低點或支撐位下方 1-2 檔。

4.  **資金與輸出格式**：
    *   'ticker': 4位數字代碼。
    *   'sharesToBuy': 以 **新台幣 10,000 元 (一萬元)** 本金計算。公式：floor(10000 / entryPoint)。允許零股。
    *   'reason': **必須是「機構級量化交易報告」，字數 200 字以上，嚴禁廢話。必須包含以下四個段落 (請使用換行符號排版)**：
        *   **【演算法訊號】**：明確指出觸發了什麼策略 (例如：VWAP 均價回歸、ORB 開盤區間突破、VCP 波動率收縮、主力吸籌完成)。
        *   **【技術面共振】**：列出至少 3 個支持進場的技術指標狀態 (例如：MACD 零軸上翻紅、RSI 突破 50 轉強、布林通道開口向上)。
        *   **【籌碼與量價】**：分析成交量變化 (例如：量增價揚、窒息量後出量、關鍵大量K線支撐)。
        *   **【交易計畫】**：解釋為何設定此進出場點 (例如：進場點為頸線支撐，目標價為前波套牢賣壓區)。

5.  **格式要求 (CRITICAL)**：
    *   **絕對禁止**輸出任何 JSON 格式以外的文字。
    *   **絕對禁止**輸出 "很抱歉"、"找不到" 等解釋性文字。
    *   直接回傳 JSON Array。

JSON 結構範例 (務必回傳 currentPrice)：
\`\`\`json
[
  {
    "stockName": "string",
    "ticker": "string",
    "exchange": "TWSE" | "TPEX",
    "currentPrice": "number",
    "entryPoint": "number",
    "exitPoint": "number",
    "profitPoints": "number",
    "sharesToBuy": "number",
    "profitTWD": "number",
    "reason": "string",
    "stopLoss": "number"
  }
]
\`\`\`
`;

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


export const getTradingRecommendations = async (): Promise<{ recommendations: StockRecommendation[], sources: GroundingChunk[] }> => {
  try {
    const fullPrompt = `${systemInstruction}

請掃描今日台股市場，找出股價 50 元以下，技術型態最強勢的「日內波段」標的。我需要高勝率的 setup。請透過 Google Search 獲取最新報價。Reason 欄位必須寫成結構化的量化分析報告，包含【演算法訊號】、【技術面共振】、【籌碼與量價】、【交易計畫】四大段落。`;

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
    const recommendations: StockRecommendation[] = parsedJson.map(rec => ({
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

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];

    return { recommendations, sources };

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
