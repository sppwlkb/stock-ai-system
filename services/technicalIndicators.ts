/**
 * 技術指標計算模組
 * 使用 technicalindicators 函式庫計算各種技術指標
 */

import { RSI, MACD, BollingerBands, Stochastic, SMA, EMA, ATR } from 'technicalindicators';
import type { HistoricalDataPoint } from '../types';

/**
 * RSI 指標結果
 */
export interface RSIResult {
  rsi7: number | null;   // 7日 RSI
  rsi14: number | null;  // 14日 RSI
  signal: 'oversold' | 'overbought' | 'neutral';  // 超賣/超買/中性
  recommendation: string;
}

/**
 * MACD 指標結果
 */
export interface MACDResult {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
  trend: 'bullish' | 'bearish' | 'neutral';
  recommendation: string;
}

/**
 * KDJ 指標結果
 */
export interface KDJResult {
  k: number | null;
  d: number | null;
  j: number | null;
  signal: 'oversold' | 'overbought' | 'neutral';
  recommendation: string;
}

/**
 * 布林帶指標結果
 */
export interface BollingerBandsResult {
  upper: number | null;
  middle: number | null;
  lower: number | null;
  position: 'above_upper' | 'below_lower' | 'in_range';
  recommendation: string;
}

/**
 * 綜合技術指標分析結果
 */
export interface TechnicalAnalysis {
  rsi: RSIResult;
  macd: MACDResult;
  kdj: KDJResult;
  bollingerBands: BollingerBandsResult;
  sma5: number | null;
  sma20: number | null;
  ema12: number | null;
  ema26: number | null;
  atr: number | null;
  overallSignal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  confidence: number; // 0-100
}

/**
 * 計算 RSI 指標
 */
export const calculateRSI = (historicalData: HistoricalDataPoint[]): RSIResult => {
  if (historicalData.length < 14) {
    return {
      rsi7: null,
      rsi14: null,
      signal: 'neutral',
      recommendation: '數據不足，無法計算 RSI'
    };
  }

  const closePrices = historicalData.map(d => d.close);

  // 計算 7日 RSI
  const rsi7Values = RSI.calculate({ values: closePrices, period: 7 });
  const rsi7 = rsi7Values.length > 0 ? rsi7Values[rsi7Values.length - 1] : null;

  // 計算 14日 RSI
  const rsi14Values = RSI.calculate({ values: closePrices, period: 14 });
  const rsi14 = rsi14Values.length > 0 ? rsi14Values[rsi14Values.length - 1] : null;

  // 判斷信號
  let signal: 'oversold' | 'overbought' | 'neutral' = 'neutral';
  let recommendation = '';

  if (rsi14 !== null) {
    if (rsi14 < 30) {
      signal = 'oversold';
      recommendation = '📈 RSI 超賣（<30），可能反彈，考慮買入';
    } else if (rsi14 > 70) {
      signal = 'overbought';
      recommendation = '📉 RSI 超買（>70），可能回調，考慮賣出';
    } else if (rsi14 >= 40 && rsi14 <= 60) {
      recommendation = '➡️ RSI 中性區間，觀望為主';
    } else if (rsi14 >= 30 && rsi14 < 40) {
      recommendation = '⚠️ RSI 偏低，注意反彈機會';
    } else {
      recommendation = '⚠️ RSI 偏高，注意回調風險';
    }
  }

  return {
    rsi7: rsi7 !== null ? parseFloat(rsi7.toFixed(2)) : null,
    rsi14: rsi14 !== null ? parseFloat(rsi14.toFixed(2)) : null,
    signal,
    recommendation
  };
};

/**
 * 計算 MACD 指標
 */
export const calculateMACD = (historicalData: HistoricalDataPoint[]): MACDResult => {
  if (historicalData.length < 26) {
    return {
      macd: null,
      signal: null,
      histogram: null,
      trend: 'neutral',
      recommendation: '數據不足，無法計算 MACD'
    };
  }

  const closePrices = historicalData.map(d => d.close);

  const macdValues = MACD.calculate({
    values: closePrices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });

  if (macdValues.length === 0) {
    return {
      macd: null,
      signal: null,
      histogram: null,
      trend: 'neutral',
      recommendation: '無法計算 MACD'
    };
  }

  const latest = macdValues[macdValues.length - 1];
  const macd = latest.MACD || null;
  const signal = latest.signal || null;
  const histogram = latest.histogram || null;

  let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let recommendation = '';

  if (macd !== null && signal !== null && histogram !== null) {
    if (histogram > 0) {
      trend = 'bullish';
      recommendation = '📈 MACD 金叉（柱狀圖>0），多頭趨勢';
    } else if (histogram < 0) {
      trend = 'bearish';
      recommendation = '📉 MACD 死叉（柱狀圖<0），空頭趨勢';
    } else {
      recommendation = '➡️ MACD 中性，等待明確信號';
    }
  }

  return {
    macd: macd !== null ? parseFloat(macd.toFixed(4)) : null,
    signal: signal !== null ? parseFloat(signal.toFixed(4)) : null,
    histogram: histogram !== null ? parseFloat(histogram.toFixed(4)) : null,
    trend,
    recommendation
  };
};

/**
 * 計算 KDJ 指標（隨機指標）
 */
export const calculateKDJ = (historicalData: HistoricalDataPoint[]): KDJResult => {
  if (historicalData.length < 9) {
    return {
      k: null,
      d: null,
      j: null,
      signal: 'neutral',
      recommendation: '數據不足，無法計算 KDJ'
    };
  }

  const high = historicalData.map(d => d.high);
  const low = historicalData.map(d => d.low);
  const close = historicalData.map(d => d.close);

  const stochasticValues = Stochastic.calculate({
    high,
    low,
    close,
    period: 9,
    signalPeriod: 3
  });

  if (stochasticValues.length === 0) {
    return {
      k: null,
      d: null,
      j: null,
      signal: 'neutral',
      recommendation: '無法計算 KDJ'
    };
  }

  const latest = stochasticValues[stochasticValues.length - 1];
  const k = latest.k || null;
  const d = latest.d || null;
  // J = 3K - 2D
  const j = (k !== null && d !== null) ? (3 * k - 2 * d) : null;

  let signal: 'oversold' | 'overbought' | 'neutral' = 'neutral';
  let recommendation = '';

  if (k !== null && d !== null) {
    if (k < 20 && d < 20) {
      signal = 'oversold';
      recommendation = '📈 KDJ 超賣區（K<20, D<20），可能反彈';
    } else if (k > 80 && d > 80) {
      signal = 'overbought';
      recommendation = '📉 KDJ 超買區（K>80, D>80），可能回調';
    } else if (k > d) {
      recommendation = '📈 K線在D線上方，短期偏多';
    } else if (k < d) {
      recommendation = '📉 K線在D線下方，短期偏空';
    } else {
      recommendation = '➡️ KDJ 中性，觀望為主';
    }
  }

  return {
    k: k !== null ? parseFloat(k.toFixed(2)) : null,
    d: d !== null ? parseFloat(d.toFixed(2)) : null,
    j: j !== null ? parseFloat(j.toFixed(2)) : null,
    signal,
    recommendation
  };
};

/**
 * 計算布林帶指標
 */
export const calculateBollingerBands = (
  historicalData: HistoricalDataPoint[],
  currentPrice: number
): BollingerBandsResult => {
  if (historicalData.length < 20) {
    return {
      upper: null,
      middle: null,
      lower: null,
      position: 'in_range',
      recommendation: '數據不足，無法計算布林帶'
    };
  }

  const closePrices = historicalData.map(d => d.close);

  const bbValues = BollingerBands.calculate({
    period: 20,
    values: closePrices,
    stdDev: 2
  });

  if (bbValues.length === 0) {
    return {
      upper: null,
      middle: null,
      lower: null,
      position: 'in_range',
      recommendation: '無法計算布林帶'
    };
  }

  const latest = bbValues[bbValues.length - 1];
  const upper = latest.upper || null;
  const middle = latest.middle || null;
  const lower = latest.lower || null;

  let position: 'above_upper' | 'below_lower' | 'in_range' = 'in_range';
  let recommendation = '';

  if (upper !== null && lower !== null && middle !== null) {
    if (currentPrice > upper) {
      position = 'above_upper';
      recommendation = '📉 價格突破上軌，超買，可能回調';
    } else if (currentPrice < lower) {
      position = 'below_lower';
      recommendation = '📈 價格跌破下軌，超賣，可能反彈';
    } else if (currentPrice > middle) {
      recommendation = '📈 價格在中軌上方，偏強勢';
    } else if (currentPrice < middle) {
      recommendation = '📉 價格在中軌下方，偏弱勢';
    } else {
      recommendation = '➡️ 價格在中軌附近，中性';
    }
  }

  return {
    upper: upper !== null ? parseFloat(upper.toFixed(2)) : null,
    middle: middle !== null ? parseFloat(middle.toFixed(2)) : null,
    lower: lower !== null ? parseFloat(lower.toFixed(2)) : null,
    position,
    recommendation
  };
};

/**
 * 計算簡單移動平均線（SMA）
 */
export const calculateSMA = (historicalData: HistoricalDataPoint[], period: number): number | null => {
  if (historicalData.length < period) return null;

  const closePrices = historicalData.map(d => d.close);
  const smaValues = SMA.calculate({ period, values: closePrices });

  return smaValues.length > 0 ? parseFloat(smaValues[smaValues.length - 1].toFixed(2)) : null;
};

/**
 * 計算指數移動平均線（EMA）
 */
export const calculateEMA = (historicalData: HistoricalDataPoint[], period: number): number | null => {
  if (historicalData.length < period) return null;

  const closePrices = historicalData.map(d => d.close);
  const emaValues = EMA.calculate({ period, values: closePrices });

  return emaValues.length > 0 ? parseFloat(emaValues[emaValues.length - 1].toFixed(2)) : null;
};

/**
 * 計算 ATR（平均真實波幅）
 */
export const calculateATR = (historicalData: HistoricalDataPoint[], period: number = 14): number | null => {
  if (historicalData.length < period) return null;

  const high = historicalData.map(d => d.high);
  const low = historicalData.map(d => d.low);
  const close = historicalData.map(d => d.close);

  const atrValues = ATR.calculate({ high, low, close, period });

  return atrValues.length > 0 ? parseFloat(atrValues[atrValues.length - 1].toFixed(2)) : null;
};

/**
 * 綜合技術指標分析
 * 整合所有技術指標，給出綜合建議
 */
export const performTechnicalAnalysis = (
  historicalData: HistoricalDataPoint[],
  currentPrice: number
): TechnicalAnalysis => {
  // 計算各項指標
  const rsi = calculateRSI(historicalData);
  const macd = calculateMACD(historicalData);
  const kdj = calculateKDJ(historicalData);
  const bollingerBands = calculateBollingerBands(historicalData, currentPrice);
  const sma5 = calculateSMA(historicalData, 5);
  const sma20 = calculateSMA(historicalData, 20);
  const ema12 = calculateEMA(historicalData, 12);
  const ema26 = calculateEMA(historicalData, 26);
  const atr = calculateATR(historicalData, 14);

  // 綜合評分系統（-2 到 +2）
  let score = 0;
  let validIndicators = 0;

  // RSI 評分
  if (rsi.rsi14 !== null) {
    validIndicators++;
    if (rsi.signal === 'oversold') score += 2;
    else if (rsi.signal === 'overbought') score -= 2;
    else if (rsi.rsi14 < 40) score += 1;
    else if (rsi.rsi14 > 60) score -= 1;
  }

  // MACD 評分
  if (macd.histogram !== null) {
    validIndicators++;
    if (macd.trend === 'bullish') score += 2;
    else if (macd.trend === 'bearish') score -= 2;
  }

  // KDJ 評分
  if (kdj.k !== null && kdj.d !== null) {
    validIndicators++;
    if (kdj.signal === 'oversold') score += 2;
    else if (kdj.signal === 'overbought') score -= 2;
    else if (kdj.k > kdj.d) score += 1;
    else if (kdj.k < kdj.d) score -= 1;
  }

  // 布林帶評分
  if (bollingerBands.upper !== null && bollingerBands.lower !== null) {
    validIndicators++;
    if (bollingerBands.position === 'below_lower') score += 2;
    else if (bollingerBands.position === 'above_upper') score -= 2;
    else if (currentPrice > bollingerBands.middle!) score += 1;
    else if (currentPrice < bollingerBands.middle!) score -= 1;
  }

  // 均線評分
  if (sma5 !== null && sma20 !== null) {
    validIndicators++;
    if (currentPrice > sma5 && sma5 > sma20) score += 2; // 多頭排列
    else if (currentPrice < sma5 && sma5 < sma20) score -= 2; // 空頭排列
    else if (currentPrice > sma20) score += 1;
    else if (currentPrice < sma20) score -= 1;
  }

  // 計算平均分數
  const avgScore = validIndicators > 0 ? score / validIndicators : 0;

  // 判斷綜合信號
  let overallSignal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell' = 'neutral';
  let confidence = 0;

  if (avgScore >= 1.5) {
    overallSignal = 'strong_buy';
    confidence = Math.min(95, 70 + avgScore * 10);
  } else if (avgScore >= 0.5) {
    overallSignal = 'buy';
    confidence = Math.min(80, 60 + avgScore * 10);
  } else if (avgScore <= -1.5) {
    overallSignal = 'strong_sell';
    confidence = Math.min(95, 70 + Math.abs(avgScore) * 10);
  } else if (avgScore <= -0.5) {
    overallSignal = 'sell';
    confidence = Math.min(80, 60 + Math.abs(avgScore) * 10);
  } else {
    overallSignal = 'neutral';
    confidence = 50;
  }

  return {
    rsi,
    macd,
    kdj,
    bollingerBands,
    sma5,
    sma20,
    ema12,
    ema26,
    atr,
    overallSignal,
    confidence: parseFloat(confidence.toFixed(1))
  };
};

/**
 * 取得綜合信號的中文標籤
 */
export const getOverallSignalLabel = (signal: string): string => {
  const labels: Record<string, string> = {
    strong_buy: '強力買入',
    buy: '買入',
    neutral: '中性',
    sell: '賣出',
    strong_sell: '強力賣出'
  };
  return labels[signal] || '未知';
};

/**
 * 取得綜合信號的顏色
 */
export const getOverallSignalColor = (signal: string): string => {
  const colors: Record<string, string> = {
    strong_buy: 'text-green-500',
    buy: 'text-green-400',
    neutral: 'text-gray-400',
    sell: 'text-red-400',
    strong_sell: 'text-red-500'
  };
  return colors[signal] || 'text-gray-400';
};

