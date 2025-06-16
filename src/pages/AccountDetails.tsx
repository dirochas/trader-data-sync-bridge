
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
          <span className="text-foreground font-medium">Account Details #{accountId}</span>
        </div>
        <Button variant="outline" onClick={() => navigate('/')}>
          ← Back to Monitor
        </Button>
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
