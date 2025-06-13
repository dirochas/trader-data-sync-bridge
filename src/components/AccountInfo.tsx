
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradingAccount } from '@/hooks/useTradingData';

const AccountInfo = () => {
  const { data: accountData, isLoading, error } = useTradingAccount();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-gray-600">👤</span>
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-gray-600">👤</span>
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Erro ao carregar dados da conta</p>
        </CardContent>
      </Card>
    );
  }

  // Dados padrão caso não haja dados do Supabase
  const defaultData = {
    account_number: "12345678",
    server: "MetaQuotes-Demo",
    balance: 10000.50,
    equity: 10150.75,
    profit: 150.25
  };

  const data = accountData || defaultData;

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-gray-600">👤</span>
          Informações da Conta
          {accountData && <span className="text-xs text-green-600">🟢 LIVE</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-600 font-medium">Conta</span>
            <span className="font-mono text-sm">{data.account_number}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Servidor</span>
            <span className="text-sm">{data.server}</span>
          </div>
          
          <div className="border-t pt-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1">
                💰 Balance
              </span>
              <span className="text-lg font-bold text-green-600">
                US$ {Number(data.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1">
                📈 Equity
              </span>
              <span className="text-lg font-bold text-blue-600">
                US$ {Number(data.equity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1">
                📊 Lucro/Prejuízo
              </span>
              <span className={`text-lg font-bold ${Number(data.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                US$ {Number(data.profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountInfo;
