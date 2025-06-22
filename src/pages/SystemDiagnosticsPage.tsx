
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { SystemDiagnostics } from '@/components/SystemDiagnostics';

const SystemDiagnosticsPage = () => {
  return (
    <AppLayout>
      <div className="p-6">
        <SystemDiagnostics />
      </div>
    </AppLayout>
  );
};

export default SystemDiagnosticsPage;
