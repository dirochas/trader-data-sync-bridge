
import React from 'react';

const TradingHeader = () => {
  const lastUpdate = new Date().toLocaleTimeString('pt-BR');

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trading Dashboard MT4/MT5</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Última atualização: {lastUpdate}</p>
        </div>
      </div>
    </div>
  );
};

export default TradingHeader;
