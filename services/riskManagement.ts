/**
 * 風險管理模組
 * 提供專業的風險評估、資金管理、止損計算等功能
 */

import type { HistoricalDataPoint } from '../types';

/**
 * 風險等級定義
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

/**
 * 風險評估結果
 */
export interface RiskAssessment {
  level: RiskLevel;
  riskRewardRatio: number;  // 風險報酬比
  volatility: number;        // 波動率（年化）
  maxDrawdown: number;       // 最大回撤百分比
  sharpeRatio: number;       // 夏普比率（簡化版）
  winProbability: number;    // 勝率估計
  recommendation: string;    // 風險建議
}

/**
 * 資金管理建議
 */
export interface PositionSizing {
  recommendedShares: number;     // 建議股數
  maxPositionSize: number;       // 最大倉位（元）
  riskAmount: number;            // 風險金額
  riskPercentage: number;        // 風險百分比
  stopLossDistance: number;      // 止損距離（元）
}

/**
 * 計算風險報酬比
 * @param entryPrice 進場價格
 * @param exitPrice 目標出場價格
 * @param stopLoss 止損價格
 * @returns 風險報酬比（>1 表示報酬大於風險）
 */
export const calculateRiskRewardRatio = (
  entryPrice: number,
  exitPrice: number,
  stopLoss: number
): number => {
  const potentialReward = exitPrice - entryPrice;
  const potentialRisk = entryPrice - stopLoss;
  
  if (potentialRisk <= 0) {
    return 0; // 無效的止損設定
  }
  
  return potentialReward / potentialRisk;
};

/**
 * 計算歷史波動率（年化）
 * @param historicalData 歷史K線數據
 * @returns 年化波動率（百分比）
 */
export const calculateVolatility = (historicalData: HistoricalDataPoint[]): number => {
  if (historicalData.length < 2) return 0;
  
  // 計算每日報酬率
  const returns: number[] = [];
  for (let i = 1; i < historicalData.length; i++) {
    const dailyReturn = (historicalData[i].close - historicalData[i - 1].close) / historicalData[i - 1].close;
    returns.push(dailyReturn);
  }
  
  // 計算標準差
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // 年化波動率（假設252個交易日）
  const annualizedVolatility = stdDev * Math.sqrt(252) * 100;
  
  return parseFloat(annualizedVolatility.toFixed(2));
};

/**
 * 計算最大回撤
 * @param historicalData 歷史K線數據
 * @returns 最大回撤百分比
 */
export const calculateMaxDrawdown = (historicalData: HistoricalDataPoint[]): number => {
  if (historicalData.length === 0) return 0;
  
  let maxPrice = historicalData[0].close;
  let maxDrawdown = 0;
  
  for (const data of historicalData) {
    if (data.close > maxPrice) {
      maxPrice = data.close;
    }
    const drawdown = ((maxPrice - data.close) / maxPrice) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return parseFloat(maxDrawdown.toFixed(2));
};

/**
 * 計算簡化版夏普比率
 * @param historicalData 歷史K線數據
 * @param riskFreeRate 無風險利率（年化，預設1.5%）
 * @returns 夏普比率
 */
export const calculateSharpeRatio = (
  historicalData: HistoricalDataPoint[],
  riskFreeRate: number = 1.5
): number => {
  if (historicalData.length < 2) return 0;
  
  // 計算年化報酬率
  const firstPrice = historicalData[0].close;
  const lastPrice = historicalData[historicalData.length - 1].close;
  const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;
  const annualizedReturn = (totalReturn / historicalData.length) * 252;
  
  // 計算波動率
  const volatility = calculateVolatility(historicalData);
  
  if (volatility === 0) return 0;
  
  // 夏普比率 = (年化報酬率 - 無風險利率) / 波動率
  const sharpeRatio = (annualizedReturn - riskFreeRate) / volatility;
  
  return parseFloat(sharpeRatio.toFixed(2));
};

/**
 * 綜合風險評估
 * @param entryPrice 進場價格
 * @param exitPrice 目標出場價格
 * @param stopLoss 止損價格
 * @param historicalData 歷史K線數據
 * @returns 完整風險評估報告
 */
export const assessRisk = (
  entryPrice: number,
  exitPrice: number,
  stopLoss: number,
  historicalData: HistoricalDataPoint[]
): RiskAssessment => {
  const rrRatio = calculateRiskRewardRatio(entryPrice, exitPrice, stopLoss);
  const volatility = calculateVolatility(historicalData);
  const maxDrawdown = calculateMaxDrawdown(historicalData);
  const sharpeRatio = calculateSharpeRatio(historicalData);
  
  // 風險等級判定邏輯
  let level: RiskLevel = 'medium';
  let recommendation = '';
  
  if (rrRatio < 1) {
    level = 'extreme';
    recommendation = '⛔ 極高風險：風險報酬比不佳（<1:1），不建議進場';
  } else if (rrRatio >= 3 && volatility < 30 && maxDrawdown < 15) {
    level = 'low';
    recommendation = '✅ 低風險：風險報酬比優秀，波動率適中，適合進場';
  } else if (rrRatio >= 2 && volatility < 50) {
    level = 'medium';
    recommendation = '⚠️ 中等風險：風險報酬比尚可，需注意波動風險';
  } else {
    level = 'high';
    recommendation = '🔴 高風險：波動率高或風險報酬比不理想，謹慎評估';
  }
  
  // 勝率估計（簡化模型）
  const winProbability = Math.min(95, Math.max(30, 50 + (rrRatio - 1.5) * 10 + (sharpeRatio * 5)));
  
  return {
    level,
    riskRewardRatio: parseFloat(rrRatio.toFixed(2)),
    volatility,
    maxDrawdown,
    sharpeRatio,
    winProbability: parseFloat(winProbability.toFixed(1)),
    recommendation,
  };
};

/**
 * 計算建議倉位大小（凱利公式簡化版）
 * @param accountBalance 帳戶總資金
 * @param riskPercentage 單筆交易風險百分比（建議1-2%）
 * @param entryPrice 進場價格
 * @param stopLoss 止損價格
 * @returns 資金管理建議
 */
export const calculatePositionSize = (
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLoss: number
): PositionSizing => {
  // 單筆交易最大風險金額
  const riskAmount = accountBalance * (riskPercentage / 100);

  // 每股風險
  const stopLossDistance = entryPrice - stopLoss;

  if (stopLossDistance <= 0) {
    return {
      recommendedShares: 0,
      maxPositionSize: 0,
      riskAmount: 0,
      riskPercentage: 0,
      stopLossDistance: 0,
    };
  }

  // 建議股數 = 風險金額 / 每股風險
  const recommendedShares = Math.floor(riskAmount / stopLossDistance);

  // 最大倉位金額
  const maxPositionSize = recommendedShares * entryPrice;

  return {
    recommendedShares,
    maxPositionSize: parseFloat(maxPositionSize.toFixed(2)),
    riskAmount: parseFloat(riskAmount.toFixed(2)),
    riskPercentage,
    stopLossDistance: parseFloat(stopLossDistance.toFixed(2)),
  };
};

/**
 * 動態止損計算（基於 ATR - Average True Range）
 * @param historicalData 歷史K線數據
 * @param currentPrice 當前價格
 * @param atrMultiplier ATR 倍數（預設2倍）
 * @returns 建議止損價格
 */
export const calculateDynamicStopLoss = (
  historicalData: HistoricalDataPoint[],
  currentPrice: number,
  atrMultiplier: number = 2
): number => {
  if (historicalData.length < 14) {
    // 數據不足，使用固定百分比（2%）
    return parseFloat((currentPrice * 0.98).toFixed(2));
  }

  // 計算 ATR（簡化版，使用最近14天）
  const recentData = historicalData.slice(-14);
  let atrSum = 0;

  for (let i = 1; i < recentData.length; i++) {
    const high = recentData[i].high;
    const low = recentData[i].low;
    const prevClose = recentData[i - 1].close;

    const trueRange = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    atrSum += trueRange;
  }

  const atr = atrSum / (recentData.length - 1);

  // 動態止損 = 當前價格 - (ATR × 倍數)
  const stopLoss = currentPrice - (atr * atrMultiplier);

  return parseFloat(stopLoss.toFixed(2));
};

/**
 * 風險等級顏色映射（用於 UI 顯示）
 */
export const getRiskLevelColor = (level: RiskLevel): string => {
  const colorMap: Record<RiskLevel, string> = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    extreme: 'text-red-500',
  };
  return colorMap[level];
};

/**
 * 風險等級中文標籤
 */
export const getRiskLevelLabel = (level: RiskLevel): string => {
  const labelMap: Record<RiskLevel, string> = {
    low: '低風險',
    medium: '中等風險',
    high: '高風險',
    extreme: '極高風險',
  };
  return labelMap[level];
};

