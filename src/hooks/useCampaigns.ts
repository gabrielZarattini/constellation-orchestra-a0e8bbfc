import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { Database } from '@/integrations/supabase/types';

type Campaign = Tables<'campaigns'>;
type CampaignInsert = TablesInsert<'campaigns'>;
type CampaignUpdate = TablesUpdate<'campaigns'>;
type CampaignStatus = Database['public']['Enums']['campaign_status'];
type SocialPlatform = Database['public']['Enums']['social_platform'];

export interface CampaignTemplate {
  name: string;
  description: string;
  objective: string;
  icon: string;
  defaults: Partial<CampaignInsert>;
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    name: 'Lançamento de Produto',
    description: 'Campanha focada em gerar buzz e conversões para um novo produto ou serviço.',
    objective: 'launch',
    icon: '🚀',
    defaults: {
      objective: 'launch',
      platforms: ['instagram', 'facebook', 'linkedin'] as SocialPlatform[],
      target_audience: { age_range: '25-45', interests: ['tecnologia', 'inovação'] },
    },
  },
  {
    name: 'Promoção Sazonal',
    description: 'Campanha de ofertas e descontos para datas comemorativas ou eventos especiais.',
    objective: 'promotion',
    icon: '🎁',
    defaults: {
      objective: 'promotion',
      platforms: ['instagram', 'facebook', 'twitter'] as SocialPlatform[],
      target_audience: { age_range: '18-55', interests: ['ofertas', 'descontos'] },
    },
  },
  {
    name: 'Brand Awareness',
    description: 'Campanha para aumentar o reconhecimento da marca e alcançar novos públicos.',
    objective: 'awareness',
    icon: '📣',
    defaults: {
      objective: 'awareness',
      platforms: ['instagram', 'tiktok', 'youtube'] as SocialPlatform[],
      target_audience: { age_range: '18-35', interests: ['lifestyle', 'entretenimento'] },
    },
  },
  {
    name: 'Engajamento',
    description: 'Campanha para aumentar interações, comentários e compartilhamentos.',
    objective: 'engagement',
    icon: '💬',
    defaults: {
      objective: 'engagement',
      platforms: ['instagram', 'twitter', 'tiktok'] as SocialPlatform[],
      target_audience: { age_range: '18-40', interests: ['comunidade', 'trends'] },
    },
  },
];

export const STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['active', 'archived'],
  active: ['paused', 'completed', 'archived'],
  paused: ['active', 'archived'],
  completed: ['archived'],
  archived: [],
};

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativa',
  paused: 'Pausada',
  completed: 'Concluída',
  archived: 'Arquivada',
};

export const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-emerald-500/20 text-emerald-400',
  paused: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-blue-500/20 text-blue-400',
  archived: 'bg-zinc-500/20 text-zinc-400',
};

export function useCampaigns(statusFilter?: CampaignStatus) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const campaignsQuery = useQuery({
    queryKey: ['campaigns', user?.id, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('campaigns')
        .select('*')
        .order('updated_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: Omit<CampaignInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ ...campaign, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: CampaignUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const duplicateCampaign = useMutation({
    mutationFn: async (campaign: Campaign) => {
      const { id, created_at, updated_at, ...rest } = campaign;
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ ...rest, name: `${rest.name} (cópia)`, status: 'draft' as CampaignStatus })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  return {
    campaigns: campaignsQuery.data ?? [],
    isLoading: campaignsQuery.isLoading,
    error: campaignsQuery.error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    duplicateCampaign,
  };
}

export function useCampaign(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Campaign;
    },
    enabled: !!user && !!id,
  });
}
