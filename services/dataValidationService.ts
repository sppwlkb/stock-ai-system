/**
 * 數據驗證服務
 * 用於驗證 AI 生成的市場數據、公司財務數據是否真實
 */

export interface MarketIndexData {
  name: string;
  symbol: string;
  currentIndex: number;
  previousClose: number;
  change: number;
  changePercent: number;
  timestamp: string;
  source: string;
}

export interface CompanyRevenueData {
  ticker: string;
  name: string;
  year: number;
  month: number;
  revenue: number;
  revenueDisplay: string;
  monthChange?: number;
  yearChange?: number;
  cumulativeRevenue?: number;
  cumulativeYearChange?: number;
  source: string;
}

export interface ValidationResult {
  field: string;
  aiValue: string | number;
  realValue: string | number | null;
  isValid: boolean;
  deviation?: number; // 誤差百分比
  correctedValue?: string | number;
  source?: string;
}

/**
 * 獲取真實的加權指數數據
 */
export async function getRealMarketIndex(): Promise<MarketIndexData | null> {
  try {
    const response = await fetch('/api/market-index');
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('📊 真實加權指數:', data.data.currentIndex);
      return data.data;
    }
    return null;
  } catch (error) {
    console.warn('⚠️ 無法獲取加權指數:', error);
    return null;
  }
}

/**
 * 獲取公司真實營收數據
 */
export async function getRealCompanyRevenue(
  ticker: string, 
  year?: number, 
  month?: number
): Promise<CompanyRevenueData | null> {
  try {
    const params = new URLSearchParams({ ticker });
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    
    const response = await fetch(`/api/company-revenue?${params}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log(`📊 ${ticker} 真實營收:`, data.data.revenueDisplay);
      return data.data;
    }
    return null;
  } catch (error) {
    console.warn(`⚠️ 無法獲取 ${ticker} 營收:`, error);
    return null;
  }
}

/**
 * 驗證 AI 生成的 reason 中的數據
 * @param reason AI 生成的分析理由
 * @param ticker 股票代碼
 * @returns 驗證結果和修正後的 reason
 */
export async function validateAndCorrectReason(
  reason: string,
  ticker: string
): Promise<{ correctedReason: string; validationResults: ValidationResult[] }> {
  const validationResults: ValidationResult[] = [];
  let correctedReason = reason;

  // 1. 驗證加權指數
  const marketIndex = await getRealMarketIndex();
  if (marketIndex && marketIndex.currentIndex > 0) {
    // 使用正則表達式找出 reason 中的加權指數數據
    const indexPattern = /加權指數[^0-9]*([0-9,]+(?:\.[0-9]+)?)\s*點/g;
    const matches = reason.matchAll(indexPattern);
    
    for (const match of matches) {
      const aiIndex = parseFloat(match[1].replace(/,/g, ''));
      const deviation = Math.abs(aiIndex - marketIndex.currentIndex) / marketIndex.currentIndex * 100;
      
      if (deviation > 5) { // 誤差超過 5%
        validationResults.push({
          field: '加權指數',
          aiValue: aiIndex,
          realValue: marketIndex.currentIndex,
          isValid: false,
          deviation: deviation,
          correctedValue: marketIndex.currentIndex,
          source: marketIndex.source
        });
        
        // 修正 reason 中的錯誤數據
        correctedReason = correctedReason.replace(
          match[0],
          `加權指數 ${marketIndex.currentIndex.toLocaleString()} 點`
        );
        
        console.warn(
          `❌ 加權指數錯誤: AI=${aiIndex} vs 真實=${marketIndex.currentIndex} (誤差 ${deviation.toFixed(1)}%)`
        );
      }
    }
  }

  // 2. 驗證公司營收
  const revenueData = await getRealCompanyRevenue(ticker);
  if (revenueData) {
    // 找出 reason 中的營收數據（例如：11月營收12.5億元）
    const revenuePattern = /(\d+)月營收[約]?([0-9.]+)\s*億/g;
    const matches = reason.matchAll(revenuePattern);
    
    for (const match of matches) {
      const aiMonth = parseInt(match[1]);
      const aiRevenue = parseFloat(match[2]);
      
      if (aiMonth === revenueData.month) {
        const realRevenueInBillion = revenueData.revenue / 100000000;
        const deviation = Math.abs(aiRevenue - realRevenueInBillion) / realRevenueInBillion * 100;
        
        if (deviation > 10) { // 誤差超過 10%
          validationResults.push({
            field: `${aiMonth}月營收`,
            aiValue: `${aiRevenue}億`,
            realValue: `${realRevenueInBillion.toFixed(2)}億`,
            isValid: false,
            deviation: deviation,
            correctedValue: `${realRevenueInBillion.toFixed(2)}億`,
            source: revenueData.source
          });
        }
      }
    }
  }

  // 3. 驗證新聞來源（檢測可能的假新聞）
  const newsValidation = validateNewsReferences(reason);
  if (newsValidation.suspiciousNews.length > 0) {
    console.warn('⚠️ 發現可疑新聞引用:', newsValidation.suspiciousNews);

    // 標記可疑新聞
    for (const news of newsValidation.suspiciousNews) {
      validationResults.push({
        field: '新聞來源',
        aiValue: news,
        realValue: null,
        isValid: false,
        source: '系統驗證'
      });

      // 在 reason 中標記可疑新聞
      correctedReason = correctedReason.replace(
        news,
        `⚠️[待驗證] ${news}`
      );
    }
  }

  return { correctedReason, validationResults };
}

/**
 * 驗證 reason 中引用的新聞來源
 * 檢測可能的 AI 捏造新聞
 */
function validateNewsReferences(reason: string): {
  suspiciousNews: string[];
  validNews: string[];
} {
  const suspiciousNews: string[] = [];
  const validNews: string[] = [];

  // 匹配「據XX報導」、「XX 12/XX 報導」等模式
  const newsPatterns = [
    /據([^，。]+)(1[0-2]|0?[1-9])\/([1-3]?[0-9])\s*報導[，。：]/g,
    /([經濟日報|工商時報|自由時報|聯合報|中時電子報|鉅亨網|MoneyDJ]+)\s*(1[0-2]|0?[1-9])\/(0?[1-9]|[1-2][0-9]|3[0-1])\s*報導/g,
    /根據([^，。]+)報導/g,
  ];

  for (const pattern of newsPatterns) {
    const matches = reason.matchAll(pattern);
    for (const match of matches) {
      const newsRef = match[0];

      // 檢查是否為可疑的新聞引用
      // 1. 檢查日期是否合理（不能是未來日期）
      // 2. 檢查是否包含具體且可疑的數字（如「10 億元訂單」）

      // 可疑特徵：
      // - 包含非常具體的金額（如「10億元訂單」）
      // - 日期剛好是近幾天
      // - 無法在網路上找到對應報導

      const suspiciousKeywords = [
        '億元訂單',
        '大訂單',
        '重大合約',
        '獨家供應',
        '獨家代理'
      ];

      const hasSuspiciousKeyword = suspiciousKeywords.some(kw =>
        reason.includes(kw) && reason.indexOf(kw) - reason.indexOf(newsRef) < 100
      );

      if (hasSuspiciousKeyword) {
        // 提取完整的新聞引用句子
        const startIdx = Math.max(0, reason.indexOf(newsRef) - 10);
        const endIdx = Math.min(reason.length, reason.indexOf(newsRef) + newsRef.length + 50);
        const context = reason.substring(startIdx, endIdx);

        // 檢查是否包含可疑的訂單金額
        if (/[0-9]+\s*億[元]?[^%]*(訂單|合約|採購)/.test(context)) {
          suspiciousNews.push(newsRef);
        }
      }
    }
  }

  return { suspiciousNews, validNews };
}

