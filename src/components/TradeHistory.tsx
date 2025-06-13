
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TradeHistory = () => {
  // Dados de exemplo - serão substituídos pelos dados reais do MT4/MT5
  const trades = [
    {
      ticket: 123458,
      symbol: "EURUSD",
      type: "BUY",
      volume: 0.1,
      openPrice: 1.08200,
      closePrice: 1.08350,
      openTime: "2024-06-13 14:30",
      closeTime: "2024-06-13 15:45",
      profit: 15.0
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-gray-600">🕐</span>
          Histórico de Trades ({trades.length})
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
                  <td className="py-3 text-right">{trade.volume}</td>
                  <td className="py-3 text-right font-mono">{trade.openPrice.toFixed(5)}</td>
                  <td className="py-3 text-right font-mono">{trade.closePrice.toFixed(5)}</td>
                  <td className={`py-3 text-right font-bold ${
                    trade.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    US$ {trade.profit.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Navegação */}
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">◀</button>
          <div className="h-2 flex-1 bg-gray-200 rounded-full">
            <div className="h-full w-1/4 bg-blue-500 rounded-full"></div>
          </div>
          <button className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">▶</button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeHistory;
