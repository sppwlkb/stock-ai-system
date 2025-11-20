/**
 * 真實股價資料服務（整合 TWSE API）
 * 替換原有的模擬股價系統，使用台灣證交所真實數據
 */

import type { StockRecommendation } from '../types';
import { fetchRealtimePrice, fetchBatchRealtimePrices } from './twseDataService';

// 快取最近一次獲取的股價，避免過度請求 API
interface PriceCache {
  price: number;
  timestamp: number;
}
const priceCache: Map<string, PriceCache> = new Map();
const CACHE_DURATION = 3000; // 3秒快取

/**
 * 獲取初始即時股價（使用真實 TWSE API）
 * @param recommendations AI 推薦的股票清單
 * @returns Map<股票代號, 即時股價>
 */
export const fetchInitialLivePrices = async (
  recommendations: Omit<StockRecommendation, 'historicalData' | 'news'>[]
): Promise<Map<string, number>> => {
  const initialPrices = new Map<string, number>();

  // 準備批次請求
  const tickersToFetch = recommendations.map(rec => ({
    ticker: rec.ticker,
    exchange: rec.exchange,
  }));

  try {
    // 使用批次 API 獲取真實股價
    const realPrices = await fetchBatchRealtimePrices(tickersToFetch);

    for (const rec of recommendations) {
      let price = realPrices.get(rec.ticker);

      // 如果 API 失敗，使用 AI 提供的 currentPrice 作為備援
      if (!price || price <= 0) {
        price = (rec.currentPrice && rec.currentPrice > 0)
          ? rec.currentPrice
          : rec.entryPoint;
        console.warn(`使用備援價格 ${rec.ticker}: ${price}`);
      }

      // 更新快取
      priceCache.set(rec.ticker, {
        price,
        timestamp: Date.now(),
      });

      initialPrices.set(rec.ticker, price);
    }
  } catch (error) {
    console.error('批次獲取股價失敗，使用備援價格:', error);

    // 完全失敗時使用 AI 提供的價格
    for (const rec of recommendations) {
      const fallbackPrice = (rec.currentPrice && rec.currentPrice > 0)
        ? rec.currentPrice
        : rec.entryPoint;
      initialPrices.set(rec.ticker, fallbackPrice);
    }
  }

  return initialPrices;
};

/**
 * 更新即時股價（使用真實 TWSE API）
 * @param tickers 股票代號陣列
 * @returns Map<股票代號, 更新後股價>
 */
export const updateLivePrices = async (
  tickers: string[]
): Promise<Map<string, number>> => {
  const updatedPrices = new Map<string, number>();
  const now = Date.now();

  for (const ticker of tickers) {
    // 檢查快取
    const cached = priceCache.get(ticker);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      updatedPrices.set(ticker, cached.price);
      continue;
    }

    // 快取過期，重新獲取
    try {
      const price = await fetchRealtimePrice(ticker, 'TWSE');

      if (price && price > 0) {
        priceCache.set(ticker, { price, timestamp: now });
        updatedPrices.set(ticker, price);
      } else if (cached) {
        // API 失敗但有舊快取，繼續使用
        updatedPrices.set(ticker, cached.price);
      }
    } catch (error) {
      console.error(`更新 ${ticker} 股價失敗:`, error);
      // 使用快取價格
      if (cached) {
        updatedPrices.set(ticker, cached.price);
      }
    }
  }

  return updatedPrices;
};
