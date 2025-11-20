/**
 * 系統參數配置文件
 * 集中管理所有可調整的參數，方便優化調整
 */

/**
 * 技術指標參數
 */
export const TECHNICAL_INDICATORS = {
  // RSI 參數
  RSI: {
    SHORT_PERIOD: 7,      // 短期 RSI 週期
    LONG_PERIOD: 14,      // 長期 RSI 週期
    OVERSOLD: 30,         // 超賣閾值
    OVERBOUGHT: 70,       // 超買閾值
  },
  
  // MACD 參數
  MACD: {
    FAST_PERIOD: 12,      // 快線週期
    SLOW_PERIOD: 26,      // 慢線週期
    SIGNAL_PERIOD: 9,     // 信號線週期
  },
  
  // KDJ 參數
  KDJ: {
    PERIOD: 9,            // K 值週期
    SIGNAL_PERIOD: 3,     // D 值週期
    OVERSOLD: 20,         // 超賣閾值
    OVERBOUGHT: 80,       // 超買閾值
  },
  
  // 布林帶參數
  BOLLINGER_BANDS: {
    PERIOD: 20,           // 移動平均週期
    STD_DEV: 2,           // 標準差倍數
  },
  
  // 移動平均線參數
  SMA: {
    SHORT: 5,             // 短期均線
    MEDIUM: 20,           // 中期均線
    LONG: 60,             // 長期均線
  },
  
  // ATR 參數
  ATR: {
    PERIOD: 14,           // ATR 週期
    MULTIPLIER: 2,        // 止損倍數
  },
};

/**
 * 風險管理參數
 */
export const RISK_MANAGEMENT = {
  // 風險等級判定
  RISK_LEVELS: {
    LOW: {
      MIN_RR_RATIO: 3,          // 最低風險報酬比
      MAX_VOLATILITY: 30,       // 最大波動率 (%)
      MAX_DRAWDOWN: 15,         // 最大回撤 (%)
    },
    MEDIUM: {
      MIN_RR_RATIO: 2,
      MAX_VOLATILITY: 50,
    },
    HIGH: {
      MIN_RR_RATIO: 1,
    },
  },
  
  // 資金管理
  POSITION_SIZING: {
    DEFAULT_RISK_PERCENTAGE: 2,   // 預設單筆風險百分比
    MAX_RISK_PERCENTAGE: 5,       // 最大單筆風險百分比
    MIN_RISK_PERCENTAGE: 0.5,     // 最小單筆風險百分比
  },
  
  // 止損設定
  STOP_LOSS: {
    DEFAULT_PERCENTAGE: 2,        // 預設止損百分比
    ATR_MULTIPLIER: 2,            // ATR 止損倍數
  },
  
  // 波動率計算
  VOLATILITY: {
    TRADING_DAYS_PER_YEAR: 252,   // 年交易日數
  },
  
  // 夏普比率
  SHARPE_RATIO: {
    RISK_FREE_RATE: 1.5,          // 無風險利率 (%)
  },
};

/**
 * 資料服務參數
 */
export const DATA_SERVICE = {
  // 快取設定
  CACHE: {
    PRICE_CACHE_DURATION: 3000,   // 股價快取時間 (毫秒)
    DATA_CACHE_DURATION: 60000,   // 一般數據快取時間 (毫秒)
  },
  
  // API 請求設定
  API: {
    BATCH_SIZE: 5,                // 批次請求大小
    BATCH_DELAY: 500,             // 批次間延遲 (毫秒)
    RETRY_ATTEMPTS: 3,            // 重試次數
    RETRY_DELAY: 1000,            // 重試延遲 (毫秒)
  },
  
  // 歷史數據
  HISTORICAL_DATA: {
    DEFAULT_DAYS: 90,             // 預設歷史天數
    MIN_DAYS_FOR_ANALYSIS: 30,    // 分析所需最少天數
  },
  
  // 即時更新
  LIVE_UPDATE: {
    INTERVAL: 3000,               // 更新間隔 (毫秒)
    MAX_RETRIES: 3,               // 最大重試次數
  },
};

/**
 * 綜合信號評分權重
 */
export const SIGNAL_WEIGHTS = {
  RSI: 1.0,                       // RSI 權重
  MACD: 1.0,                      // MACD 權重
  KDJ: 1.0,                       // KDJ 權重
  BOLLINGER_BANDS: 1.0,           // 布林帶權重
  MOVING_AVERAGE: 1.0,            // 均線權重
};

/**
 * 綜合信號閾值
 */
export const SIGNAL_THRESHOLDS = {
  STRONG_BUY: 1.5,                // 強力買入閾值
  BUY: 0.5,                       // 買入閾值
  SELL: -0.5,                     // 賣出閾值
  STRONG_SELL: -1.5,              // 強力賣出閾值
};

/**
 * UI 顯示參數
 */
export const UI_CONFIG = {
  // 動畫設定
  ANIMATION: {
    PRICE_FLASH_DURATION: 1000,   // 價格閃爍持續時間 (毫秒)
    EXPAND_DURATION: 500,         // 展開動畫時間 (毫秒)
  },
  
  // 顏色設定
  COLORS: {
    PRICE_UP: 'text-green-400',
    PRICE_DOWN: 'text-red-400',
    NEUTRAL: 'text-gray-400',
  },
  
  // 顯示限制
  DISPLAY: {
    MAX_RECOMMENDATIONS: 2,       // 技術指標建議最大顯示數
    MAX_NEWS_ITEMS: 5,            // 新聞最大顯示數
  },
};

/**
 * 選股條件參數
 */
export const STOCK_FILTER = {
  MAX_PRICE: 50,                  // 最高股價 (元)
  MIN_VOLUME: 500000,             // 最低成交量 (股)
  MIN_LIQUIDITY: 10000000,        // 最低流動性 (元)
};

/**
 * 回測參數
 */
export const BACKTEST = {
  DEFAULT_CAPITAL: 10000,         // 預設資金 (元)
  COMMISSION_RATE: 0.001425,      // 手續費率
  TAX_RATE: 0.003,                // 證交稅率
  SLIPPAGE: 0.001,                // 滑價率
};

