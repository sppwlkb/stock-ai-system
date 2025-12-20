import React, { memo, useState } from 'react';
import type { HistoricalDataPoint } from '../types';

interface StockChartProps {
  ticker: string;
  exchange: 'TWSE' | 'TPEX';
  entryPoint: number;
  exitPoint: number;
  historicalData: HistoricalDataPoint[]; // This prop is kept for API compatibility
}

/**
 * 股票 K 線圖組件 - 使用 Yahoo 股市
 * 提供多個外部圖表連結供用戶選擇
 */
const StockChart: React.FC<StockChartProps> = ({ ticker, exchange, entryPoint, exitPoint }) => {
  const [activeTab, setActiveTab] = useState<'yahoo' | 'cnyes' | 'tradingview'>('yahoo');

  // 根據交易所決定 Yahoo 股票代碼格式
  // 上市股票：2303.TW，上櫃股票：6488.TWO
  const yahooSymbol = exchange === 'TPEX' ? `${ticker}.TWO` : `${ticker}.TW`;

  // 各平台 URL
  const urls = {
    yahoo: `https://tw.stock.yahoo.com/quote/${yahooSymbol}/technical-analysis`,
    yahooChart: `https://tw.stock.yahoo.com/quote/${yahooSymbol}`,
    cnyes: `https://www.cnyes.com/twstock/${ticker}`,
    tradingview: `https://www.tradingview.com/chart/?symbol=${exchange}:${ticker}`,
    goodinfo: `https://goodinfo.tw/tw/StockDetail.asp?STOCK_ID=${ticker}`,
    wantgoo: `https://www.wantgoo.com/stock/${ticker}`,
  };

  // 交易資訊面板
  const TradingInfo = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-800/50 rounded-lg">
      <div className="text-center">
        <div className="text-xs text-gray-400">股票代碼</div>
        <div className="text-lg font-bold text-white">{ticker}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-400">交易所</div>
        <div className="text-lg font-bold text-blue-400">{exchange === 'TPEX' ? '上櫃' : '上市'}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-400">建議進場價</div>
        <div className="text-lg font-bold text-green-400">{entryPoint.toFixed(2)} 元</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-400">目標價</div>
        <div className="text-lg font-bold text-yellow-400">{exitPoint.toFixed(2)} 元</div>
      </div>
    </div>
  );

  // 圖表連結按鈕
  const ChartButton = ({
    url,
    label,
    icon,
    bgColor,
    isActive = false
  }: {
    url: string;
    label: string;
    icon: string;
    bgColor: string;
    isActive?: boolean;
  }) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-4 py-3 ${bgColor} text-white rounded-lg transition-all hover:scale-105 hover:shadow-lg ${isActive ? 'ring-2 ring-white' : ''}`}
    >
      <span className="text-xl">{icon}</span>
      <div className="text-left">
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs opacity-80">點擊開啟</div>
      </div>
    </a>
  );

  return (
    <div className="my-4 w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      {/* 標題 */}
      <div className="p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          📊 {ticker} K線圖 & 技術分析
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          點擊下方按鈕開啟專業圖表平台查看完整 K 線圖和技術指標
        </p>
      </div>

      {/* 交易資訊 */}
      <div className="p-4">
        <TradingInfo />
      </div>

      {/* 圖表連結區域 */}
      <div className="p-4 bg-gray-800/30">
        <div className="text-sm text-gray-400 mb-3">🔗 選擇圖表平台：</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <ChartButton
            url={urls.yahoo}
            label="Yahoo 技術分析"
            icon="📈"
            bgColor="bg-purple-600 hover:bg-purple-700"
          />
          <ChartButton
            url={urls.yahooChart}
            label="Yahoo 股市"
            icon="🟣"
            bgColor="bg-indigo-600 hover:bg-indigo-700"
          />
          <ChartButton
            url={urls.cnyes}
            label="鉅亨網"
            icon="💹"
            bgColor="bg-green-600 hover:bg-green-700"
          />
          <ChartButton
            url={urls.tradingview}
            label="TradingView"
            icon="📊"
            bgColor="bg-blue-600 hover:bg-blue-700"
          />
          <ChartButton
            url={urls.goodinfo}
            label="Goodinfo"
            icon="📋"
            bgColor="bg-orange-600 hover:bg-orange-700"
          />
        </div>
      </div>

      {/* 提示訊息 */}
      <div className="p-3 bg-gray-800 border-t border-gray-700 text-center">
        <span className="text-xs text-gray-500">
          💡 提示：Yahoo 股市和鉅亨網提供最完整的台股技術分析資料
        </span>
      </div>
    </div>
  );
};

// Memoize the component to prevent re-renders unless props change
export default memo(StockChart);