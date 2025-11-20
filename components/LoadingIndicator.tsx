
import React, { useState, useEffect } from 'react';
import { NewspaperIcon } from './icons/NewspaperIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { SignalIcon } from './icons/SignalIcon';
import { CpuIcon } from './icons/CpuIcon';

const analysisSteps = [
  { text: "掃描全球財經新聞 (Bloomberg, Reuters)...", icon: NewspaperIcon },
  { text: "整合市場動態 (CNBC, MarketWatch)...", icon: NewspaperIcon },
  { text: "執行技術分析 (TradingView, Finviz)...", icon: TrendingUpIcon },
  { text: "監控社交媒體情緒 (StockTwits)...", icon: SignalIcon },
  { text: "應用小七娜娜與神奇九轉指標...", icon: SignalIcon },
  { text: "分析日K線組合型態...", icon: TrendingUpIcon },
  { text: "進行量價分析 (VWAP, 異常成交量)...", icon: TrendingUpIcon },
  { text: "評估籌碼與資金流向...", icon: TrendingUpIcon },
  { text: "AI 模型預測與回測數據優化...", icon: CpuIcon },
  { text: "生成最終投資建議...", icon: CpuIcon },
];

export const LoadingIndicator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prevStep) => (prevStep + 1) % analysisSteps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = analysisSteps[currentStep].icon;

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-gray-800/50 rounded-lg">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping"></div>
        <CurrentIcon className="w-10 h-10 text-blue-400 animate-pulse" />
      </div>
      <p className="text-lg text-blue-300 font-semibold text-center">正在為您分析市場...</p>
      <p className="text-sm text-gray-400 text-center w-64 h-10 flex items-center justify-center">{analysisSteps[currentStep].text}</p>
    </div>
  );
};
