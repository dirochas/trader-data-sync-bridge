
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOpenPositions } from '@/hooks/useTradingData';

const OpenPositions = () => {
  const { data: positions = [], isLoading, error } = useOpenPositions();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-gray-600">📊</span>
            Posições Abertas
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
          <span className="text-gray-600">📊</span>
          Posições Abertas ({positions.length})
          {positions.length > 0 && <span className="text-xs text-green-600">🟢 LIVE</span>}
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
                  <td className="py-3 text-right">{Number(position.volume).toFixed(2)}</td>
                  <td className="py-3 text-right font-mono">{Number(position.open_price).toFixed(5)}</td>
                  <td className="py-3 text-right font-mono">{Number(position.current_price).toFixed(5)}</td>
                  <td className={`py-3 text-right font-bold ${
                    Number(position.profit) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    US$ {Number(position.profit).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {positions.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              Nenhuma posição aberta no momento
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenPositions;
