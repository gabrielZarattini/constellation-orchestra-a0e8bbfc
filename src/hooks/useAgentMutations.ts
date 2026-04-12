import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CreateAgentInput {
  agent_key: string;
  name: string;
  role: string;
  avatar: string;
  provider: string;
  model: string;
  system_prompt: string;
  priority: string;
  position: number[];
}

interface UpdateAgentInput {
  dbId: string;
  name?: string;
  role?: string;
  avatar?: string;
  provider?: string;
  model?: string;
  system_prompt?: string;
  priority?: string;
  status?: string;
}

export function useCreateAgent() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAgentInput) => {
      const { error } = await supabase.from('crew_agents').insert({
        user_id: user!.id,
        ...input,
        position: JSON.stringify(input.position),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crew_agents'] });
      toast.success('Agente criado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ dbId, ...updates }: UpdateAgentInput) => {
      const { error } = await supabase
        .from('crew_agents')
        .update(updates)
        .eq('id', dbId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crew_agents'] });
      toast.success('Agente atualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAgent() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (agentKey: string) => {
      await supabase
        .from('crew_edges')
        .delete()
        .eq('user_id', user!.id)
        .or(`from_agent_key.eq.${agentKey},to_agent_key.eq.${agentKey}`);

      const { error } = await supabase
        .from('crew_agents')
        .delete()
        .eq('user_id', user!.id)
        .eq('agent_key', agentKey);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crew_agents'] });
      qc.invalidateQueries({ queryKey: ['crew_edges'] });
      toast.success('Agente removido');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Edge CRUD
interface CreateEdgeInput {
  from_agent_key: string;
  to_agent_key: string;
  label?: string;
  status?: string;
}

export function useCreateEdge() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEdgeInput) => {
      const { error } = await supabase.from('crew_edges').insert({
        user_id: user!.id,
        from_agent_key: input.from_agent_key,
        to_agent_key: input.to_agent_key,
        label: input.label || 'Conexão',
        status: input.status || 'idle',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crew_edges'] });
      toast.success('Conexão criada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteEdge() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (edgeId: string) => {
      const { error } = await supabase
        .from('crew_edges')
        .delete()
        .eq('id', edgeId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crew_edges'] });
      toast.success('Conexão removida');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
