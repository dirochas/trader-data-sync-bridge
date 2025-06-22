import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Hook para listar todos os usuários (apenas admin/manager)
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      console.log('🔍 [DEBUG] Iniciando consulta de usuários...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ [DEBUG] Erro na consulta de usuários:', error);
        throw error;
      }
      
      console.log('✅ [DEBUG] Consulta de usuários bem-sucedida:', data?.length, 'usuários encontrados');
      return data as Profile[];
    },
    refetchInterval: 30000,
  });
};

// Hook para buscar um usuário específico
export const useUser = (id?: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) return null;
      
      console.log('🔍 [DEBUG] Buscando usuário específico:', id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('❌ [DEBUG] Erro ao buscar usuário específico:', error);
        throw error;
      }
      
      console.log('✅ [DEBUG] Usuário específico encontrado:', data?.email);
      return data as Profile;
    },
    enabled: !!id,
  });
};

// Hook para criar novo usuário (apenas admin/manager)
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: { 
      email: string; 
      password: string; 
      first_name?: string; 
      last_name?: string;
      role: UserRole;
      phone?: string;
      company?: string;
      notes?: string;
    }) => {
      console.log('🔧 [DEBUG] Criando usuário:', userData.email);
      
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role
          }
        }
      });
      
      if (authError) {
        console.error('❌ [DEBUG] Erro na criação do auth user:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('Failed to create user');
      }
      
      console.log('✅ [DEBUG] Auth user criado:', authData.user.id);
      
      // Update the profile with additional data
      console.log('🔧 [DEBUG] Atualizando perfil do usuário...');
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          phone: userData.phone,
          company: userData.company,
          notes: userData.notes
        })
        .eq('id', authData.user.id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ [DEBUG] Erro na atualização do perfil:', error);
        throw error;
      }
      
      console.log('✅ [DEBUG] Perfil atualizado com sucesso:', data?.email);
      return data as Profile;
    },
    onSuccess: () => {
      console.log('🎉 [DEBUG] Usuário criado com sucesso - invalidando cache');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('💥 [DEBUG] Erro na criação do usuário:', error);
    }
  });
};

// Hook para atualizar usuário
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: ProfileUpdate & { id: string }) => {
      console.log('🔧 [DEBUG] Iniciando atualização do usuário:', id, updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ [DEBUG] Erro na atualização do usuário:', error);
        throw error;
      }
      
      console.log('✅ [DEBUG] Usuário atualizado com sucesso:', data?.email);
      return data as Profile;
    },
    onSuccess: (data) => {
      console.log('🎉 [DEBUG] Atualização bem-sucedida - invalidando cache');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
    },
    onError: (error) => {
      console.error('💥 [DEBUG] Erro na mutation de atualização:', error);
    }
  });
};

// Hook para deletar usuário (apenas admin)
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Hook para alternar status ativo/inativo do usuário
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
    },
  });
};
