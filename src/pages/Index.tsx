
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import AccountInfo from '@/components/AccountInfo';
import MarginInfo from '@/components/MarginInfo';
import OpenPositions from '@/components/OpenPositions';
import TradeHistory from '@/components/TradeHistory';
import { useRealtimeUpdates } from '@/hooks/useTradingData';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { profile } = useAuth();
  useRealtimeUpdates();

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Monitor</h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo, {profile?.first_name || profile?.email}! 
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {profile?.role}
              </span>
            </p>
          </div>
        </div>
        
        {/* Row 1: Account Info and Margin Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AccountInfo />
          <MarginInfo />
        </div>
        
        {/* Row 2: Open Positions and Trade History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OpenPositions />
          <TradeHistory />
        </div>
        
        {/* Footer com informação sobre integração */}
        <div className="bg-green-50 border-t border-green-200 p-4 mt-8 rounded-lg">
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
    </AppLayout>
  );
};

export default Index;
