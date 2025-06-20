
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Download, Monitor } from 'lucide-react';

interface EditVPSModalProps {
  isOpen: boolean;
  onClose: () => void;
  vps: {
    vpsUniqueId: string;
    displayName: string;
    host?: string;
    port?: string;
    username?: string;
    password?: string;
  } | null;
  onVPSUpdated: () => void;
}

const EditVPSModal = ({ isOpen, onClose, vps, onVPSUpdated }: EditVPSModalProps) => {
  const [formData, setFormData] = useState({
    displayName: '',
    host: '',
    port: '3389',
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (vps) {
      setFormData({
        displayName: vps.displayName || '',
        host: vps.host || '',
        port: vps.port || '3389',
        username: vps.username || '',
        password: vps.password || '',
      });
    }
  }, [vps]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vps) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('vps_servers')
        .upsert({
          vps_unique_id: vps.vpsUniqueId,
          display_name: formData.displayName.trim() || vps.vpsUniqueId,
          host: formData.host.trim(),
          port: formData.port.trim(),
          username: formData.username.trim(),
          password: formData.password.trim(),
        }, {
          onConflict: 'vps_unique_id'
        });

      if (error) throw error;

      toast({
        title: "VPS atualizado",
        description: "Configurações do VPS foram salvas com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account'] });
      
      onVPSUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar VPS:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as configurações do VPS.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRDPFile = () => {
    if (!formData.host) {
      toast({
        title: "Erro",
        description: "Configure o IP/Host do VPS primeiro.",
        variant: "destructive",
      });
      return;
    }

    const rdpContent = [
      'screen mode id:i:2',
      'use multimon:i:0',
      'desktopwidth:i:1920',
      'desktopheight:i:1080',
      'session bpp:i:32',
      'winposstr:s:0,3,0,0,800,600',
      'compression:i:1',
      'keyboardhook:i:2',
      'audiocapturemode:i:0',
      'videoplaybackmode:i:1',
      'connection type:i:7',
      'networkautodetect:i:1',
      'bandwidthautodetect:i:1',
      'displayconnectionbar:i:1',
      'enableworkspacereconnect:i:0',
      'disable wallpaper:i:0',
      'allow font smoothing:i:0',
      'allow desktop composition:i:0',
      'disable full window drag:i:1',
      'disable menu anims:i:1',
      'disable themes:i:0',
      'disable cursor setting:i:0',
      'bitmapcachepersistenable:i:1',
      'audiomode:i:0',
      'redirectprinters:i:1',
      'redirectcomports:i:0',
      'redirectsmartcards:i:1',
      'redirectclipboard:i:1',
      'redirectposdevices:i:0',
      'autoreconnection enabled:i:1',
      'authentication level:i:2',
      'prompt for credentials:i:0',
      'negotiate security layer:i:1',
      'remoteapplicationmode:i:0',
      'alternate shell:s:',
      'shell working directory:s:',
      'gatewayhostname:s:',
      'gatewayusagemethod:i:4',
      'gatewaycredentialssource:i:4',
      'gatewayprofileusagemethod:i:0',
      'promptcredentialonce:i:0',
      'gatewaybrokeringtype:i:0',
      `full address:s:${formData.host}:${formData.port}`,
      `username:s:${formData.username}`,
      `password 51:b:${btoa(formData.password)}`,
    ].join('\r\n');

    const blob = new Blob([rdpContent], { type: 'application/x-rdp' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formData.displayName || vps?.vpsUniqueId || 'vps'}.rdp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Arquivo RDP gerado",
      description: "O arquivo RDP foi baixado. Execute-o para conectar ao VPS.",
    });
  };

  const connectToVPS = () => {
    if (!formData.host) {
      toast({
        title: "Erro",
        description: "Configure o IP/Host do VPS primeiro.",
        variant: "destructive",
      });
      return;
    }

    // Tenta abrir diretamente o protocolo RDP
    const rdpUrl = `rdp://full%20address=s:${formData.host}:${formData.port}&username=s:${formData.username}`;
    
    try {
      // Tenta abrir o protocolo RDP diretamente
      window.location.href = rdpUrl;
      
      // Fallback: gerar arquivo RDP
      setTimeout(() => {
        generateRDPFile();
      }, 1000);
      
      toast({
        title: "Conectando ao VPS",
        description: "Abrindo conexão RDP...",
      });
    } catch (error) {
      // Se falhar, gera o arquivo RDP
      generateRDPFile();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar VPS</DialogTitle>
        </DialogHeader>
        
        {vps && (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Identificação</TabsTrigger>
              <TabsTrigger value="connection">Conexão RDP</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vpsUniqueId">ID Único do VPS</Label>
                  <Input
                    id="vpsUniqueId"
                    value={vps.vpsUniqueId}
                    disabled
                    className="bg-gray-50 text-gray-700 border-gray-200 cursor-not-allowed font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">Identificador único interno (não editável)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome de Exibição</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Ex: VPS-João, VPS_7110"
                  />
                  <p className="text-xs text-gray-500">
                    Este nome será aplicado a todas as contas que usam este VPS
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="connection" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="host">IP/Host do VPS</Label>
                  <Input
                    id="host"
                    value={formData.host}
                    onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="Ex: 192.168.1.100 ou vps.exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="port">Porta RDP</Label>
                  <Input
                    id="port"
                    value={formData.port}
                    onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                    placeholder="3389"
                  />
                  <p className="text-xs text-gray-500">Porta padrão do RDP é 3389</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Ex: Administrator"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Senha do VPS"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {formData.host && formData.username && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={connectToVPS}
                      className="flex-1"
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      Conectar Agora
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateRDPFile}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar RDP
                    </Button>
                  </div>
                )}
              </TabsContent>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditVPSModal;
