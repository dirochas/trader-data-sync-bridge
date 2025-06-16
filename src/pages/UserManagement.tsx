
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UserManagement = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Gerenciamento de usuários, clientes e permissões
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">User Management System</h3>
            <p className="text-muted-foreground mb-6">
              Sistema completo de gerenciamento de usuários, clientes traders e investidores será implementado aqui.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Cadastro e edição de usuários</p>
              <p>• Gestão de clientes (Traders/Investors)</p>
              <p>• Sistema de permissões e roles</p>
              <p>• Controle de expiração de contas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
