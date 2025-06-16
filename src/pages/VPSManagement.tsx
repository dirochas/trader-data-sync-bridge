
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VPSManagement = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">VPS Management</h1>
          <p className="text-muted-foreground">
            Gerenciamento de servidores VPS e infraestrutura
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add VPS
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Server className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">VPS Management System</h3>
            <p className="text-muted-foreground mb-6">
              Sistema completo de gerenciamento de VPS e infraestrutura será implementado aqui.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Monitoramento de VPS em tempo real</p>
              <p>• Gestão de recursos e performance</p>
              <p>• Configuração de ambientes MT4/MT5</p>
              <p>• Controle de custos e otimização</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VPSManagement;
