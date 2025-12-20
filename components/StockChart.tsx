import React, { useEffect, useRef, useMemo, memo, useState } from 'react';
import type { HistoricalDataPoint } from '../types';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface StockChartProps {
  ticker: string;
  exchange: 'TWSE' | 'TPEX';
  entryPoint: number;
  exitPoint: number;
  historicalData: HistoricalDataPoint[]; // This prop is kept for API compatibility but is no longer used for rendering.
}

const StockChart: React.FC<StockChartProps> = ({ ticker, exchange, entryPoint, exitPoint }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const isChartReadyRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  // Generate a unique ID for the widget container to avoid conflicts
  const containerId = useMemo(() => `tradingview_widget_${ticker}_${Math.random().toString(36).substring(2, 9)}`, [ticker]);

  useEffect(() => {
    // 標記組件已掛載
    isMountedRef.current = true;
    isChartReadyRef.current = false;

    // Ensure the TradingView script is loaded and the container is available
    if (!chartContainerRef.current || typeof window.TradingView === 'undefined' || !window.TradingView.widget) {
      setIsLoading(false);
      return;
    }

    const createWidget = () => {
        // Double-check that the container still exists and component is still mounted
        if (!chartContainerRef.current || !isMountedRef.current) {
            return;
        }

        // 確保容器元素存在於 DOM 中
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`TradingView container ${containerId} not found in DOM`);
            return;
        }

        try {
            // 台股符號格式：TWSE:2303 或 TPEX:xxxx
            const tvSymbol = `${exchange}:${ticker}`;
            console.log(`📊 TradingView 載入股票: ${tvSymbol}`);

            const widgetOptions = {
                autosize: true,
                symbol: tvSymbol,
                interval: 'D',
                timezone: 'Asia/Taipei',
                theme: 'dark',
                style: '1', // Candlesticks
                locale: 'zh_TW',
                toolbar_bg: '#1f2937',
                enable_publishing: false,
                hide_side_toolbar: false, // 顯示側邊工具列讓用戶可以切換指標
                allow_symbol_change: true, // 允許用戶搜尋其他股票
                container_id: containerId,
                // 移除 studies 配置，因為免費版可能不支持
                // 用戶可以自己在圖表上添加指標
                overrides: {
                    "paneProperties.background": "#111827",
                    "paneProperties.vertGridProperties.color": "#374151",
                    "paneProperties.horzGridProperties.color": "#374151",
                    "symbolWatermarkProperties.transparency": 90,
                    "scalesProperties.textColor": "#d1d5db",
                    "mainSeriesProperties.candleStyle.upColor": "#10B981",
                    "mainSeriesProperties.candleStyle.downColor": "#EF4444",
                    "mainSeriesProperties.candleStyle.borderUpColor": "#10B981",
                    "mainSeriesProperties.candleStyle.borderDownColor": "#EF4444",
                    "mainSeriesProperties.candleStyle.wickUpColor": "#10B981",
                    "mainSeriesProperties.candleStyle.wickDownColor": "#EF4444",
                },
            };

            const widget = new window.TradingView.widget(widgetOptions);
            widgetRef.current = widget;

            // 安全地調用 onChartReady
            if (widget && typeof widget.onChartReady === 'function') {
                widget.onChartReady(() => {
                    // 檢查組件是否仍然掛載
                    if (!isMountedRef.current || !widgetRef.current) {
                        return;
                    }

                    isChartReadyRef.current = true;
                    setIsLoading(false);

                    try {
                        const chart = widget.chart();
                        if (chart && typeof chart.createPriceLine === 'function') {
                            chart.createPriceLine({
                                price: entryPoint,
                                color: '#34d399',
                                lineWidth: 2,
                                lineStyle: 2, // 2 = Dashed
                                axisLabelVisible: true,
                                title: '進場點',
                            });
                            chart.createPriceLine({
                                price: exitPoint,
                                color: '#fbbf24',
                                lineWidth: 2,
                                lineStyle: 2, // 2 = Dashed
                                axisLabelVisible: true,
                                title: '出場點',
                            });
                        }
                    } catch (chartError) {
                        console.warn('Error creating price lines:', chartError);
                    }
                });
            } else {
                // 如果 onChartReady 不可用，設置一個超時
                console.warn('TradingView widget.onChartReady is not available');
                setTimeout(() => {
                    if (isMountedRef.current) {
                        setIsLoading(false);
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Error creating TradingView widget:', error);
            setIsLoading(false);
        }
    };

    // Delay widget creation to allow the container to be rendered and sized correctly
    const timerId = setTimeout(createWidget, 200);

    return () => {
      // 標記組件已卸載
      isMountedRef.current = false;
      clearTimeout(timerId);

      // 安全地移除 widget
      if (widgetRef.current) {
        try {
          // 檢查 widget 是否有 remove 方法且容器仍存在
          const container = document.getElementById(containerId);
          if (container && container.parentNode && typeof widgetRef.current.remove === 'function') {
            widgetRef.current.remove();
          }
        } catch (error) {
          // 靜默處理錯誤，避免污染控制台
          // console.warn("TradingView widget cleanup:", error);
        } finally {
          widgetRef.current = null;
          isChartReadyRef.current = false;
        }
      }
    };
  }, [containerId, exchange, entryPoint, exitPoint, ticker]);

  // 外部 K 線圖連結（備用方案）
  const yahooUrl = `https://tw.stock.yahoo.com/quote/${ticker}.TW/technical-analysis`;
  const cnyesUrl = `https://www.cnyes.com/twstock/${ticker}`;
  const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=${exchange}:${ticker}`;

  return (
    <div className="my-4 w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      {/* TradingView 圖表區域 */}
      <div className="h-96 relative">
        {/* 載入指示器 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-400 text-sm">載入 {exchange}:{ticker} 圖表中...</span>
            </div>
          </div>
        )}
        <div id={containerId} ref={chartContainerRef} className="w-full h-full" />
      </div>

      {/* 外部圖表連結（備用方案） */}
      <div className="p-3 bg-gray-800 border-t border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-gray-400 text-sm">📈 查看更多圖表：</span>
          <div className="flex gap-2 flex-wrap">
            <a
              href={tradingViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              TradingView
            </a>
            <a
              href={yahooUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
            >
              Yahoo 技術分析
            </a>
            <a
              href={cnyesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
            >
              鉅亨網
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize the component to prevent re-renders unless props change
export default memo(StockChart);