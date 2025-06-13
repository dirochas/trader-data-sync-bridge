
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradeHistory } from '@/hooks/useTradingData';

const TradeHistory = () => {
  const { data: trades = [], isLoading, error } = useTradeHistory();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-gray-600">🕐</span>
            Histórico de Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-gray-600">🕐</span>
          Histórico de Trades ({trades.length})
          {trades.length > 0 && <span className="text-xs text-green-600">🟢 LIVE</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="text-left py-2">Ticket</th>
                <th className="text-left py-2">Símbolo</th>
                <th className="text-left py-2">Tipo</th>
                <th className="text-right py-2">Volume</th>
                <th className="text-right py-2">Abertura</th>
                <th className="text-right py-2">Fechamento</th>
                <th className="text-right py-2">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.ticket} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-mono text-xs">{trade.ticket}</td>
                  <td className="py-3 font-semibold">{trade.symbol}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.type === 'BUY' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      ➚ {trade.type}
                    </span>
                  </td>
                  <td className="py-3 text-right">{Number(trade.volume).toFixed(2)}</td>
                  <td className="py-3 text-right font-mono">{Number(trade.open_price).toFixed(5)}</td>
                  <td className="py-3 text-right font-mono">{Number(trade.close_price).toFixed(5)}</td>
                  <td className={`py-3 text-right font-bold ${
                    Number(trade.profit) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    US$ {Number(trade.profit).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {trades.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              Nenhum histórico de trades disponível
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeHistory;
