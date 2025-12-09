
import React, { useState, memo, useCallback } from 'react';
import type { StockRecommendation, BacktestResult } from '../types';
import StockChart from './StockChart';
import { StockNewsFeed } from './StockNewsFeed';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { runBacktest } from '../services/backtestService';
import { BacktestResult as BacktestResultComponent } from './BacktestResult';
import { HistoryIcon } from './icons/HistoryIcon';
import { getRiskLevelColor, getRiskLevelLabel } from '../services/riskManagement';
import { getOverallSignalLabel, getOverallSignalColor } from '../services/technicalIndicators';
import { TechnicalIndicatorsPanel } from './TechnicalIndicatorsPanel';

interface StockTableProps {
  recommendations: StockRecommendation[];
}

const PriceCell: React.FC<{ price: number; entryPoint: number }> = memo(({ price, entryPoint }) => {
    const [flashClass, setFlashClass] = React.useState('');
    const prevPriceRef = React.useRef(price);

    React.useEffect(() => {
        if (prevPriceRef.current !== price) {
            const newFlashClass = price > prevPriceRef.current ? 'bg-green-500/20' : 'bg-red-500/20';
            setFlashClass(newFlashClass);

            const timer = setTimeout(() => {
                setFlashClass('');
            }, 300);

            prevPriceRef.current = price;
            return () => clearTimeout(timer);
        }
    }, [price]);

    const priceColor = price > entryPoint ? 'text-green-400' : price < entryPoint ? 'text-red-400' : 'text-gray-300';

    return (
        <span className={`font-mono font-semibold transition-all duration-300 inline-block p-1 rounded-md ${flashClass} ${priceColor}`}>
            {price.toFixed(2)}
        </span>
    );
});


const StockCard: React.FC<{ stock: StockRecommendation }> = memo(({ stock }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  const handleRunBacktest = () => {
    setIsBacktesting(true);
    // Simulate a short delay for better UX
    setTimeout(() => {
      const result = runBacktest(stock);
      setBacktestResult(result);
      setIsBacktesting(false);
    }, 500);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 text-sm animate-fade-in overflow-hidden">
      <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-700">
        <div>
          <h3 className="font-bold text-lg text-white">{stock.stockName}</h3>
          <span className="text-gray-400 font-mono bg-gray-700/50 px-2 py-1 rounded text-xs">{stock.ticker}</span>
        </div>
        <div className="text-right flex-shrink-0 pl-2">
          <span className="text-xs text-gray-400 block">預估獲利 (TWD)</span>
          <p className="font-mono text-green-400 font-bold text-xl">
            {stock.profitTWD.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
      
      <div className="text-center my-4">
        <span className="text-xs text-gray-400">現價</span>
        <p className="text-3xl">
          <PriceCell price={stock.currentPrice} entryPoint={stock.entryPoint} />
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
        <div><span className="text-xs text-gray-400">進場點位</span><p className="font-mono text-gray-400 font-semibold text-base">{stock.entryPoint.toFixed(2)}</p></div>
        <div className="text-right"><span className="text-xs text-gray-400">出場點位</span><p className="font-mono text-yellow-400 font-semibold text-base">{stock.exitPoint.toFixed(2)}</p></div>
        <div><span className="text-xs text-gray-400">止損點位</span><p className="font-mono text-red-400 font-semibold text-base">{stock.stopLoss.toFixed(2)}</p></div>
        <div className="text-right"><span className="text-xs text-gray-400">獲利點位差</span><p className="font-mono text-gray-300 font-semibold text-base">{stock.profitPoints.toFixed(2)}</p></div>
        <div className="col-span-2"><span className="text-xs text-gray-400">購買股數 (以 10,000 TWD 估算)</span><p className="font-mono text-gray-300 font-semibold text-base">{stock.sharesToBuy.toLocaleString()}</p></div>
      </div>

      {/* 風險評估資訊 */}
      {stock.riskAssessment && (
        <div className="mb-4 p-3 bg-gray-700/50 rounded-md border border-gray-600">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-300">風險評估</span>
            <span className={`text-sm font-bold ${getRiskLevelColor(stock.riskAssessment.level)}`}>
              {getRiskLevelLabel(stock.riskAssessment.level)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">風險報酬比</span>
              <p className="font-mono text-white font-semibold">{stock.riskAssessment.riskRewardRatio.toFixed(2)}:1</p>
            </div>
            <div className="text-right">
              <span className="text-gray-400">波動率</span>
              <p className="font-mono text-white font-semibold">{stock.riskAssessment.volatility.toFixed(1)}%</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 mt-2">{stock.riskAssessment.recommendation}</p>
        </div>
      )}

      {/* 技術指標分析 */}
      {stock.technicalAnalysis && (
        <div className="mb-4 p-3 bg-blue-900/30 rounded-md border border-blue-600">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-blue-300">技術指標分析</span>
            <span className={`text-sm font-bold ${getOverallSignalColor(stock.technicalAnalysis.overallSignal)}`}>
              {getOverallSignalLabel(stock.technicalAnalysis.overallSignal)} ({stock.technicalAnalysis.confidence}%)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div>
              <span className="text-gray-400">RSI(14)</span>
              <p className="font-mono text-white font-semibold">
                {stock.technicalAnalysis.rsi14 !== null ? stock.technicalAnalysis.rsi14.toFixed(2) : 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-gray-400">MACD</span>
              <p className="font-mono text-white font-semibold">
                {stock.technicalAnalysis.macd.histogram !== null ? stock.technicalAnalysis.macd.histogram.toFixed(4) : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-gray-400">KDJ(K)</span>
              <p className="font-mono text-white font-semibold">
                {stock.technicalAnalysis.kdj.k !== null ? stock.technicalAnalysis.kdj.k.toFixed(2) : 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-gray-400">布林帶位置</span>
              <p className="font-mono text-white font-semibold text-xs">
                {stock.technicalAnalysis.bollingerBands.middle !== null ? stock.technicalAnalysis.bollingerBands.middle.toFixed(2) : 'N/A'}
              </p>
            </div>
          </div>
          {stock.technicalAnalysis.recommendations.length > 0 && (
            <div className="text-xs text-blue-200 mt-2 space-y-1">
              {stock.technicalAnalysis.recommendations.slice(0, 2).map((rec, idx) => (
                <p key={idx}>• {rec}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 資料來源標記 */}
      {stock.dataSource && (
        <div className="mb-4 text-xs text-gray-500">
          <p>📊 股價來源: {stock.dataSource.priceSource === 'TWSE_API' ? '證交所 API ✅' : 'AI 搜尋 ⚠️'}</p>
          <p>📈 歷史數據: {stock.dataSource.historicalSource === 'TWSE_API' ? '證交所 API ✅' : '無法取得 ❌'}</p>
        </div>
      )}
      
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="pt-3 mt-4 border-t border-gray-700">
          {isExpanded && <StockChart ticker={stock.ticker} exchange={stock.exchange} entryPoint={stock.entryPoint} exitPoint={stock.exitPoint} historicalData={stock.historicalData} />}

          {/* 技術指標詳細面板 */}
          {isExpanded && stock.technicalAnalysis && (
            <div className="my-4">
              <h4 className="font-bold text-purple-300 mb-3">📊 技術指標詳細分析</h4>
              <TechnicalIndicatorsPanel stock={stock} />
            </div>
          )}

          {/* 交易計畫摘要 - 使用 JSON 欄位的正確數值 */}
          <div className="mb-4 p-3 bg-emerald-900/30 rounded-md border border-emerald-600">
            <h4 className="font-bold text-emerald-300 mb-3">📋 交易計畫摘要（系統計算）</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400 text-xs">進場價位</span>
                <p className="font-mono text-white font-semibold">{stock.entryPoint.toFixed(2)} 元</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">目標價位</span>
                <p className="font-mono text-yellow-400 font-semibold">{stock.exitPoint.toFixed(2)} 元 (+{((stock.exitPoint - stock.entryPoint) / stock.entryPoint * 100).toFixed(1)}%)</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">停損價位</span>
                <p className="font-mono text-red-400 font-semibold">{stock.stopLoss.toFixed(2)} 元 ({((stock.stopLoss - stock.entryPoint) / stock.entryPoint * 100).toFixed(1)}%)</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">風險報酬比</span>
                <p className="font-mono text-cyan-400 font-semibold">
                  1:{((stock.exitPoint - stock.entryPoint) / (stock.entryPoint - stock.stopLoss)).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-700 text-xs text-emerald-200">
              💡 建議買入 <span className="font-mono font-bold">{stock.sharesToBuy.toLocaleString()}</span> 股，預估獲利 <span className="font-mono font-bold text-green-400">{stock.profitTWD.toLocaleString()}</span> 元
            </div>
          </div>

          <h4 className="font-bold text-blue-300 mb-2">📊 AI 專業分析報告</h4>
          <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed bg-gray-900/50 p-4 rounded-lg">
            {stock.reason}
          </div>
          
          {isExpanded && (
            <div className="my-4">
                <button 
                  onClick={handleRunBacktest}
                  disabled={isBacktesting || !stock.historicalData || stock.historicalData.length === 0}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
                >
                  <HistoryIcon className={`w-5 h-5 mr-2 ${isBacktesting ? 'animate-spin' : ''}`} />
                  {isBacktesting ? '回測中...' : '執行90日策略回測'}
                </button>
                {stock.historicalData && stock.historicalData.length === 0 && !isBacktesting && (
                    <p className="text-xs text-yellow-400 text-center mt-2">歷史數據載入中，請稍候...</p>
                )}
            </div>
          )}
          {backtestResult && <BacktestResultComponent result={backtestResult} />}

          {isExpanded && stock.news && stock.news.length > 0 && <StockNewsFeed news={stock.news} />}
        </div>
      </div>
      
      <div className="mt-4">
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="w-full flex justify-center items-center text-blue-300 hover:text-blue-200 hover:bg-gray-700/50 py-2 rounded-md transition-all duration-300"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? '隱藏詳細資訊' : '顯示詳細資訊'}</span>
          <ChevronDownIcon className={`w-5 h-5 ml-2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
    // Re-render if price, news, or historical data changes. Other props are static.
    return prevProps.stock.currentPrice === nextProps.stock.currentPrice &&
           prevProps.stock.news?.length === nextProps.stock.news?.length &&
           prevProps.stock.historicalData?.length === nextProps.stock.historicalData?.length;
});

const StockRow = memo(({ stock, isExpanded, onToggle }: { stock: StockRecommendation, isExpanded: boolean, onToggle: (ticker: string) => void}) => {
    const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
    const [isBacktesting, setIsBacktesting] = useState(false);

    const handleRunBacktest = () => {
        setIsBacktesting(true);
        // Simulate a short delay for better UX
        setTimeout(() => {
            const result = runBacktest(stock);
            setBacktestResult(result);
            setIsBacktesting(false);
        }, 500);
    };

    return (
        <React.Fragment>
            <tr 
                className="border-b border-gray-700 bg-gray-800 hover:bg-gray-700/70 transition-colors duration-200 cursor-pointer"
                onClick={() => onToggle(stock.ticker)}
                aria-expanded={isExpanded}
            >
                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{stock.stockName}</td>
                <td className="px-6 py-4">{stock.ticker}</td>
                <td className="px-6 py-4 text-right">
                    <PriceCell price={stock.currentPrice} entryPoint={stock.entryPoint} />
                </td>
                <td className="px-6 py-4 text-right text-gray-400 font-mono">{stock.entryPoint.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-yellow-400 font-mono">{stock.exitPoint.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-red-400 font-mono">{stock.stopLoss.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-mono">{stock.profitPoints.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-mono">{stock.sharesToBuy.toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-green-400 font-bold font-mono">
                    {stock.profitTWD.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-gray-900/70">
                <td colSpan={9} className="p-0">
                    <div className="p-6 transition-all duration-500 ease-in-out animate-fade-in">
                        <h4 className="font-bold text-blue-300 mb-4">{stock.stockName} ({stock.ticker}) - 詳細分析</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            <div className="space-y-4">
                                {/* 交易計畫區塊 - 使用 JSON 欄位的正確數值 */}
                                <div className="p-4 bg-emerald-900/30 rounded-md border border-emerald-600">
                                    <h5 className="font-bold text-emerald-300 mb-3">📋 交易計畫</h5>
                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-400 text-xs">進場價位</span>
                                            <p className="font-mono text-white font-semibold">{stock.entryPoint.toFixed(2)} 元</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 text-xs">目標價位</span>
                                            <p className="font-mono text-yellow-400 font-semibold">{stock.exitPoint.toFixed(2)} 元 (+{((stock.exitPoint - stock.entryPoint) / stock.entryPoint * 100).toFixed(1)}%)</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 text-xs">停損價位</span>
                                            <p className="font-mono text-red-400 font-semibold">{stock.stopLoss.toFixed(2)} 元 ({((stock.stopLoss - stock.entryPoint) / stock.entryPoint * 100).toFixed(1)}%)</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 text-xs">風險報酬比</span>
                                            <p className="font-mono text-cyan-400 font-semibold">
                                                1:{((stock.exitPoint - stock.entryPoint) / Math.max(stock.entryPoint - stock.stopLoss, 0.01)).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-emerald-700 text-sm text-emerald-200">
                                        💡 建議買入 <span className="font-mono font-bold">{stock.sharesToBuy.toLocaleString()}</span> 股，預估獲利 <span className="font-mono font-bold text-green-400">{stock.profitTWD.toLocaleString()}</span> 元
                                    </div>
                                </div>

                                <div>
                                    <h5 className="font-semibold text-gray-300 mb-2">📊 AI 專業分析報告</h5>
                                    <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed bg-gray-900/50 p-4 rounded-lg">
                                        {stock.reason}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-700">
                                    <button 
                                    onClick={handleRunBacktest}
                                    disabled={isBacktesting || !stock.historicalData || stock.historicalData.length === 0}
                                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
                                    >
                                    <HistoryIcon className={`w-5 h-5 mr-2 ${isBacktesting ? 'animate-spin' : ''}`} />
                                    {isBacktesting ? '回測中...' : '執行90日策略回測'}
                                    </button>
                                    {stock.historicalData && stock.historicalData.length === 0 && !isBacktesting && (
                                        <p className="text-xs text-yellow-400 text-center mt-2">歷史數據載入中，請稍候...</p>
                                    )}
                                </div>
                                {backtestResult && <BacktestResultComponent result={backtestResult} />}

                                {stock.news && stock.news.length > 0 && (
                                  <div>
                                    <StockNewsFeed news={stock.news} />
                                  </div>
                                )}
                            </div>
                            <StockChart ticker={stock.ticker} exchange={stock.exchange} entryPoint={stock.entryPoint} exitPoint={stock.exitPoint} historicalData={stock.historicalData} />
                        </div>
                    </div>
                </td>
            </tr>
            )}
        </React.Fragment>
    );
}, (prevProps, nextProps) => {
    // Only re-render if the price, expanded state, news, or historical data changes.
    return prevProps.stock.currentPrice === nextProps.stock.currentPrice && 
           prevProps.isExpanded === nextProps.isExpanded &&
           prevProps.stock.news?.length === nextProps.stock.news?.length &&
           prevProps.stock.historicalData?.length === nextProps.stock.historicalData?.length;
});

export const StockTable: React.FC<StockTableProps> = ({ recommendations }) => {
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  const handleToggleTicker = useCallback((ticker: string) => {
    setExpandedTicker(current => (current === ticker ? null : ticker));
  }, []);

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-hidden bg-gray-800 rounded-lg shadow-lg">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-blue-300 uppercase bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3">股票名稱</th>
                <th scope="col" className="px-6 py-3">代號</th>
                <th scope="col" className="px-6 py-3 text-right">現價</th>
                <th scope="col" className="px-6 py-3 text-right">進場點位</th>
                <th scope="col" className="px-6 py-3 text-right">出場點位</th>
                <th scope="col" className="px-6 py-3 text-right">止損點位</th>
                <th scope="col" className="px-6 py-3 text-right">獲利點位差</th>
                <th scope="col" className="px-6 py-3 text-right">購買股數</th>
                <th scope="col" className="px-6 py-3 text-right">預估獲利 (TWD)</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((stock) => (
                <StockRow 
                    key={stock.ticker} 
                    stock={stock} 
                    isExpanded={expandedTicker === stock.ticker}
                    onToggle={handleToggleTicker}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {recommendations.map((stock) => (
          <StockCard key={stock.ticker} stock={stock} />
        ))}
      </div>
    </>
  );
};
