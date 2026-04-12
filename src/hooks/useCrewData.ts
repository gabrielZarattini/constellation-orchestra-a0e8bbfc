import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCrewStore, type Agent, type Edge } from '@/store/useCrewStore';

export function useCrewData() {
  const { user } = useAuth();
  const setAgents = useCrewStore((s) => s.setAgents);
  const setEdges = useCrewStore((s) => s.setEdges);
  const setLoaded = useCrewStore((s) => s.setLoaded);

  const agentsQuery = useQuery({
    queryKey: ['crew_agents', user?.id],
    queryFn: async () => {
      // First try to load; if empty, call seed function
      let { data, error } = await supabase
        .from('crew_agents')
        .select('*')
        .order('created_at');
      if (error) throw error;

      if (!data || data.length === 0) {
        // Seed template via RPC
        const { error: seedErr } = await supabase.rpc('seed_crew_template', {
          _user_id: user!.id,
        });
        if (seedErr) console.error('Seed error:', seedErr);

        // Re-fetch
        const res = await supabase
          .from('crew_agents')
          .select('*')
          .order('created_at');
        if (res.error) throw res.error;
        data = res.data;
      }

      return (data ?? []).map((a: any): Agent => ({
        id: a.agent_key,
        dbId: a.id,
        name: a.name,
        role: a.role,
        avatar: a.avatar,
        provider: a.provider,
        model: a.model,
        status: a.status as Agent['status'],
        position: Array.isArray(a.position) ? a.position : JSON.parse(a.position),
        systemPrompt: a.system_prompt,
        priority: a.priority as Agent['priority'],
      }));
    },
    enabled: !!user,
  });

  const edgesQuery = useQuery({
    queryKey: ['crew_edges', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_edges')
        .select('*')
        .order('created_at');
      if (error) throw error;

      return (data ?? []).map((e: any): Edge => ({
        id: e.id,
        from: e.from_agent_key,
        to: e.to_agent_key,
        status: e.status as Edge['status'],
        label: e.label,
        createdAt: new Date(e.created_at).getTime(),
      }));
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (agentsQuery.data) {
      setAgents(agentsQuery.data);
    }
  }, [agentsQuery.data, setAgents]);

  useEffect(() => {
    if (edgesQuery.data) {
      setEdges(edgesQuery.data);
      setLoaded(true);
    }
  }, [edgesQuery.data, setEdges, setLoaded]);

  return {
    isLoading: agentsQuery.isLoading || edgesQuery.isLoading,
    error: agentsQuery.error || edgesQuery.error,
  };
}
