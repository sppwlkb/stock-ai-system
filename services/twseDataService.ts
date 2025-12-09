/**
 * 台灣證券交易所真實股價資料服務
 * 使用官方 API 獲取即時股價與歷史數據
 */

import type { HistoricalDataPoint } from '../types';

// TWSE 即時股價 API 回應格式
interface TWSeRealtimeResponse {
  msgArray: Array<{
    c: string;  // 股票代號
    n: string;  // 股票名稱
    z: string;  // 最新成交價
    tv: string; // 成交量
    v: string;  // 累積成交量
    o: string;  // 開盤價
    h: string;  // 最高價
    l: string;  // 最低價
    y: string;  // 昨收價
    tlong: string; // 時間戳記
  }>;
  rtcode: string;
  rtmessage: string;
}

// TWSE OpenAPI 歷史資料回應格式
interface TWSeHistoricalResponse {
  data: Array<string[]>; // [日期, 成交股數, 成交金額, 開盤價, 最高價, 最低價, 收盤價, 漲跌價差, 成交筆數]
  fields: string[];
  stat: string;
}

/**
 * 獲取即時股價（使用後端 API 代理避免 CORS 問題）
 * @param ticker 股票代號（例如：2330）
 * @param exchange 交易所（TWSE 或 TPEX）
 * @returns 即時股價，若失敗返回 null
 */
export const fetchRealtimePrice = async (
  ticker: string,
  exchange: 'TWSE' | 'TPEX' = 'TWSE'
): Promise<number | null> => {
  try {
    const exchangeCode = exchange === 'TWSE' ? 'tse' : 'otc';

    // 使用後端 API 代理來獲取股價（避免 CORS 問題）
    const url = `/api/stock-price?ticker=${ticker}&exchange=${exchangeCode}`;

    console.log(`正在獲取 ${ticker} 即時股價...`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`股價 API 回應錯誤: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.price) {
      console.warn(`無法取得 ${ticker} 的即時股價:`, data.error);
      return null;
    }

    console.log(`✅ ${ticker} 即時股價: ${data.price} (${data.name})`);
    return data.price;
  } catch (error) {
    console.error(`獲取 ${ticker} 即時股價失敗:`, error);
    return null;
  }
};

/**
 * 批次獲取多支股票的即時股價
 * @param tickers 股票代號陣列
 * @param exchange 交易所
 * @returns Map<股票代號, 股價>
 */
export const fetchBatchRealtimePrices = async (
  tickers: Array<{ ticker: string; exchange: 'TWSE' | 'TPEX' }>
): Promise<Map<string, number>> => {
  const priceMap = new Map<string, number>();
  
  // 分批處理，避免一次請求太多
  const batchSize = 5;
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);
    const promises = batch.map(({ ticker, exchange }) =>
      fetchRealtimePrice(ticker, exchange).then(price => ({ ticker, price }))
    );
    
    const results = await Promise.all(promises);
    results.forEach(({ ticker, price }) => {
      if (price !== null) {
        priceMap.set(ticker, price);
      }
    });
    
    // 避免請求過於頻繁
    if (i + batchSize < tickers.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return priceMap;
};

/**
 * 獲取歷史股價數據（使用後端 API 代理避免 CORS 問題）
 * @param ticker 股票代號
 * @param days 天數（預設90天）
 * @returns 歷史K線數據陣列
 */
export const fetchHistoricalData = async (
  ticker: string,
  days: number = 90
): Promise<HistoricalDataPoint[]> => {
  try {
    // 計算日期
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const dateStr = `${year}${month}01`;

    // 使用後端 API 代理（避免 CORS 問題）
    const url = `/api/stock-history?ticker=${ticker}&date=${dateStr}`;

    console.log(`正在獲取 ${ticker} 歷史數據...`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`歷史數據 API 回應錯誤: ${response.status}`);
      return [];
    }

    const result = await response.json();

    if (!result.success || !result.data || result.data.length === 0) {
      console.warn(`無法取得 ${ticker} 的歷史數據:`, result.error);
      return [];
    }

    console.log(`✅ ${ticker} 歷史數據: ${result.count} 筆 (來源: ${result.source})`);

    // 轉換為標準格式
    const historicalData: HistoricalDataPoint[] = result.data.map((item: any) => ({
      date: item.date || '',
      open: item.open || 0,
      high: item.high || 0,
      low: item.low || 0,
      close: item.close || 0,
      volume: item.volume || 0,
    })).filter((item: HistoricalDataPoint) => item.close > 0);

    return historicalData.slice(-days); // 只取最近N天
  } catch (error) {
    console.error(`獲取 ${ticker} 歷史數據失敗:`, error);
    return [];
  }
};

