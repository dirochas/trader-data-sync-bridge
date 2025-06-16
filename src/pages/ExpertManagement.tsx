
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ExpertManagement = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Expert Management</h1>
          <p className="text-muted-foreground">
            Gerenciamento de Expert Advisors, estratégias e backtests
          </p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload EA
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Expert Advisor Management</h3>
            <p className="text-muted-foreground mb-6">
              Sistema completo de gerenciamento de EAs, estratégias e análise de performance será implementado aqui.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Upload e configuração de Expert Advisors</p>
              <p>• Gestão de estratégias e parâmetros</p>
              <p>• Análise de backtests e resultados</p>
              <p>• Otimização de estratégias</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpertManagement;
