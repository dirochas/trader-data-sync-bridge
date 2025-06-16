
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import { useTradingAccount } from '@/hooks/useTradingData';

interface AccountInfoProps {
  accountNumber?: string;
}

const AccountInfo = ({ accountNumber }: AccountInfoProps) => {
  const { data: accountData, isLoading, error } = useTradingAccount(accountNumber);

  if (isLoading) {
    return (
      <Card className="tech-card h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <User className="text-sky-400" />
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

  if (!accountData) {
    return (
      <Card className="tech-card h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <User className="text-sky-400" />
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔄</div>
            <p>Aguardando dados da conta...</p>
            <p className="text-sm text-gray-400 mt-1">Os dados aparecerão quando o EA enviar informações</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const balance = Number(accountData.balance);
  const equity = Number(accountData.equity);
  const profit = Number(accountData.profit);

  return (
    <Card className="tech-card h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <User className="text-sky-400" />
          Informações da Conta
          <span className="text-xs text-emerald-400">🟢 LIVE</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-sky-400 font-medium">Conta</span>
            <span className="font-mono text-sm text-white">{accountData.account}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Servidor</span>
            <span className="text-sm text-white">{accountData.server}</span>
          </div>
          
          <div className="border-t border-border/30 pt-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1 text-white">
                💰 Balance
              </span>
              <span className="text-lg font-bold text-emerald-400">
                US$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1 text-white">
                📈 Equity
              </span>
              <span className="text-lg font-bold text-sky-400">
                US$ {equity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1 text-white">
                📊 Lucro/Prejuízo
              </span>
              <span className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-300'}`}>
                US$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountInfo;
