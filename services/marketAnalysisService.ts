/**
 * 市場分析服務
 * 獲取美股表現、聯準會政策、台股展望等市場分析資料
 */

import type { MarketAnalysis } from '../types';

// 使用後端 API 呼叫 Gemini
const BACKEND_API_URL = '/api/gemini';

// 快取設定：2 小時內使用相同的市場分析結果（減少 API 配額消耗）
const CACHE_KEY = 'marketAnalysisCache';
const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 小時（原為 30 分鐘）

interface CachedData {
  data: MarketAnalysis;
  timestamp: number;
}

/**
 * 生成市場分析 Prompt（包含當前日期）
 */
function generateMarketAnalysisPrompt(): string {
  // 獲取當前日期
  const today = new Date();
  const todayStr = today.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

  // 計算昨日日期
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

  // 判斷今天是星期幾（處理週一情況）
  const dayOfWeek = today.getDay();
  let usMarketDate = yesterdayStr;
  if (dayOfWeek === 1) {
    // 週一，美股數據用上週五
    const friday = new Date(today);
    friday.setDate(friday.getDate() - 3);
    usMarketDate = friday.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
  } else if (dayOfWeek === 0) {
    // 週日，美股數據用上週五
    const friday = new Date(today);
    friday.setDate(friday.getDate() - 2);
    usMarketDate = friday.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
  }

  return `你是一位專業的全球金融市場分析師。

📅 **重要時間資訊**：
- 今日日期：${todayStr}
- 昨日日期：${yesterdayStr}
- 美股最新收盤日期：${usMarketDate}

請分析以下三個面向，必須使用 **Google Search** 搜尋最新資料：

1. **美股表現**（${usMarketDate} 收盤數據）：
   - 搜尋關鍵字：「美股 ${usMarketDate} 收盤」「道瓊指數 今日」「S&P500 最新」
   - 必須提供道瓊、那斯達克、S&P500 的具體漲跌幅
   - 說明主要漲跌原因

2. **聯準會政策**（最近 7 天內的資訊）：
   - 搜尋關鍵字：「聯準會 利率 最新」「Fed 降息 2024」
   - 必須是 7 天內的官方聲明或新聞
   - 分析利率展望和市場影響

3. **台股展望**（基於 ${todayStr} 盤前資訊）：
   - 搜尋關鍵字：「台股 ${todayStr} 盤前」「台股 今日 展望」
   - 根據美股表現預測今日台股走勢
   - 列出熱門產業和關注重點

請以下列 JSON 格式回傳（直接回傳 JSON，不要加任何說明文字）：

\`\`\`json
{
  "usMarket": {
    "dataDate": "${usMarketDate}",
    "summary": "美股整體表現描述（含具體指數點位變化）",
    "dowJones": { "change": 0.8, "trend": "up" },
    "nasdaq": { "change": 1.5, "trend": "up" },
    "sp500": { "change": 1.2, "trend": "up" },
    "keyFactors": ["主要漲跌原因1", "主要漲跌原因2"]
  },
  "fedPolicy": {
    "dataDate": "最近政策發布日期（YYYY-MM-DD）",
    "summary": "聯準會政策摘要（含具體利率數據）",
    "rateOutlook": "dovish",
    "nextMeeting": "YYYY-MM-DD",
    "marketImpact": "對市場的具體影響"
  },
  "twMarketOutlook": {
    "dataDate": "${todayStr}",
    "summary": "台股展望摘要（含具體預測）",
    "openingExpectation": "gap_up",
    "hotSectors": ["熱門產業1", "熱門產業2", "熱門產業3"],
    "keyPoints": ["今日關注重點1", "今日關注重點2"]
  }
}
\`\`\`

⚠️ 重要規則：
1. **必須**透過 Google Search 獲取最新資料，不可使用過時資訊
2. **必須**在每個區塊回傳 dataDate（資料日期）
3. 漲跌幅使用百分比數值（例如：1.5 表示 +1.5%）
4. trend 只能是 "up"、"down" 或 "flat"
5. rateOutlook 只能是 "hawkish"、"dovish" 或 "neutral"
6. openingExpectation 只能是 "gap_up"、"gap_down" 或 "flat"
7. 直接回傳 JSON，不要加任何說明文字
`;
}

/**
 * 呼叫後端 API 獲取市場分析
 */
async function callMarketAnalysisAPI(): Promise<any> {
  // 動態生成包含當前日期的 prompt
  const dynamicPrompt = generateMarketAnalysisPrompt();

  const response = await fetch(BACKEND_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: dynamicPrompt,
      model: 'gemini-2.0-flash',  // 使用穩定的免費模型
      useSearch: true  // 啟用 Google Search
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * 解析 AI 回傳的 JSON
 */
function parseMarketAnalysisResponse(text: string): Partial<MarketAnalysis> {
  // 嘗試從 markdown 代碼塊中提取 JSON
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = text?.match(jsonRegex);

  let parsedJson: any;

  if (match && match[1]) {
    parsedJson = JSON.parse(match[1]);
  } else {
    // 嘗試直接解析
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace > -1 && lastBrace > -1) {
      parsedJson = JSON.parse(text.substring(firstBrace, lastBrace + 1));
    } else {
      throw new Error('無法解析市場分析數據');
    }
  }

  return parsedJson;
}

/**
 * 從快取獲取市場分析（如果未過期）
 */
function getCachedAnalysis(): MarketAnalysis | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp }: CachedData = JSON.parse(cached);
    const now = Date.now();

    // 檢查是否過期（30 分鐘）
    if (now - timestamp < CACHE_DURATION_MS) {
      console.log('📦 使用快取的市場分析資料');
      return data;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 儲存市場分析到快取
 */
function setCachedAnalysis(data: MarketAnalysis): void {
  try {
    const cacheData: CachedData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('無法儲存市場分析快取:', e);
  }
}

/**
 * 獲取市場分析資料（優先使用快取，減少 API 配額消耗）
 * @param forceRefresh 是否強制重新獲取（忽略快取）
 * @returns 市場分析資料
 */
export async function getMarketAnalysis(forceRefresh = false): Promise<MarketAnalysis> {
  // 優先檢查快取（除非強制刷新）
  if (!forceRefresh) {
    const cached = getCachedAnalysis();
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await callMarketAnalysisAPI();
    const parsed = parseMarketAnalysisResponse(response.text || '');

    // 建立完整的 MarketAnalysis 物件
    const analysis: MarketAnalysis = {
      usMarket: {
        summary: parsed.usMarket?.summary || '美股資料載入中...',
        dowJones: {
          change: parsed.usMarket?.dowJones?.change || 0,
          trend: parsed.usMarket?.dowJones?.trend || 'flat',
        },
        nasdaq: {
          change: parsed.usMarket?.nasdaq?.change || 0,
          trend: parsed.usMarket?.nasdaq?.trend || 'flat',
        },
        sp500: {
          change: parsed.usMarket?.sp500?.change || 0,
          trend: parsed.usMarket?.sp500?.trend || 'flat',
        },
        keyFactors: parsed.usMarket?.keyFactors || [],
      },
      fedPolicy: {
        summary: parsed.fedPolicy?.summary || '聯準會政策資料載入中...',
        rateOutlook: parsed.fedPolicy?.rateOutlook || 'neutral',
        nextMeeting: parsed.fedPolicy?.nextMeeting || '',
        marketImpact: parsed.fedPolicy?.marketImpact || '',
      },
      twMarketOutlook: {
        summary: parsed.twMarketOutlook?.summary || '台股展望資料載入中...',
        openingExpectation: parsed.twMarketOutlook?.openingExpectation || 'flat',
        hotSectors: parsed.twMarketOutlook?.hotSectors || [],
        keyPoints: parsed.twMarketOutlook?.keyPoints || [],
      },
      analysisTime: new Date().toLocaleString('zh-TW', { hour12: false }),
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(
        (c: any) => c.web?.title || c.web?.uri
      ) || [],
    };

    // 儲存到快取
    setCachedAnalysis(analysis);

    return analysis;
  } catch (error) {
    console.error('獲取市場分析失敗:', error);

    // 如果 API 失敗但有快取，返回快取資料（即使已過期）
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data }: CachedData = JSON.parse(cached);
        console.log('📦 API 失敗，使用過期的快取資料');
        return data;
      }
    } catch {}

    throw new Error('無法獲取市場分析資料，請稍後再試');
  }
}

