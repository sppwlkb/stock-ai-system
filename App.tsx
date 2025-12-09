
import React, { useState, useEffect } from 'react';
import { getTradingRecommendations, getStockNews, getHistoricalStockData } from './services/geminiService';
import { fetchInitialLivePrices, updateLivePrices } from './services/stockDataService';
import { getMarketAnalysis } from './services/marketAnalysisService';
import { assessRisk } from './services/riskManagement';
import { performTechnicalAnalysis } from './services/technicalIndicators';
import type { StockRecommendation, GroundingChunk, FilterSettings, MarketAnalysis } from './types';
import { DEFAULT_FILTER_SETTINGS } from './types';
import { LoadingIndicator } from './components/LoadingIndicator';
import { StockTable } from './components/StockTable';
import { ChartIcon } from './components/icons/ChartIcon';
import { AnalyzeIcon } from './components/icons/AnalyzeIcon';
import { GroundingSources } from './components/GroundingSources';
import { RefreshIcon } from './components/icons/RefreshIcon';
import { EnhancedDisclaimer, RiskConfirmationModal } from './components/EnhancedDisclaimer';
import { FilterSettingsPanel, loadFilterSettings } from './components/FilterSettingsPanel';
import { MarketAnalysisPanel } from './components/MarketAnalysisPanel';

const App: React.FC = () => {
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisTime, setAnalysisTime] = useState<string | null>(null);
  const [showRiskModal, setShowRiskModal] = useState<boolean>(false);
  const [hasAcceptedRisk, setHasAcceptedRisk] = useState<boolean>(false);

  // 篩選設定狀態
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(DEFAULT_FILTER_SETTINGS);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  // 市場分析狀態
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [isMarketAnalysisLoading, setIsMarketAnalysisLoading] = useState<boolean>(false);
  const [marketAnalysisError, setMarketAnalysisError] = useState<string | null>(null);

  // 初始化：載入用戶儲存的篩選設定和風險聲明狀態
  useEffect(() => {
    // 載入篩選設定
    const savedSettings = loadFilterSettings();
    setFilterSettings(savedSettings);

    // 檢查是否已接受風險聲明
    const accepted = localStorage.getItem('riskAccepted');
    if (accepted === 'true') {
      setHasAcceptedRisk(true);
    } else {
      setShowRiskModal(true);
    }
  }, []);

  // 獲取市場分析的函數
  const fetchMarketAnalysis = async () => {
    setIsMarketAnalysisLoading(true);
    setMarketAnalysisError(null);
    try {
      const analysis = await getMarketAnalysis();
      setMarketAnalysis(analysis);
    } catch (err) {
      setMarketAnalysisError(err instanceof Error ? err.message : '無法獲取市場分析');
    } finally {
      setIsMarketAnalysisLoading(false);
    }
  };

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

    // 先獲取市場分析（使用快取減少 API 配額消耗）
    // 市場分析會優先使用 30 分鐘內的快取，不會每次都呼叫 API
    fetchMarketAnalysis();

    try {
      // 使用用戶的篩選設定來獲取 AI 推薦
      const { recommendations: result, sources: groundingSources } = await getTradingRecommendations(filterSettings);
      if (result && result.length > 0) {
        // First, get the initial "live" prices for the recommendations
        const initialPrices = await fetchInitialLivePrices(result);

        // 修正不合理的進場價：entryPoint 必須接近 currentPrice（±5% 以內）
        const recommendationsWithPrice = result.map(rec => {
            const realPrice = initialPrices.get(rec.ticker) || rec.currentPrice || rec.entryPoint;
            let correctedEntryPoint = rec.entryPoint;
            let correctedExitPoint = rec.exitPoint;
            let correctedStopLoss = rec.stopLoss;

            // 檢查 entryPoint 與真實股價的差距
            const entryDiff = Math.abs(rec.entryPoint - realPrice) / realPrice;
            if (entryDiff > 0.05) {
              // 差距超過 5%，修正為真實股價的 98%（略低於現價的買點）
              console.warn(`⚠️ 修正 ${rec.stockName}(${rec.ticker}) 進場價: ${rec.entryPoint} → ${(realPrice * 0.98).toFixed(2)} (原差距 ${(entryDiff * 100).toFixed(1)}%)`);
              correctedEntryPoint = parseFloat((realPrice * 0.98).toFixed(2));

              // 同時修正出場價和止損價（維持相對比例）
              const targetProfit = filterSettings.targetProfitRate / 100;
              correctedExitPoint = parseFloat((correctedEntryPoint * (1 + targetProfit)).toFixed(2));
              correctedStopLoss = parseFloat((correctedEntryPoint * 0.95).toFixed(2)); // 止損設在 -5%
            }

            // 重新計算購買股數和預估獲利
            const correctedSharesToBuy = Math.floor(filterSettings.capital / correctedEntryPoint);
            const correctedProfitPoints = correctedExitPoint - correctedEntryPoint;
            const correctedProfitTWD = Math.round(correctedSharesToBuy * correctedProfitPoints);

            return {
              ...rec,
              currentPrice: realPrice,
              entryPoint: correctedEntryPoint,
              exitPoint: correctedExitPoint,
              stopLoss: correctedStopLoss,
              sharesToBuy: correctedSharesToBuy,
              profitPoints: correctedProfitPoints,
              profitTWD: correctedProfitTWD,
            };
        });
        
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
        // 沒有符合條件的股票，提示用戶調整篩選條件
        setError(
          `在股價 ${filterSettings.priceRange.min}~${filterSettings.priceRange.max} 元範圍內，` +
          `未找到符合條件的強勢標的。\n\n` +
          `建議：\n` +
          `1. 擴大股價範圍（例如：5~100 元）\n` +
          `2. 降低目標獲利率\n` +
          `3. 稍後再試（市場可能處於整理期）`
        );
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
    <div className="text-center p-8 bg-gray-800/50 rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-300 mb-4">歡迎使用 AI 股市分析師助理 v3.0</h2>
      <p className="text-gray-400 mb-4">
        本系統整合 <span className="font-bold text-teal-300">台灣證交所真實股價 API</span>、
        <span className="font-bold text-purple-300">AI 智能分析</span> 與
        <span className="font-bold text-orange-300">專業風險管理</span>，
        為您篩選符合個人偏好的台股標的。
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
          <p className="font-semibold text-orange-300">⚡ 自訂篩選</p>
          <p className="text-gray-400 text-xs mt-1">個人化投資偏好設定</p>
        </div>
      </div>

      {/* 篩選設定面板 */}
      <div className="text-left mb-6">
        <FilterSettingsPanel
          settings={filterSettings}
          onSettingsChange={setFilterSettings}
          isOpen={isFilterPanelOpen}
          onToggle={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
        />
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
            小七 AI 選股系統 3.0
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
              {/* 分析結果頂部：時間、篩選條件摘要、重新分析按鈕 */}
              <div className="p-4 bg-gray-800/50 rounded-lg mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-sm text-gray-300">
                    <p><span className="font-bold text-blue-300">分析完成時間：</span>{analysisTime}</p>
                    <p className="mt-1">為確保資訊即時性，建議在 <span className="font-bold">15-30 分鐘內</span> 參考此分析。</p>
                    {/* 顯示當前篩選條件 */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs">
                        股價: {filterSettings.priceRange.min}~{filterSettings.priceRange.max}元
                      </span>
                      <span className="px-2 py-0.5 bg-green-900/50 text-green-300 rounded text-xs">
                        目標: +{filterSettings.targetProfitRate}%
                      </span>
                      <span className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded text-xs">
                        本金: {(filterSettings.capital / 10000).toFixed(1)}萬
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                      className="inline-flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
                    >
                      ⚙️ 篩選設定
                    </button>
                    <button
                      onClick={handleAnalyzeClick}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
                    >
                      <RefreshIcon className="w-5 h-5 mr-2" />
                      重新分析
                    </button>
                  </div>
                </div>

                {/* 可展開的篩選設定面板 */}
                {isFilterPanelOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <FilterSettingsPanel
                      settings={filterSettings}
                      onSettingsChange={setFilterSettings}
                      isOpen={true}
                      onToggle={() => setIsFilterPanelOpen(false)}
                    />
                  </div>
                )}
              </div>

              {/* 市場分析面板 - 美股表現、聯準會政策、台股展望 */}
              <MarketAnalysisPanel
                analysis={marketAnalysis}
                isLoading={isMarketAnalysisLoading}
                error={marketAnalysisError}
                onRefresh={fetchMarketAnalysis}
              />

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
