import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Create a service role client for admin operations
const SUPABASE_URL = "https://kgrlcsimdszbrkcwjpke.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtncmxjc2ltZHN6YnJrY3dqcGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg0NzQxOCwiZXhwIjoyMDY1NDIzNDE4fQ.kCmqZmY8gU-5Vhqe7x8F0_Gk-ZAGCGVb4VJR8eEHPBY";

const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Hook para listar todos os usuários (apenas admin/manager)
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
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
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
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
      console.log('Creating user with data:', userData);
      
      // First create the auth user using service role
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role
        }
      });
      
      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      
      console.log('Auth user created:', authData.user.id);
      
      // Then update the profile with additional data using service role
      const { data, error } = await supabaseAdmin
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
        console.error('Profile update error:', error);
        throw error;
      }
      
      console.log('Profile updated:', data);
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Hook para atualizar usuário
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: ProfileUpdate & { id: string }) => {
      console.log('🔧 [DEBUG] Iniciando atualização do usuário:', { id, updates });
      
      try {
        // Verificar se o usuário atual é admin/manager
        const { data: currentUser, error: currentUserError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        console.log('🔧 [DEBUG] Usuário atual:', currentUser);
        
        if (currentUserError) {
          console.error('❌ [DEBUG] Erro ao buscar usuário atual:', currentUserError);
          throw currentUserError;
        }

        // Se for admin/manager, usar supabaseAdmin para evitar RLS
        if (currentUser?.role === 'admin' || currentUser?.role === 'manager') {
          console.log('🔧 [DEBUG] Usando supabaseAdmin para atualização (admin/manager)');
          
          const { data, error } = await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
          
          if (error) {
            console.error('❌ [DEBUG] Erro na atualização via supabaseAdmin:', error);
            throw error;
          }
          
          console.log('✅ [DEBUG] Sucesso na atualização via supabaseAdmin:', data);
          return data as Profile;
        } else {
          // Usuário normal, usar cliente padrão (só pode atualizar próprio perfil)
          console.log('🔧 [DEBUG] Usando supabase regular para atualização (usuário normal)');
          
          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
          
          if (error) {
            console.error('❌ [DEBUG] Erro na atualização via supabase regular:', error);
            throw error;
          }
          
          console.log('✅ [DEBUG] Sucesso na atualização via supabase regular:', data);
          return data as Profile;
        }
      } catch (error) {
        console.error('💥 [DEBUG] Erro geral na atualização:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('🎉 [DEBUG] Mutation onSuccess:', data);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
    },
    onError: (error) => {
      console.error('💥 [DEBUG] Mutation onError:', error);
    }
  });
};

// Hook para deletar usuário (apenas admin)
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First delete from auth using service role (this will cascade to profiles)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (authError) throw authError;
      
      // The profile should be automatically deleted by the CASCADE constraint
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
