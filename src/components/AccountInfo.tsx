
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AccountInfo = () => {
  // Dados de exemplo - serão substituídos pelos dados reais do MT4/MT5
  const accountData = {
    accountNumber: "12345678",
    server: "MetaQuotes-Demo",
    balance: 10000.50,
    equity: 10150.75,
    profitLoss: 150.25
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-gray-600">👤</span>
          Informações da Conta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-600 font-medium">Conta</span>
            <span className="font-mono text-sm">{accountData.accountNumber}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Servidor</span>
            <span className="text-sm">{accountData.server}</span>
          </div>
          
          <div className="border-t pt-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1">
                💰 Balance
              </span>
              <span className="text-lg font-bold text-green-600">
                US$ {accountData.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1">
                📈 Equity
              </span>
              <span className="text-lg font-bold text-blue-600">
                US$ {accountData.equity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1">
                📊 Lucro/Prejuízo
              </span>
              <span className={`text-lg font-bold ${accountData.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                US$ {accountData.profitLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountInfo;
