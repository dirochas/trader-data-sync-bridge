
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateUser, useUpdateUser } from '@/hooks/useUserManagement';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const userFormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  first_name: z.string().min(1, 'Nome é obrigatório'),
  last_name: z.string().optional(),
  nickname: z.string().optional(),
  role: z.enum(['admin', 'manager', 'client_trader', 'client_investor'] as const),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  user?: Profile;
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager', 
  client_trader: 'Trader',
  client_investor: 'Investor'
};

export const UserFormModal = ({ isOpen, onClose, mode, user }: UserFormModalProps) => {
  const { toast } = useToast();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: user?.email || '',
      password: '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      nickname: user?.nickname || '',
      role: user?.role || 'client_trader',
      phone: user?.phone || '',
      company: user?.company || '',
      notes: user?.notes || '',
    },
  });

  React.useEffect(() => {
    if (user && mode === 'edit') {
      form.reset({
        email: user.email,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        nickname: user.nickname || '',
        role: user.role,
        phone: user.phone || '',
        company: user.company || '',
        notes: user.notes || '',
      });
    } else if (mode === 'create') {
      form.reset({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        nickname: '',
        role: 'client_trader',
        phone: '',
        company: '',
        notes: '',
      });
    }
  }, [user, mode, form]);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (mode === 'create') {
        if (!data.password) {
          toast({
            title: "Erro",
            description: "Senha é obrigatória para criar usuário",
            variant: "destructive",
          });
          return;
        }

        await createUser.mutateAsync({
          email: data.email,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          phone: data.phone,
          company: data.company,
          notes: data.notes,
        });

        toast({
          title: "Usuário criado",
          description: "Usuário criado com sucesso",
        });
      } else if (user) {
        await updateUser.mutateAsync({
          id: user.id,
          first_name: data.first_name,
          last_name: data.last_name,
          nickname: data.nickname,
          role: data.role,
          phone: data.phone,
          company: data.company,
          notes: data.notes,
        });

        toast({
          title: "Usuário atualizado",
          description: "Usuário atualizado com sucesso",
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: mode === 'create' ? "Erro ao criar usuário" : "Erro ao atualizar usuário",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar Usuário' : 'Editar Usuário'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apelido/Nickname</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Como você conhece este usuário (ex: ZéRoberto, Lucas_BR)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={mode === 'edit'} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'create' && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha *</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissão *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma permissão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createUser.isPending || updateUser.isPending}
              >
                {mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
