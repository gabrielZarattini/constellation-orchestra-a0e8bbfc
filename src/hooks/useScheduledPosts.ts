import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type ScheduledPost = Tables<'scheduled_posts'>;
type InsertPost = TablesInsert<'scheduled_posts'>;

export function useScheduledPosts(range?: { from: Date; to: Date }) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['scheduled_posts', user?.id, range?.from?.toISOString(), range?.to?.toISOString()],
    queryFn: async () => {
      let q = supabase
        .from('scheduled_posts')
        .select('*')
        .order('scheduled_at');

      if (range?.from) q = q.gte('scheduled_at', range.from.toISOString());
      if (range?.to) q = q.lte('scheduled_at', range.to.toISOString());

      const { data, error } = await q;
      if (error) throw error;
      return data as ScheduledPost[];
    },
    enabled: !!user,
  });

  return query;
}

export function useCreateScheduledPost() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (post: Omit<InsertPost, 'user_id'>) => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert({ ...post, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled_posts'] });
      toast.success('Post agendado com sucesso');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateScheduledPost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<InsertPost>) => {
      const { error } = await supabase
        .from('scheduled_posts')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled_posts'] });
      toast.success('Post atualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteScheduledPost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled_posts'] });
      toast.success('Post removido');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
