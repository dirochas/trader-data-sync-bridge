
import React from 'react';
import { getConnectionStatus } from '@/hooks/useTradingData';

interface ConnectionStatusProps {
  lastUpdate: string;
  className?: string;
}

const ConnectionStatus = ({ lastUpdate, className = "" }: ConnectionStatusProps) => {
  const connectionInfo = getConnectionStatus(lastUpdate);
  const displayStatus = connectionInfo.status === 'Disconnected' ? 'Offline' : connectionInfo.status;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span>{connectionInfo.icon}</span>
      <span className={`text-sm font-medium ${connectionInfo.color}`}>
        {displayStatus}
      </span>
    </div>
  );
};

export default ConnectionStatus;
