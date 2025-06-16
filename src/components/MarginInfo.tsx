
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';
import { useMarginInfo } from '@/hooks/useTradingData';

interface MarginInfoProps {
  accountNumber?: string;
}

const MarginInfo = ({ accountNumber }: MarginInfoProps) => {
  const { data: marginData, isLoading, error } = useMarginInfo(accountNumber);

  if (isLoading) {
    return (
      <Card className="tech-card h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <BarChart3 className="text-purple-400" />
            Informações de Margem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!marginData) {
    return (
      <Card className="tech-card h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <BarChart3 className="text-purple-400" />
            Informações de Margem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">⏳</div>
            <p>Aguardando dados de margem...</p>
            <p className="text-sm text-gray-400 mt-1">Os dados aparecerão quando o EA enviar informações</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usedMargin = Number(marginData.used);
  const freeMargin = Number(marginData.free);
  const marginLevel = Number(marginData.level);
  const totalAvailable = usedMargin + freeMargin;
  const marginUsagePercentage = totalAvailable > 0 ? (usedMargin / totalAvailable) * 100 : 0;

  return (
    <Card className="tech-card h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <BarChart3 className="text-purple-400" />
          Informações de Margem
          <span className="text-xs text-emerald-400">🟢 LIVE</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Margem Usada</p>
            <p className="text-lg font-bold text-rose-300">
              US$ {usedMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Margem Livre</p>
            <p className="text-lg font-bold text-emerald-400">
              US$ {freeMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Nível de Margem</p>
            <p className="text-lg font-bold text-sky-400">
              {marginLevel.toFixed(2)}%
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white">Uso da Margem</span>
            <span className="text-white">{marginUsagePercentage.toFixed(1)}%</span>
          </div>
          <Progress value={marginUsagePercentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Total disponível: US$ {totalAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarginInfo;
