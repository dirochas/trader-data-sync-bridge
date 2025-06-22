
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AccountGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useAccountGroups = () => {
  return useQuery({
    queryKey: ['account-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_groups')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as AccountGroup[];
    },
    staleTime: 5000,
    gcTime: 30000,
  });
};

export const useCreateAccountGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (group: { name: string; description?: string; color?: string }) => {
      const { data, error } = await supabase
        .from('account_groups')
        .insert(group)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-groups'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({
        title: "Grupo criado",
        description: "O grupo foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar grupo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o grupo.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAccountGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AccountGroup> & { id: string }) => {
      const { data, error } = await supabase
        .from('account_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-groups'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({
        title: "Grupo atualizado",
        description: "O grupo foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar grupo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o grupo.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAccountGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('account_groups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-groups'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({
        title: "Grupo removido",
        description: "O grupo foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao remover grupo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o grupo.",
        variant: "destructive",
      });
    },
  });
};
