
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SimulationManagement = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Simulation Management</h1>
          <p className="text-muted-foreground">
            HedgeSimulator - Simulações de hedge para PropFirms
          </p>
        </div>
        <Button>
          <Play className="w-4 h-4 mr-2" />
          New Simulation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            HedgeSimulator Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Hedge Simulation System</h3>
            <p className="text-muted-foreground mb-6">
              Sistema avançado de simulação de hedge para PropFirms será implementado aqui.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Simulação completa de fases PropFirm</p>
              <p>• Cálculo de lot ratios e custos</p>
              <p>• Análise de ROI e drawdown</p>
              <p>• Gestão de contas reais vs mesa</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimulationManagement;
