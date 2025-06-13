
import React from 'react';
import { useParams } from 'react-router-dom';
import TradingHeader from '@/components/TradingHeader';
import AccountInfo from '@/components/AccountInfo';
import MarginInfo from '@/components/MarginInfo';
import OpenPositions from '@/components/OpenPositions';
import TradeHistory from '@/components/TradeHistory';
import { useRealtimeUpdates } from '@/hooks/useTradingData';

const AccountDetails = () => {
  const { accountId } = useParams();
  
  // Configurar atualizações em tempo real
  useRealtimeUpdates();

  return (
    <div className="min-h-screen bg-gray-50">
      <TradingHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <a href="/" className="hover:text-blue-600">Account Monitor</a>
          <span>{'>'}</span>
          <span className="text-gray-900 font-medium">Account Details #{accountId}</span>
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
      </div>
      
      {/* Footer com informação sobre integração */}
      <div className="bg-green-50 border-t border-green-200 p-4 mt-8">
        <div className="max-w-7xl mx-auto text-center">
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
