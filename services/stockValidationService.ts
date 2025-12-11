/**
 * 股票代號驗證服務
 * 用於驗證 AI 回傳的股票代號和名稱是否正確
 * 使用證交所 API 獲取正確的股票名稱
 */

interface StockInfo {
  ticker: string;
  name: string;
  market: string; // TWSE 或 OTC
}

// 股票資訊快取（避免重複查詢）
const stockInfoCache = new Map<string, StockInfo | null>();
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 小時快取
let cacheTimestamp = 0;

/**
 * 從證交所 API 獲取單一股票資訊
 * @param ticker 股票代號
 * @returns 股票資訊或 null
 */
export async function getStockInfo(ticker: string): Promise<StockInfo | null> {
  // 檢查快取
  if (stockInfoCache.has(ticker) && Date.now() - cacheTimestamp < CACHE_DURATION_MS) {
    return stockInfoCache.get(ticker) || null;
  }

  try {
    // 使用 Yahoo Finance API 來驗證股票資訊（較可靠）
    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${ticker}.TW&quotesCount=1&newsCount=0`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!response.ok) {
      console.warn(`無法查詢股票 ${ticker} 資訊`);
      return null;
    }

    const data = await response.json();
    const quote = data.quotes?.[0];

    if (quote && quote.symbol?.includes(ticker)) {
      const stockInfo: StockInfo = {
        ticker: ticker,
        name: quote.shortname || quote.longname || '',
        market: quote.symbol?.endsWith('.TWO') ? 'OTC' : 'TWSE'
      };
      stockInfoCache.set(ticker, stockInfo);
      cacheTimestamp = Date.now();
      return stockInfo;
    }

    return null;
  } catch (error) {
    console.error(`查詢股票 ${ticker} 資訊失敗:`, error);
    return null;
  }
}

/**
 * 驗證並修正 AI 回傳的股票資訊
 * @param aiTicker AI 回傳的股票代號
 * @param aiName AI 回傳的股票名稱
 * @returns 修正後的股票資訊
 */
export async function validateAndCorrectStock(
  aiTicker: string,
  aiName: string
): Promise<{ ticker: string; name: string; corrected: boolean }> {
  // 常見錯誤對照表（AI 經常搞錯的股票）
  // 這裡列出正確的股票代號對應名稱
  const KNOWN_CORRECTIONS: Record<string, string> = {
    // AI 常搞錯的股票
    '2405': '輔信',
    '2408': '南亞科',
    '3474': '華亞科',
    // 常見電子股
    '2330': '台積電',
    '2303': '聯電',
    '2454': '聯發科',
    '2317': '鴻海',
    '2382': '廣達',
    '2308': '台達電',
    '2412': '中華電',
    '3008': '大立光',
    '2881': '富邦金',
    '2882': '國泰金',
    '2891': '中信金',
    '2886': '兆豐金',
    '2884': '玉山金',
    '2892': '第一金',
    '2357': '華碩',
    '2327': '國巨',
    '3711': '日月光投控',
    '2379': '瑞昱',
    '2301': '光寶科',
    '6505': '台塑化',
    '1301': '台塑',
    '1303': '南亞',
    '1326': '台化',
    '2002': '中鋼',
    '2912': '統一超',
    '9910': '豐泰',
    '1216': '統一',
    '2207': '和泰車',
  };

  // 先檢查常見錯誤
  if (KNOWN_CORRECTIONS[aiTicker] && KNOWN_CORRECTIONS[aiTicker] !== aiName) {
    console.log(`🔧 修正股票名稱: ${aiTicker} "${aiName}" → "${KNOWN_CORRECTIONS[aiTicker]}"`);
    return {
      ticker: aiTicker,
      name: KNOWN_CORRECTIONS[aiTicker],
      corrected: true
    };
  }

  // 嘗試從 API 獲取正確名稱
  try {
    const stockInfo = await getStockInfo(aiTicker);
    if (stockInfo && stockInfo.name && stockInfo.name !== aiName) {
      // 取得簡短名稱（去除股份有限公司等後綴）
      let correctName = stockInfo.name
        .replace(/股份有限公司/g, '')
        .replace(/有限公司/g, '')
        .replace(/公司/g, '')
        .trim();
      
      // 如果取得的名稱合理，使用它
      if (correctName.length > 0 && correctName.length <= 10) {
        console.log(`🔧 API 修正股票名稱: ${aiTicker} "${aiName}" → "${correctName}"`);
        return {
          ticker: aiTicker,
          name: correctName,
          corrected: true
        };
      }
    }
  } catch (error) {
    console.warn(`無法驗證股票 ${aiTicker}:`, error);
  }

  // 無法修正，返回原始值
  return {
    ticker: aiTicker,
    name: aiName,
    corrected: false
  };
}

/**
 * 批次驗證股票清單
 * @param stocks 股票清單
 * @returns 驗證後的股票清單
 */
export async function validateStockList(
  stocks: Array<{ ticker: string; stockName: string; [key: string]: any }>
): Promise<Array<{ ticker: string; stockName: string; [key: string]: any }>> {
  const results = await Promise.all(
    stocks.map(async (stock) => {
      const validated = await validateAndCorrectStock(stock.ticker, stock.stockName);
      return {
        ...stock,
        stockName: validated.name,
        _nameWasCorrected: validated.corrected
      };
    })
  );

  // 記錄修正統計
  const correctedCount = results.filter(r => r._nameWasCorrected).length;
  if (correctedCount > 0) {
    console.log(`📊 股票名稱驗證完成：${correctedCount}/${results.length} 支被修正`);
  }

  return results;
}

