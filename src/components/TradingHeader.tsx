
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TradingHeader = () => {
  const lastUpdate = new Date().toLocaleTimeString('pt-BR');
  const navigate = useNavigate();
  const location = useLocation();

  const isAccountDetails = location.pathname.includes('/account/');

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Trading Dashboard MT4/MT5</h1>
          {isAccountDetails && (
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Voltar para Monitor
            </Button>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Última atualização: {lastUpdate}</p>
        </div>
      </div>
    </div>
  );
};

export default TradingHeader;
