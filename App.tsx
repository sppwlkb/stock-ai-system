
import React, { useState, useEffect } from 'react';
import { getTradingRecommendations, getStockNews, getHistoricalStockData } from './services/geminiService';
import { fetchInitialLivePrices, updateLivePrices } from './services/stockDataService';
import { assessRisk } from './services/riskManagement';
import { performTechnicalAnalysis } from './services/technicalIndicators';
import type { StockRecommendation, GroundingChunk } from './types';
import { LoadingIndicator } from './components/LoadingIndicator';
import { StockTable } from './components/StockTable';
import { ChartIcon } from './components/icons/ChartIcon';
import { AnalyzeIcon } from './components/icons/AnalyzeIcon';
import { GroundingSources } from './components/GroundingSources';
import { RefreshIcon } from './components/icons/RefreshIcon';
import { EnhancedDisclaimer, RiskConfirmationModal } from './components/EnhancedDisclaimer';

const App: React.FC = () => {
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisTime, setAnalysisTime] = useState<string | null>(null);
  const [showRiskModal, setShowRiskModal] = useState<boolean>(false);
  const [hasAcceptedRisk, setHasAcceptedRisk] = useState<boolean>(false);

  // 檢查是否已接受風險聲明（使用 localStorage）
  useEffect(() => {
    const accepted = localStorage.getItem('riskAccepted');
    if (accepted === 'true') {
      setHasAcceptedRisk(true);
    } else {
      setShowRiskModal(true);
    }
  }, []);

  const handleRiskConfirm = () => {
    localStorage.setItem('riskAccepted', 'true');
    setHasAcceptedRisk(true);
    setShowRiskModal(false);
  };

  const handleRiskCancel = () => {
    setShowRiskModal(false);
    // 不允許使用系統
  };

  const handleAnalyzeClick = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations([]);
    setSources([]);
    setAnalysisTime(null);
    try {
      const { recommendations: result, sources: groundingSources } = await getTradingRecommendations();
      if (result && result.length > 0) {
        // First, get the initial "live" prices for the recommendations
        const initialPrices = await fetchInitialLivePrices(result);
        const recommendationsWithPrice = result.map(rec => ({
            ...rec,
            currentPrice: initialPrices.get(rec.ticker) || rec.entryPoint,
        }));
        
        setRecommendations(recommendationsWithPrice);
        setSources(groundingSources);
        setAnalysisTime(new Date().toLocaleString('zh-TW', { hour12: false }));
        
        // Fetch news and historical data for all recommendations concurrently
        const dataPromises = recommendationsWithPrice.map(rec => 
            Promise.all([
                getStockNews(rec.stockName),
                getHistoricalStockData(rec.stockName, rec.ticker, rec.entryPoint)
            ])
        );
        const dataResults = await Promise.allSettled(dataPromises);
        
        setRecommendations(currentRecs => currentRecs.map((rec, index) => {
            const dataResult = dataResults[index];
            if (dataResult.status === 'fulfilled') {
                const [news, historicalData] = dataResult.value;

                // 計算風險評估
                let riskAssessment = undefined;
                if (historicalData && historicalData.length > 0) {
                  const assessment = assessRisk(
                    rec.entryPoint,
                    rec.exitPoint,
                    rec.stopLoss,
                    historicalData
                  );
                  riskAssessment = {
                    level: assessment.level,
                    riskRewardRatio: assessment.riskRewardRatio,
                    volatility: assessment.volatility,
                    maxDrawdown: assessment.maxDrawdown,
                    recommendation: assessment.recommendation,
                  };
                }

                // 計算技術指標分析
                let technicalAnalysis = undefined;
                if (historicalData && historicalData.length > 0) {
                  const analysis = performTechnicalAnalysis(historicalData, rec.currentPrice);
                  technicalAnalysis = {
                    rsi14: analysis.rsi.rsi14,
                    macd: {
                      value: analysis.macd.macd,
                      signal: analysis.macd.signal,
                      histogram: analysis.macd.histogram
                    },
                    kdj: {
                      k: analysis.kdj.k,
                      d: analysis.kdj.d,
                      j: analysis.kdj.j
                    },
                    bollingerBands: {
                      upper: analysis.bollingerBands.upper,
                      middle: analysis.bollingerBands.middle,
                      lower: analysis.bollingerBands.lower
                    },
                    overallSignal: analysis.overallSignal,
                    confidence: analysis.confidence,
                    recommendations: [
                      analysis.rsi.recommendation,
                      analysis.macd.recommendation,
                      analysis.kdj.recommendation,
                      analysis.bollingerBands.recommendation
                    ].filter(r => r && r !== '數據不足，無法計算 RSI' && r !== '數據不足，無法計算 MACD' && r !== '數據不足，無法計算 KDJ' && r !== '數據不足，無法計算布林帶')
                  };
                }

                // 標記資料來源
                const dataSource = {
                  priceSource: (initialPrices.get(rec.ticker) ? 'TWSE_API' : 'AI_SEARCH') as 'TWSE_API' | 'AI_SEARCH' | 'FALLBACK',
                  historicalSource: (historicalData && historicalData.length > 0 ? 'TWSE_API' : 'UNAVAILABLE') as 'TWSE_API' | 'UNAVAILABLE',
                  lastUpdated: new Date().toISOString(),
                };

                return { ...rec, news, historicalData, riskAssessment, dataSource, technicalAnalysis };
            }
            return rec; // Keep original recommendation if data fetch fails
        }));

      } else {
        setError("AI 分析模型目前未找到符合所有嚴格條件的標的，請稍後再試。");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`分析時發生錯誤: ${err.message}`);
      } else {
        setError("發生未知錯誤，請檢查網路連線或 API 金鑰。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Effect for handling live price updates
  useEffect(() => {
    if (recommendations.length === 0 || isLoading) {
      return;
    }

    const priceUpdateInterval = setInterval(async () => {
      const tickers = recommendations.map(r => r.ticker);
      const updatedPrices = await updateLivePrices(tickers);
      setRecommendations(prevRecommendations =>
        prevRecommendations.map(stock => ({
          ...stock,
          currentPrice: updatedPrices.get(stock.ticker) || stock.currentPrice,
        }))
      );
    }, 2000);

    return () => clearInterval(priceUpdateInterval);
  }, [recommendations, isLoading]);


  const WelcomeMessage: React.FC = () => (
    <div className="text-center p-8 bg-gray-800/50 rounded-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-300 mb-4">歡迎使用 AI 股市分析師助理 v2.0</h2>
      <p className="text-gray-400 mb-4">
        本系統整合 <span className="font-bold text-teal-300">台灣證交所真實股價 API</span>、
        <span className="font-bold text-purple-300">AI 智能分析</span> 與
        <span className="font-bold text-orange-300">專業風險管理</span>，
        為您篩選股價 50 元以下、具潛力的台股標的。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
        <div className="bg-blue-900/30 p-3 rounded-md border border-blue-600">
          <p className="font-semibold text-blue-300">✅ 真實數據</p>
          <p className="text-gray-400 text-xs mt-1">使用證交所官方 API</p>
        </div>
        <div className="bg-purple-900/30 p-3 rounded-md border border-purple-600">
          <p className="font-semibold text-purple-300">🤖 AI 分析</p>
          <p className="text-gray-400 text-xs mt-1">Gemini 2.5 Flash 模型</p>
        </div>
        <div className="bg-orange-900/30 p-3 rounded-md border border-orange-600">
          <p className="font-semibold text-orange-300">⚡ 風險評估</p>
          <p className="text-gray-400 text-xs mt-1">專業風險管理系統</p>
        </div>
      </div>

      <p className="text-sm text-yellow-400/80 mb-8">
        ⚠️ 本系統僅供學術研究與參考，不構成投資建議。股市有風險，投資請謹慎。
      </p>
      <button
        onClick={handleAnalyzeClick}
        disabled={isLoading || !hasAcceptedRisk}
        className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
      >
        <AnalyzeIcon className="w-6 h-6 mr-3" />
        開始分析當日台股
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      {/* 風險確認彈窗 */}
      <RiskConfirmationModal
        isOpen={showRiskModal}
        onConfirm={handleRiskConfirm}
        onCancel={handleRiskCancel}
      />

      <div className="container mx-auto max-w-7xl">
        <header className="flex items-center justify-center space-x-4 p-4 mb-8 border-b-2 border-gray-700">
          <ChartIcon className="w-10 h-10 text-blue-400" />
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            資深股市分析師 AI 助理
          </h1>
        </header>

        <main>
          {isLoading && <LoadingIndicator />}
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative max-w-2xl mx-auto text-center">
              <strong className="font-bold">分析失敗! </strong>
              <span className="block sm:inline">{error}</span>
              <button
                onClick={handleAnalyzeClick}
                className="mt-4 inline-flex items-center justify-center px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-colors duration-300"
              >
                <RefreshIcon className="w-5 h-5 mr-2" />
                再試一次
              </button>
            </div>
          )}
          
          {!isLoading && !error && recommendations.length === 0 && <WelcomeMessage />}

          {recommendations.length > 0 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-800/50 rounded-lg mb-4">
                <div className="text-sm text-gray-300 mb-2 sm:mb-0">
                  <p><span className="font-bold text-blue-300">分析完成時間：</span>{analysisTime}</p>
                  <p className="mt-1">為確保資訊即時性，建議在 <span className="font-bold">15-30 分鐘內</span> 參考此分析。</p>
                </div>
                <button
                  onClick={handleAnalyzeClick}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
                >
                  <RefreshIcon className="w-5 h-5 mr-2" />
                  重新分析
                </button>
              </div>
              <StockTable recommendations={recommendations} />
              <GroundingSources sources={sources} />

              {/* 使用強化版免責聲明 */}
              <EnhancedDisclaimer />
            </div>
          )}
        </main>

        <footer className="text-center mt-12 py-4 text-xs text-gray-600 border-t border-gray-800">
          <p>AI Stock Analyst Assistant © {new Date().getFullYear()}</p>
          <p className="mt-1">All data is AI-generated for demonstration purposes only and is not investment advice.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
