
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, DollarSign, BarChart3, Activity } from 'lucide-react';
import AccountInfo from '@/components/AccountInfo';
import MarginInfo from '@/components/MarginInfo';
import OpenPositions from '@/components/OpenPositions';
import TradeHistory from '@/components/TradeHistory';
import { useRealtimeUpdates } from '@/hooks/useTradingData';

const AccountDetails = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  
  // Configurar atualizações em tempo real
  useRealtimeUpdates();

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate('/')} className="hover:text-primary">
            Account Monitor
          </button>
          <span>{'>'}</span>
          <span className="text-white font-medium">Account Details #{accountId}</span>
        </div>
        <Button variant="outline" onClick={() => navigate('/')}>
          ← Back to Monitor
        </Button>
      </div>

      {/* Modern Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 - Account Info Summary - Azul */}
        <Card className="tech-card tech-card-hover border-sky-400/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Account</CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/20 flex items-center justify-center flex-shrink-0 border border-sky-500/20">
              <User className="h-7 w-7 text-sky-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold number-display text-foreground">#{accountId}</div>
            <p className="text-xs text-emerald-400">
              🟢 LIVE Connection
            </p>
          </CardContent>
        </Card>

        {/* Card 2 - Balance - Roxo */}
        <Card className="tech-card tech-card-hover border-purple-400/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Balance</CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
              <DollarSign className="h-7 w-7 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold number-display text-emerald-400">US$ 51,583</div>
            <p className="text-xs text-muted-foreground">
              Account balance
            </p>
          </CardContent>
        </Card>

        {/* Card 3 - Equity - Verde */}
        <Card className="tech-card tech-card-hover border-emerald-400/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Equity</CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
              <BarChart3 className="h-7 w-7 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold number-display text-sky-400">US$ 51,523</div>
            <p className="text-xs text-muted-foreground">
              Current equity
            </p>
          </CardContent>
        </Card>

        {/* Card 4 - P&L - Amarelo */}
        <Card className="tech-card tech-card-hover border-amber-400/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">P&L</CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
              <Activity className="h-7 w-7 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold number-display text-rose-300">-US$ 60.02</div>
            <p className="text-xs text-muted-foreground">
              Current profit/loss
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Account Info and Margin Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountInfo accountNumber={accountId} />
        <MarginInfo accountNumber={accountId} />
      </div>
      
      {/* Row 2: Open Positions and Trade History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OpenPositions accountNumber={accountId} />
        <TradeHistory accountNumber={accountId} />
      </div>
      
      {/* Footer com informação sobre integração */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="text-center">
          <p className="text-sm text-green-700">
            🟢 <strong>Status:</strong> Integração Supabase ATIVA - Dados em tempo real
          </p>
          <p className="text-xs text-green-600 mt-1">
            <strong>Endpoint MT4/MT5:</strong> https://kgrlcsimdszbrkcwjpke.supabase.co/functions/v1/trading-data
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Configure seu Expert Advisor com este endpoint para começar a enviar dados reais
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;
