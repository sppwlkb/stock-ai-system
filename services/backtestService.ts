import type { StockRecommendation, HistoricalDataPoint, BacktestResult, Trade } from '../types';

/**
 * Simulates a day-trading strategy over historical data.
 * 
 * Strategy rules:
 * 1. A trade is entered if the day's low is at or below the entry point.
 * 2. The trade is entered at the specified entry point.
 * 3. On the same day, we check for an exit.
 * 4. If the day's high reaches the exit point, it's a win.
 * 5. If the day's low reaches the stop-loss point, it's a loss.
 * 6. If neither is hit, the position is closed at the day's closing price.
 */
export const runBacktest = (strategy: StockRecommendation): BacktestResult => {
  const { historicalData, entryPoint, exitPoint, stopLoss } = strategy;
  const trades: Trade[] = [];
  let wins = 0;

  if (!historicalData || historicalData.length === 0) {
    return { totalProfitPoints: 0, winRate: 0, totalTrades: 0, trades: [] };
  }

  historicalData.forEach((day: HistoricalDataPoint) => {
    // Condition to enter a trade: price must dip to or below entry point, but not gap below the stop loss
    if (day.low <= entryPoint && day.open > stopLoss) {
      const entryPrice = entryPoint;
      let exitPrice: number;
      
      // Check for exit conditions on the same day
      // Priority: Exit Point (Win) > Stop Loss (Loss)
      if (day.high >= exitPoint) {
        exitPrice = exitPoint; // Win
      } else if (day.low <= stopLoss) {
        exitPrice = stopLoss; // Loss
      } else {
        exitPrice = day.close; // Closed at end of day
      }

      const profit = exitPrice - entryPrice;
      let result: 'Win' | 'Loss' | 'Neutral' = 'Neutral';
      if (profit > 0) {
        result = 'Win';
        wins++;
      } else if (profit < 0) {
        result = 'Loss';
      }

      trades.push({
        entryDate: day.date,
        exitDate: day.date,
        entryPrice,
        exitPrice,
        profit: parseFloat(profit.toFixed(2)),
        result,
      });
    }
  });

  const totalTrades = trades.length;
  const totalProfitPoints = trades.reduce((sum, trade) => sum + trade.profit, 0);
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  return {
    totalProfitPoints: parseFloat(totalProfitPoints.toFixed(2)),
    winRate: parseFloat(winRate.toFixed(2)),
    totalTrades,
    trades,
  };
};
