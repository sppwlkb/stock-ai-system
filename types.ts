
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
