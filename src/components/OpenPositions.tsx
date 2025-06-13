
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OpenPositions = () => {
  // Dados de exemplo - serão substituídos pelos dados reais do MT4/MT5
  const positions = [
    {
      ticket: 123456,
      symbol: "EURUSD",
      type: "BUY",
      volume: 0.1,
      openPrice: 1.08500,
      currentPrice: 1.08650,
      profit: 15.00
    },
    {
      ticket: 123457,
      symbol: "GBPUSD",
      type: "SELL",
      volume: 0.05,
      openPrice: 1.27800,
      currentPrice: 1.27650,
      profit: 7.50
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-gray-600">📊</span>
          Posições Abertas ({positions.length})
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
                <th className="text-right py-2">Preço</th>
                <th className="text-right py-2">Atual</th>
                <th className="text-right py-2">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.ticket} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-mono text-xs">{position.ticket}</td>
                  <td className="py-3 font-semibold">{position.symbol}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      position.type === 'BUY' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      ➚ {position.type}
                    </span>
                  </td>
                  <td className="py-3 text-right">{position.volume}</td>
                  <td className="py-3 text-right font-mono">{position.openPrice.toFixed(5)}</td>
                  <td className="py-3 text-right font-mono">{position.currentPrice.toFixed(5)}</td>
                  <td className={`py-3 text-right font-bold ${
                    position.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    US$ {position.profit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenPositions;
