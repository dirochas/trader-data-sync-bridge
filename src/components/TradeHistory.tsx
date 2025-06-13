import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTradeHistory } from '@/hooks/useTradingData';
import { usePagination } from '@/hooks/usePagination';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis 
} from '@/components/ui/pagination';

interface TradeHistoryProps {
  accountNumber?: string;
}

const TradeHistory = ({ accountNumber }: TradeHistoryProps) => {
  const { data: trades = [], isLoading, error } = useTradeHistory(accountNumber);
  const { currentPage, totalPages, paginatedData, goToPage, nextPage, previousPage } = usePagination(trades, 10);

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Símbolo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Abertura</TableHead>
                <TableHead className="text-right">Fechamento</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((trade) => (
                <TableRow key={`${trade.ticket}-${trade.close_time}`}>
                  <TableCell className="font-mono text-xs">{trade.ticket}</TableCell>
                  <TableCell className="font-semibold">{trade.symbol}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.type === 'BUY' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {trade.type === 'BUY' ? '↗ BUY' : '↙ SELL'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{Number(trade.volume).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{Number(trade.open_price).toFixed(5)}</TableCell>
                  <TableCell className="text-right font-mono">{Number(trade.close_price).toFixed(5)}</TableCell>
                  <TableCell className={`text-right font-bold ${
                    Number(trade.profit) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    US$ {Number(trade.profit).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {trades.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>Nenhum histórico de trades disponível</p>
              <p className="text-sm text-gray-400 mt-1">O histórico aparecerá quando houver trades fechados</p>
            </div>
          )}
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={previousPage}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => goToPage(pageNumber)}
                          isActive={currentPage === pageNumber}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={nextPage}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeHistory;
