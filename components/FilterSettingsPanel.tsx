/**
 * 篩選設定面板組件
 * 允許用戶自訂股價範圍、推薦數量、目標獲利率、風險等級
 */

import React, { useState, useEffect } from 'react';
import type { FilterSettings } from '../types';
import { DEFAULT_FILTER_SETTINGS, RISK_LEVEL_LABELS } from '../types';

interface FilterSettingsPanelProps {
  settings: FilterSettings;
  onSettingsChange: (settings: FilterSettings) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// localStorage 鍵名
const STORAGE_KEY = 'stockFilterSettings';

/**
 * 從 localStorage 讀取設定
 */
export const loadFilterSettings = (): FilterSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_FILTER_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('無法讀取篩選設定:', e);
  }
  return DEFAULT_FILTER_SETTINGS;
};

/**
 * 儲存設定到 localStorage
 */
export const saveFilterSettings = (settings: FilterSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('無法儲存篩選設定:', e);
  }
};

export const FilterSettingsPanel: React.FC<FilterSettingsPanelProps> = ({
  settings,
  onSettingsChange,
  isOpen,
  onToggle,
}) => {
  // 內部狀態，用於即時更新滑桿
  const [localSettings, setLocalSettings] = useState<FilterSettings>(settings);

  // 同步外部設定變更
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // 處理設定變更
  const handleChange = (key: keyof FilterSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
    saveFilterSettings(newSettings);
  };

  // 處理價格範圍變更
  const handlePriceRangeChange = (type: 'min' | 'max', value: number) => {
    const newPriceRange = { ...localSettings.priceRange, [type]: value };
    // 確保 min <= max
    if (type === 'min' && value > localSettings.priceRange.max) {
      newPriceRange.max = value;
    }
    if (type === 'max' && value < localSettings.priceRange.min) {
      newPriceRange.min = value;
    }
    handleChange('priceRange', newPriceRange);
  };

  // 重置為預設值
  const handleReset = () => {
    setLocalSettings(DEFAULT_FILTER_SETTINGS);
    onSettingsChange(DEFAULT_FILTER_SETTINGS);
    saveFilterSettings(DEFAULT_FILTER_SETTINGS);
  };

  return (
    <div className="mb-6">
      {/* 切換按鈕 */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 transition-colors"
      >
        <span className="text-lg">⚙️</span>
        <span>進階篩選設定</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* 設定面板 */}
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-blue-300">📊 自訂篩選條件</h3>
            <button
              onClick={handleReset}
              className="text-xs px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-gray-300 transition-colors"
            >
              重置為預設
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 股價範圍 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                💰 股價範圍 (元)
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={localSettings.priceRange.min}
                    onChange={(e) => handlePriceRangeChange('min', Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>最低: {localSettings.priceRange.min} 元</span>
                  </div>
                </div>
                <span className="text-gray-400">~</span>
                <div className="flex-1">
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={localSettings.priceRange.max}
                    onChange={(e) => handlePriceRangeChange('max', Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>最高: {localSettings.priceRange.max} 元</span>
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-blue-300 bg-blue-900/30 py-1 rounded">
                {localSettings.priceRange.min} ~ {localSettings.priceRange.max} 元
              </div>
            </div>

            {/* 推薦股票數量 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                📋 推薦股票數量
              </label>
              <div className="flex gap-2">
                {[3, 5, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleChange('stockCount', count)}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                      localSettings.stockCount === count
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {count} 支
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">選擇一次分析推薦的股票數量</p>
            </div>

            {/* 目標獲利率 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                🎯 目標獲利率 (%)
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={localSettings.targetProfitRate}
                onChange={(e) => handleChange('targetProfitRate', Number(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>5%</span>
                <span className="text-green-400 font-bold text-sm">{localSettings.targetProfitRate}%</span>
                <span>30%</span>
              </div>
              <p className="text-xs text-gray-400">期望的潛在漲幅目標</p>
            </div>

            {/* 風險等級 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                ⚡ 風險承受等級
              </label>
              <div className="flex gap-2">
                {(['conservative', 'moderate', 'aggressive'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => handleChange('riskLevel', level)}
                    className={`flex-1 py-2 px-2 rounded-lg font-medium text-sm transition-colors ${
                      localSettings.riskLevel === level
                        ? level === 'conservative'
                          ? 'bg-green-600 text-white'
                          : level === 'moderate'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {RISK_LEVEL_LABELS[level]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {localSettings.riskLevel === 'conservative' && '偏好穩定、低波動的股票'}
                {localSettings.riskLevel === 'moderate' && '平衡風險與報酬'}
                {localSettings.riskLevel === 'aggressive' && '追求高報酬，願意承擔較高風險'}
              </p>
            </div>

            {/* 投資本金 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                💵 投資本金 (元)
              </label>
              <div className="flex gap-2">
                {[10000, 50000, 100000, 500000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleChange('capital', amount)}
                    className={`flex-1 py-2 px-1 rounded-lg font-medium text-xs transition-colors ${
                      localSettings.capital === amount
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {(amount / 10000).toFixed(0)}萬
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1000"
                max="10000000"
                step="1000"
                value={localSettings.capital}
                onChange={(e) => handleChange('capital', Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                placeholder="自訂金額"
              />
            </div>
          </div>

          {/* 當前設定摘要 */}
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-600">
            <h4 className="text-sm font-medium text-gray-300 mb-2">📌 當前篩選條件摘要</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs">
                股價: {localSettings.priceRange.min}~{localSettings.priceRange.max} 元
              </span>
              <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-xs">
                數量: {localSettings.stockCount} 支
              </span>
              <span className="px-3 py-1 bg-yellow-900/50 text-yellow-300 rounded-full text-xs">
                目標: +{localSettings.targetProfitRate}%
              </span>
              <span className={`px-3 py-1 rounded-full text-xs ${
                localSettings.riskLevel === 'conservative' ? 'bg-green-900/50 text-green-300' :
                localSettings.riskLevel === 'moderate' ? 'bg-yellow-900/50 text-yellow-300' :
                'bg-red-900/50 text-red-300'
              }`}>
                {RISK_LEVEL_LABELS[localSettings.riskLevel]}
              </span>
              <span className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-xs">
                本金: {(localSettings.capital / 10000).toFixed(1)} 萬
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSettingsPanel;

