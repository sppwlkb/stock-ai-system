/**
 * 市場分析面板組件
 * 顯示美股表現、聯準會政策、台股展望三大分析因素
 */

import React from 'react';
import type { MarketAnalysis } from '../types';

interface MarketAnalysisPanelProps {
  analysis: MarketAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

/**
 * 趨勢箭頭圖示
 */
const TrendIcon: React.FC<{ trend: 'up' | 'down' | 'flat' }> = ({ trend }) => {
  if (trend === 'up') {
    return <span className="text-green-400">▲</span>;
  } else if (trend === 'down') {
    return <span className="text-red-400">▼</span>;
  }
  return <span className="text-gray-400">—</span>;
};

/**
 * 漲跌幅顯示
 */
const ChangeDisplay: React.FC<{ change: number; label: string }> = ({ change, label }) => {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const colorClass = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400';
  const sign = isPositive ? '+' : '';

  return (
    <span className={`${colorClass} font-medium`}>
      {label} {sign}{change.toFixed(1)}%
    </span>
  );
};

/**
 * 檢查資料日期是否過時（超過 3 天）
 */
const isDataStale = (dateStr: string | undefined): boolean => {
  if (!dateStr) return false;
  try {
    const dataDate = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 3;
  } catch {
    return false;
  }
};

/**
 * 資料日期標籤組件
 */
const DataDateLabel: React.FC<{ date: string | undefined; label: string }> = ({ date, label }) => {
  if (!date) return null;
  const stale = isDataStale(date);

  return (
    <span className={`text-xs ${stale ? 'text-yellow-400' : 'text-gray-500'}`}>
      {stale && '⚠️ '}
      {label}：{date}
      {stale && ' (資料可能過時)'}
    </span>
  );
};

export const MarketAnalysisPanel: React.FC<MarketAnalysisPanelProps> = ({
  analysis,
  isLoading,
  error,
  onRefresh,
}) => {
  // 載入中狀態
  if (isLoading) {
    return (
      <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🌐</span>
          <h2 className="text-xl font-bold text-blue-300">市場分析</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-gray-400">正在分析全球市場動態...</span>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="bg-gray-800/60 border border-red-700/50 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🌐</span>
          <h2 className="text-xl font-bold text-blue-300">市場分析</h2>
        </div>
        <div className="text-red-400 text-center py-4">
          <p>{error}</p>
          <button
            onClick={onRefresh}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  // 無資料狀態
  if (!analysis) {
    return null;
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-6 mb-6">
      {/* 標題 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌐</span>
          <h2 className="text-xl font-bold text-blue-300">市場分析</h2>
        </div>
        <span className="text-xs text-gray-500">{analysis.analysisTime}</span>
      </div>

      <div className="space-y-4">
        {/* 美股表現 */}
        <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h3 className="font-bold text-blue-400">美股表現</h3>
            </div>
            <DataDateLabel date={(analysis.usMarket as any).dataDate} label="收盤日期" />
          </div>
          <p className="text-gray-300 text-sm mb-2">{analysis.usMarket.summary}</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1">
              <TrendIcon trend={analysis.usMarket.dowJones.trend} />
              <ChangeDisplay change={analysis.usMarket.dowJones.change} label="道瓊" />
            </span>
            <span className="flex items-center gap-1">
              <TrendIcon trend={analysis.usMarket.nasdaq.trend} />
              <ChangeDisplay change={analysis.usMarket.nasdaq.change} label="那斯達克" />
            </span>
            <span className="flex items-center gap-1">
              <TrendIcon trend={analysis.usMarket.sp500.trend} />
              <ChangeDisplay change={analysis.usMarket.sp500.change} label="S&P500" />
            </span>
          </div>
        </div>

        {/* 聯準會政策 */}
        <div className="bg-purple-900/30 border border-purple-600/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏛️</span>
              <h3 className="font-bold text-purple-400">聯準會政策</h3>
            </div>
            <DataDateLabel date={(analysis.fedPolicy as any).dataDate} label="政策日期" />
          </div>
          <p className="text-gray-300 text-sm">{analysis.fedPolicy.summary}</p>
          {analysis.fedPolicy.marketImpact && (
            <p className="text-purple-300 text-xs mt-2">
              💡 {analysis.fedPolicy.marketImpact}
            </p>
          )}
        </div>

        {/* 台股展望 */}
        <div className="bg-teal-900/30 border border-teal-600/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🇹🇼</span>
              <h3 className="font-bold text-teal-400">台股展望</h3>
            </div>
            <DataDateLabel date={(analysis.twMarketOutlook as any).dataDate} label="分析日期" />
          </div>
          <p className="text-gray-300 text-sm">{analysis.twMarketOutlook.summary}</p>
          {analysis.twMarketOutlook.hotSectors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {analysis.twMarketOutlook.hotSectors.map((sector, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-teal-800/50 text-teal-300 rounded text-xs">
                  {sector}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

