import React from 'react';
// FIX: Aliased the imported type `BacktestResult` to `BacktestResultType` to resolve the name conflict with the component.
import type { BacktestResult as BacktestResultType } from '../types';

interface BacktestResultProps {
  result: BacktestResultType;
}

const StatCard: React.FC<{ label: string; value: string | number; colorClass: string }> = ({ label, value, colorClass }) => (
    <div className="bg-gray-800 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-400">{label}</p>
        <p className={`text-2xl font-bold font-mono ${colorClass}`}>{value}</p>
    </div>
);

export const BacktestResult: React.FC<BacktestResultProps> = ({ result }) => {
    const profitColor = result.totalProfitPoints > 0 ? 'text-green-400' : result.totalProfitPoints < 0 ? 'text-red-400' : 'text-gray-300';
    const winRateColor = result.winRate >= 50 ? 'text-green-400' : result.winRate > 0 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700 animate-fade-in">
            <h5 className="font-bold text-gray-200 mb-4 text-center text-lg">90日當沖策略回測結果</h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard label="總損益 (點)" value={result.totalProfitPoints.toFixed(2)} colorClass={profitColor} />
                <StatCard label="勝率" value={`${result.winRate.toFixed(2)}%`} colorClass={winRateColor} />
                <StatCard label="總交易次數" value={result.totalTrades} colorClass="text-blue-300" />
            </div>

            {result.trades.length > 0 && (
                 <div className="max-h-60 overflow-y-auto pr-2">
                    <table className="min-w-full text-xs text-left">
                        <thead className="text-gray-400 uppercase bg-gray-800 sticky top-0">
                            <tr>
                                <th className="px-4 py-2">日期</th>
                                <th className="px-4 py-2 text-right">進場</th>
                                <th className="px-4 py-2 text-right">出場</th>
                                <th className="px-4 py-2 text-right">損益(點)</th>
                                <th className="px-4 py-2 text-center">結果</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800/50">
                            {result.trades.map((trade, index) => (
                                <tr key={index} className="border-b border-gray-700">
                                    <td className="px-4 py-2 font-mono text-gray-400">{new Date(trade.entryDate).toLocaleDateString('en-CA')}</td>
                                    <td className="px-4 py-2 font-mono text-right">{trade.entryPrice.toFixed(2)}</td>
                                    <td className="px-4 py-2 font-mono text-right">{trade.exitPrice.toFixed(2)}</td>
                                    <td className={`px-4 py-2 font-mono text-right font-semibold ${trade.profit > 0 ? 'text-green-400' : trade.profit < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                        {trade.profit.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            trade.result === 'Win' ? 'bg-green-500/20 text-green-300' :
                                            trade.result === 'Loss' ? 'bg-red-500/20 text-red-300' :
                                            'bg-gray-500/20 text-gray-300'
                                        }`}>
                                            {trade.result}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};