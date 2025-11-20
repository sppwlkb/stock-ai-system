import React, { useEffect, useRef, useMemo, memo } from 'react';
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

  // Generate a unique ID for the widget container to avoid conflicts
  const containerId = useMemo(() => `tradingview_widget_${ticker}_${Math.random().toString(36).substring(2, 9)}`, [ticker]);

  useEffect(() => {
    // Ensure the TradingView script is loaded and the container is available
    if (!chartContainerRef.current || typeof window.TradingView === 'undefined' || !window.TradingView.widget) {
      return;
    }
    
    const createWidget = () => {
        // Double-check that the container still exists when the timeout fires
        if (!chartContainerRef.current) {
            return;
        }

        const widgetOptions = {
            autosize: true,
            symbol: `${exchange}:${ticker}`,
            interval: 'D',
            timezone: 'Asia/Taipei',
            theme: 'dark',
            style: '1', // Candlesticks
            locale: 'zh_TW',
            toolbar_bg: '#1f2937',
            enable_publishing: false,
            hide_side_toolbar: true,
            allow_symbol_change: false,
            container_id: containerId,
            studies: [
                'MASimple@tv-basicstudies',
                'MASimple@tv-basicstudies',
            ],
            studies_overrides: {
                "volume.volume.color.0": "#ef4444",
                "volume.volume.color.1": "#10b981",
                "MASimple.inputs.Length": 5,
                "MASimple.plot.color": "#22d3ee",
                "MASimple.inputs.Length.1": 20,
                "MASimple.plot.color.1": "#a78bfa",
            },
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

        widget.onChartReady(() => {
            if (!widgetRef.current) return;
            const chart = widget.chart();
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
        });
    };
    
    // Delay widget creation to allow the container to be rendered and sized correctly,
    // especially when revealed by a CSS transition, preventing a black screen.
    const timerId = setTimeout(createWidget, 150);

    return () => {
      clearTimeout(timerId);
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
          widgetRef.current = null;
        } catch (error) {
          console.error("Error removing TradingView widget:", error);
        }
      }
    };
  }, [containerId, exchange, entryPoint, exitPoint, ticker]);

  return (
    <div className="my-4 h-96 w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      <div id={containerId} ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

// Memoize the component to prevent re-renders unless props change
export default memo(StockChart);