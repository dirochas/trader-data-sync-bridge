
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const MarginInfo = () => {
  // Dados de exemplo - serão substituídos pelos dados reais do MT4/MT5
  const marginData = {
    usedMargin: 2500.00,
    freeMargin: 7650.75,
    marginLevel: 406.03,
    totalAvailable: 10150.75
  };

  const marginUsagePercentage = (marginData.usedMargin / marginData.totalAvailable) * 100;

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-gray-600">⏱️</span>
          Informações de Margem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 mb-1">Margem Usada</p>
            <p className="text-lg font-bold text-red-600">
              US$ {marginData.usedMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-1">Margem Livre</p>
            <p className="text-lg font-bold text-green-600">
              US$ {marginData.freeMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-1">Nível de Margem</p>
            <p className="text-lg font-bold text-blue-600">
              {marginData.marginLevel.toFixed(2)}%
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uso da Margem</span>
            <span>{marginUsagePercentage.toFixed(1)}%</span>
          </div>
          <Progress value={marginUsagePercentage} className="h-2" />
          <p className="text-xs text-gray-500 text-center">
            Total disponível: US$ {marginData.totalAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarginInfo;
