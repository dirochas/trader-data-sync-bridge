
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
          <button onClick={() => navigate('/accounts')} className="hover:text-primary">
            Account Monitor
          </button>
          <span>{'>'}</span>
          <span className="text-white font-medium">Account Details #{accountId}</span>
        </div>
        <Button variant="outline" onClick={() => navigate('/accounts')}>
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

        {/* Card 4 - P&L - Vermelho claro refinado */}
        <Card className="tech-card tech-card-hover border-rose-400/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">P&L</CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/20 flex items-center justify-center flex-shrink-0 border border-rose-500/20">
              <Activity className="h-7 w-7 text-rose-400" />
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
      
      {/* Footer moderno com padrão tech-card */}
      <Card className="tech-card border-emerald-400/20">
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-400">Status: Integração Supabase ATIVA</span>
              </div>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-white">Dados em tempo real</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-sky-400 font-medium">Endpoint MT4/MT5:</span>
                <code className="bg-muted/20 px-2 py-1 rounded text-xs text-muted-foreground">
                  https://kgrlcsimdszbrkcwjpke.supabase.co/functions/v1/trading-data
                </code>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure seu Expert Advisor com este endpoint para começar a enviar dados reais
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountDetails;
