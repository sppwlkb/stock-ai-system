/**
 * 市場分析服務
 * 獲取美股表現、聯準會政策、台股展望等市場分析資料
 */

import type { MarketAnalysis } from '../types';

// 使用後端 API 呼叫 Gemini
const BACKEND_API_URL = '/api/gemini';

/**
 * 市場分析 Prompt
 */
const MARKET_ANALYSIS_PROMPT = `你是一位專業的全球金融市場分析師。請分析以下三個面向，並以 JSON 格式回傳：

1. **美股表現**：分析昨日美股三大指數（道瓊工業指數、那斯達克指數、S&P500 指數）的漲跌幅和主要影響因素。

2. **聯準會政策**：分析聯準會最新的貨幣政策動向、利率展望（鷹派/鴿派/中性），以及對市場的影響。

3. **台股展望**：根據美股表現和全球情勢，分析今日台股的開盤預期、熱門產業和投資機會。

請透過 Google Search 獲取最新資訊，並以下列 JSON 格式回傳（直接回傳 JSON，不要加任何說明文字）：

\`\`\`json
{
  "usMarket": {
    "summary": "簡短描述昨日美股整體表現（50字以內）",
    "dowJones": { "change": 0.8, "trend": "up" },
    "nasdaq": { "change": 1.5, "trend": "up" },
    "sp500": { "change": 1.2, "trend": "up" },
    "keyFactors": ["科技股帶動", "半導體類股強勢"]
  },
  "fedPolicy": {
    "summary": "聯準會政策摘要（80字以內）",
    "rateOutlook": "dovish",
    "nextMeeting": "2024-01-31",
    "marketImpact": "有利於高成長型股票（30字以內）"
  },
  "twMarketOutlook": {
    "summary": "台股展望摘要（80字以內）",
    "openingExpectation": "gap_up",
    "hotSectors": ["電子股", "半導體", "AI概念股"],
    "keyPoints": ["籌碼集中且技術面轉強的中小型股更容易受到資金追捧"]
  }
}
\`\`\`

重要規則：
1. 數據必須是最新的（今日或昨日）
2. 漲跌幅使用百分比數值（例如：1.5 表示 +1.5%，-0.8 表示 -0.8%）
3. trend 只能是 "up"、"down" 或 "flat"
4. rateOutlook 只能是 "hawkish"、"dovish" 或 "neutral"
5. openingExpectation 只能是 "gap_up"、"gap_down" 或 "flat"
6. 直接回傳 JSON，不要加任何說明文字
`;

/**
 * 呼叫後端 API 獲取市場分析
 */
async function callMarketAnalysisAPI(): Promise<any> {
  const response = await fetch(BACKEND_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: MARKET_ANALYSIS_PROMPT,
      model: 'gemini-2.5-flash',
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
 * 獲取市場分析資料
 * @returns 市場分析資料
 */
export async function getMarketAnalysis(): Promise<MarketAnalysis> {
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

    return analysis;
  } catch (error) {
    console.error('獲取市場分析失敗:', error);
    throw new Error('無法獲取市場分析資料，請稍後再試');
  }
}

