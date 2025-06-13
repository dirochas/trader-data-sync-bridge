
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Símbolo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Atual</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={position.ticket}>
                  <TableCell className="font-mono text-xs">{position.ticket}</TableCell>
                  <TableCell className="font-semibold">{position.symbol}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      position.type === 'BUY' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {position.type === 'BUY' ? '↗ BUY' : '↙ SELL'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{Number(position.volume).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{Number(position.open_price).toFixed(5)}</TableCell>
                  <TableCell className="text-right font-mono">{Number(position.current_price).toFixed(5)}</TableCell>
                  <TableCell className={`text-right font-bold ${
                    Number(position.profit) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    US$ {Number(position.profit).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {positions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📈</div>
              <p>Nenhuma posição aberta no momento</p>
              <p className="text-sm text-gray-400 mt-1">As posições abertas aparecerão aqui automaticamente</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenPositions;
