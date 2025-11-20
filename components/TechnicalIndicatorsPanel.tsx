/**
 * 技術指標詳細面板元件
 * 顯示完整的技術指標分析結果
 */

import React from 'react';
import type { StockRecommendation } from '../types';
import { getOverallSignalLabel, getOverallSignalColor } from '../services/technicalIndicators';

interface TechnicalIndicatorsPanelProps {
  stock: StockRecommendation;
}

export const TechnicalIndicatorsPanel: React.FC<TechnicalIndicatorsPanelProps> = ({ stock }) => {
  if (!stock.technicalAnalysis) {
    return (
      <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700 text-center text-gray-400">
        <p>技術指標數據不足</p>
      </div>
    );
  }

  const { technicalAnalysis: ta } = stock;

  return (
    <div className="space-y-4">
      {/* 綜合信號 */}
      <div className="p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg border border-blue-600">
        <h4 className="text-lg font-bold text-blue-300 mb-2">📊 綜合技術信號</h4>
        <div className="flex justify-between items-center">
          <span className={`text-2xl font-bold ${getOverallSignalColor(ta.overallSignal)}`}>
            {getOverallSignalLabel(ta.overallSignal)}
          </span>
          <div className="text-right">
            <p className="text-xs text-gray-400">信心指數</p>
            <p className="text-xl font-bold text-white">{ta.confidence}%</p>
          </div>
        </div>
      </div>

      {/* RSI 指標 */}
      <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700">
        <h5 className="font-semibold text-gray-300 mb-3">RSI 相對強弱指標</h5>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">RSI(14)</span>
            <span className="font-mono text-lg font-bold text-white">
              {ta.rsi14 !== null ? ta.rsi14.toFixed(2) : 'N/A'}
            </span>
          </div>
          {ta.rsi14 !== null && (
            <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`absolute h-full ${
                  ta.rsi14 < 30 ? 'bg-green-500' : 
                  ta.rsi14 > 70 ? 'bg-red-500' : 
                  'bg-yellow-500'
                }`}
                style={{ width: `${ta.rsi14}%` }}
              />
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-500">
            <span>超賣 (&lt;30)</span>
            <span>中性 (30-70)</span>
            <span>超買 (&gt;70)</span>
          </div>
        </div>
      </div>

      {/* MACD 指標 */}
      <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700">
        <h5 className="font-semibold text-gray-300 mb-3">MACD 指標</h5>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-400">MACD</p>
            <p className="font-mono text-sm font-bold text-white">
              {ta.macd.value !== null ? ta.macd.value.toFixed(4) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Signal</p>
            <p className="font-mono text-sm font-bold text-white">
              {ta.macd.signal !== null ? ta.macd.signal.toFixed(4) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">柱狀圖</p>
            <p className={`font-mono text-sm font-bold ${
              ta.macd.histogram !== null && ta.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {ta.macd.histogram !== null ? ta.macd.histogram.toFixed(4) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* KDJ 指標 */}
      <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700">
        <h5 className="font-semibold text-gray-300 mb-3">KDJ 隨機指標</h5>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-400">K 值</p>
            <p className="font-mono text-sm font-bold text-blue-400">
              {ta.kdj.k !== null ? ta.kdj.k.toFixed(2) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">D 值</p>
            <p className="font-mono text-sm font-bold text-purple-400">
              {ta.kdj.d !== null ? ta.kdj.d.toFixed(2) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">J 值</p>
            <p className="font-mono text-sm font-bold text-pink-400">
              {ta.kdj.j !== null ? ta.kdj.j.toFixed(2) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* 布林帶 */}
      <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700">
        <h5 className="font-semibold text-gray-300 mb-3">布林帶 (Bollinger Bands)</h5>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">上軌</span>
            <span className="font-mono text-red-400 font-semibold">
              {ta.bollingerBands.upper !== null ? ta.bollingerBands.upper.toFixed(2) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">中軌 (MA20)</span>
            <span className="font-mono text-yellow-400 font-semibold">
              {ta.bollingerBands.middle !== null ? ta.bollingerBands.middle.toFixed(2) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">下軌</span>
            <span className="font-mono text-green-400 font-semibold">
              {ta.bollingerBands.lower !== null ? ta.bollingerBands.lower.toFixed(2) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-3 pt-3 border-t border-gray-700">
            <span className="text-gray-400">當前價格</span>
            <span className="font-mono text-white font-bold">
              {stock.currentPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 技術指標建議 */}
      {ta.recommendations.length > 0 && (
        <div className="p-4 bg-yellow-900/30 rounded-md border border-yellow-600">
          <h5 className="font-semibold text-yellow-300 mb-2">💡 技術指標建議</h5>
          <ul className="space-y-1 text-sm text-yellow-100">
            {ta.recommendations.map((rec, idx) => (
              <li key={idx}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

