import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { validateAndSanitizeEAForm, logSecurityEvent } from '@/utils/security';

export interface ExpertAdvisor {
  id: string;
  name: string;
  version: string;
  description?: string;
  ex4_file_path?: string;
  ex5_file_path?: string;
  uploaded_by: string;
  download_count: number;
  created_at: string;
  updated_at: string;
  uploader_role?: string;
}

export interface CreateExpertAdvisorData {
  name: string;
  version: string;
  description?: string;
  ex4File?: File;
  ex5File?: File;
}

export const useExpertAdvisors = () => {
  return useQuery({
    queryKey: ['expert-advisors'],
    queryFn: async () => {
      console.log('Fetching Expert Advisors...');
      
      // Buscar os EAs diretamente com a coluna uploader_role
      const { data: easData, error: easError } = await supabase
        .from('expert_advisors')
        .select('*')
        .order('created_at', { ascending: false });

      if (easError) {
        console.error('Error fetching EAs:', easError);
        throw easError;
      }

      console.log('EAs found:', easData?.length || 0);
      console.log('EAs data with uploader roles:', easData);

      return easData as ExpertAdvisor[] || [];
    },
  });
};

export const useCreateExpertAdvisor = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExpertAdvisorData) => {
      if (!user) throw new Error('User not authenticated');

      // Validação e sanitização de segurança
      const validation = validateAndSanitizeEAForm(data);
      
      if (!validation.isValid) {
        logSecurityEvent('EA_UPLOAD_VALIDATION_FAILED', { 
          userId: user.id, 
          errors: validation.errors 
        });
        throw new Error(validation.errors.join(', '));
      }

      // Usa dados sanitizados
      const sanitizedData = validation.sanitizedData;
      
      logSecurityEvent('EA_UPLOAD_STARTED', { 
        userId: user.id, 
        eaName: sanitizedData.name,
        hasEx4: !!sanitizedData.ex4File,
        hasEx5: !!sanitizedData.ex5File
      });

      // Primeiro, buscar o role do usuário atual
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Erro ao buscar informações do usuário');
      }

      let ex4FilePath: string | undefined;
      let ex5FilePath: string | undefined;

      // Upload arquivos se fornecidos
      if (sanitizedData.ex4File) {
        const fileName = `${Date.now()}_${sanitizedData.ex4File.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('expert-advisors')
          .upload(fileName, sanitizedData.ex4File);

        if (uploadError) {
          logSecurityEvent('EA_FILE_UPLOAD_FAILED', { 
            userId: user.id, 
            fileType: 'ex4',
            error: uploadError.message 
          });
          throw uploadError;
        }
        ex4FilePath = uploadData.path;
      }

      if (sanitizedData.ex5File) {
        const fileName = `${Date.now()}_${sanitizedData.ex5File.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('expert-advisors')
          .upload(fileName, sanitizedData.ex5File);

        if (uploadError) {
          logSecurityEvent('EA_FILE_UPLOAD_FAILED', { 
            userId: user.id, 
            fileType: 'ex5',
            error: uploadError.message 
          });
          throw uploadError;
        }
        ex5FilePath = uploadData.path;
      }

      // Criar registro do EA com o role do uploader
      const { data: eaData, error } = await supabase
        .from('expert_advisors')
        .insert({
          name: sanitizedData.name,
          version: sanitizedData.version,
          description: sanitizedData.description,
          ex4_file_path: ex4FilePath,
          ex5_file_path: ex5FilePath,
          uploaded_by: user.id,
          uploader_role: profileData.role,
        })
        .select()
        .single();

      if (error) {
        logSecurityEvent('EA_DATABASE_INSERT_FAILED', { 
          userId: user.id, 
          error: error.message 
        });
        throw error;
      }

      logSecurityEvent('EA_UPLOAD_SUCCESS', { 
        userId: user.id, 
        eaId: eaData.id,
        eaName: eaData.name 
      });

      return eaData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-advisors'] });
      toast.success('Expert Advisor criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating EA:', error);
      toast.error('Erro ao criar Expert Advisor: ' + error.message);
    },
  });
};

export const useDeleteExpertAdvisor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ea: ExpertAdvisor) => {
      // Deletar arquivos do storage
      const filesToDelete = [];
      if (ea.ex4_file_path) filesToDelete.push(ea.ex4_file_path);
      if (ea.ex5_file_path) filesToDelete.push(ea.ex5_file_path);

      if (filesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('expert-advisors')
          .remove(filesToDelete);

        if (storageError) {
          console.error('Error deleting files:', storageError);
        }
      }

      // Deletar registro do EA
      const { error } = await supabase
        .from('expert_advisors')
        .delete()
        .eq('id', ea.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-advisors'] });
      toast.success('Expert Advisor deletado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error deleting EA:', error);
      toast.error('Erro ao deletar Expert Advisor');
    },
  });
};

export const useIncrementDownloadCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eaId: string) => {
      // Get current download count
      const { data: currentEA, error: fetchError } = await supabase
        .from('expert_advisors')
        .select('download_count')
        .eq('id', eaId)
        .single();

      if (fetchError) throw fetchError;

      // Increment the count
      const { error } = await supabase
        .from('expert_advisors')
        .update({ 
          download_count: (currentEA.download_count || 0) + 1
        })
        .eq('id', eaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-advisors'] });
    },
  });
};

export const downloadFile = async (filePath: string, fileName: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('expert-advisors')
      .download(filePath);

    if (error) throw error;

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error('Erro ao fazer download do arquivo');
    return false;
  }
};
