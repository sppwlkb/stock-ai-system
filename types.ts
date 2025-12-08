
export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsArticle {
  title: string;
  link: string;
  source: string;
}

export interface StockRecommendation {
  stockName: string;
  ticker: string;
  exchange: 'TWSE' | 'TPEX'; // Added exchange field
  entryPoint: number;
  exitPoint: number;
  profitPoints: number;
  sharesToBuy: number;
  profitTWD: number;
  reason: string;
  stopLoss: number;
  currentPrice: number;
  historicalData: HistoricalDataPoint[];
  news?: NewsArticle[];
  // 新增：風險評估資訊
  riskAssessment?: {
    level: 'low' | 'medium' | 'high' | 'extreme';
    riskRewardRatio: number;
    volatility: number;
    maxDrawdown: number;
    recommendation: string;
  };
  // 新增：資料來源標記
  dataSource?: {
    priceSource: 'TWSE_API' | 'AI_SEARCH' | 'FALLBACK';
    historicalSource: 'TWSE_API' | 'UNAVAILABLE';
    lastUpdated: string;
  };
  // 新增：技術指標分析
  technicalAnalysis?: {
    rsi14: number | null;
    macd: { value: number | null; signal: number | null; histogram: number | null };
    kdj: { k: number | null; d: number | null; j: number | null };
    bollingerBands: { upper: number | null; middle: number | null; lower: number | null };
    overallSignal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
    confidence: number;
    recommendations: string[];
  };
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: GroundingSource;
}

export interface Trade {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  result: 'Win' | 'Loss' | 'Neutral';
}

export interface BacktestResult {
  totalProfitPoints: number;
  winRate: number;
  totalTrades: number;
  trades: Trade[];
}

/**
 * 用戶篩選條件設定
 */
export interface FilterSettings {
  // 股價範圍設定
  priceRange: {
    min: number;       // 最低股價（元）
    max: number;       // 最高股價（元）
  };
  // 推薦股票數量
  stockCount: number;  // 一次推薦幾支股票（3、5、10）
  // 目標獲利率
  targetProfitRate: number;  // 期望獲利百分比（5、10、15、20）
  // 風險等級偏好
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  // 投資本金（用於計算購買股數）
  capital: number;     // 投資本金（元）
}

/**
 * 風險等級中文對照
 */
export const RISK_LEVEL_LABELS: Record<FilterSettings['riskLevel'], string> = {
  conservative: '保守型',
  moderate: '穩健型',
  aggressive: '積極型',
};

/**
 * 預設篩選設定
 */
export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  priceRange: {
    min: 10,
    max: 50,
  },
  stockCount: 3,
  targetProfitRate: 10,
  riskLevel: 'moderate',
  capital: 10000,
};

/**
 * 市場分析資料結構
 * 包含美股表現、聯準會政策、台股展望三大因素
 */
export interface MarketAnalysis {
  // 美股表現
  usMarket: {
    summary: string;           // 整體摘要
    dowJones: {
      change: number;          // 漲跌幅 (%)
      trend: 'up' | 'down' | 'flat';
    };
    nasdaq: {
      change: number;
      trend: 'up' | 'down' | 'flat';
    };
    sp500: {
      change: number;
      trend: 'up' | 'down' | 'flat';
    };
    keyFactors: string[];      // 主要影響因素
  };

  // 聯準會政策
  fedPolicy: {
    summary: string;           // 政策摘要
    rateOutlook: 'hawkish' | 'dovish' | 'neutral';  // 利率展望
    nextMeeting: string;       // 下次會議日期
    marketImpact: string;      // 對市場影響
  };

  // 台股展望
  twMarketOutlook: {
    summary: string;           // 台股展望摘要
    openingExpectation: 'gap_up' | 'gap_down' | 'flat';  // 開盤預期
    hotSectors: string[];      // 熱門產業
    keyPoints: string[];       // 重點關注
  };

  // 分析時間
  analysisTime: string;

  // 資料來源
  sources: string[];
}
