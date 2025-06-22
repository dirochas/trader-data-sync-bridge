
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
      
      // Primeiro, buscar os EAs
      const { data: easData, error: easError } = await supabase
        .from('expert_advisors')
        .select('*')
        .order('created_at', { ascending: false });

      if (easError) {
        console.error('Error fetching EAs:', easError);
        throw easError;
      }

      console.log('EAs found:', easData?.length || 0);

      if (!easData || easData.length === 0) {
        return [];
      }

      // Buscar os roles dos uploaders
      const uploaderIds = [...new Set(easData.map(ea => ea.uploaded_by))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, role')
        .in('id', uploaderIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Não quebrar por causa dos perfis, apenas continuar sem eles
      }

      console.log('Profiles data:', profilesData);

      // Combinar os dados com o role correto do uploader
      const result = easData.map(ea => {
        const uploaderProfile = profilesData?.find(profile => profile.id === ea.uploaded_by);
        return {
          ...ea,
          uploader_role: uploaderProfile?.role || 'client_trader'
        };
      }) as ExpertAdvisor[];

      console.log('Final result with uploader roles:', result);
      return result;
    },
  });
};

export const useCreateExpertAdvisor = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExpertAdvisorData) => {
      if (!user) throw new Error('User not authenticated');

      let ex4FilePath: string | undefined;
      let ex5FilePath: string | undefined;

      // Upload arquivos se fornecidos
      if (data.ex4File) {
        const fileName = `${Date.now()}_${data.ex4File.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('expert-advisors')
          .upload(fileName, data.ex4File);

        if (uploadError) throw uploadError;
        ex4FilePath = uploadData.path;
      }

      if (data.ex5File) {
        const fileName = `${Date.now()}_${data.ex5File.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('expert-advisors')
          .upload(fileName, data.ex5File);

        if (uploadError) throw uploadError;
        ex5FilePath = uploadData.path;
      }

      // Criar registro do EA
      const { data: eaData, error } = await supabase
        .from('expert_advisors')
        .insert({
          name: data.name,
          version: data.version,
          description: data.description,
          ex4_file_path: ex4FilePath,
          ex5_file_path: ex5FilePath,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return eaData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expert-advisors'] });
      toast.success('Expert Advisor criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating EA:', error);
      toast.error('Erro ao criar Expert Advisor');
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
