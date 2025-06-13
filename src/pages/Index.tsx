
import React from 'react';
import TradingHeader from '@/components/TradingHeader';
import AccountInfo from '@/components/AccountInfo';
import MarginInfo from '@/components/MarginInfo';
import OpenPositions from '@/components/OpenPositions';
import TradeHistory from '@/components/TradeHistory';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TradingHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
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
      </div>
      
      {/* Footer com informação sobre integração */}
      <div className="bg-blue-50 border-t border-blue-200 p-4 mt-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-blue-700">
            🔄 <strong>Status:</strong> Dados de exemplo - Aguardando integração com Supabase e Expert Advisor MT4/MT5
          </p>
          <p className="text-xs text-blue-600 mt-1">
            O código MQL4 está preparado para enviar dados reais quando a conexão for estabelecida
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
