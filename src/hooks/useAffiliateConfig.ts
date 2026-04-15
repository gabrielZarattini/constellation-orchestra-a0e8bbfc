import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AffiliateConfig {
  id: string;
  user_id: string;
  platform: string;
  app_id: string | null;
  client_secret: string | null;
  redirect_uri: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useAffiliateConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['affiliate_config', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('affiliate_config')
        .select('*')
        .eq('user_id', user!.id)
        .eq('platform', 'mercadolivre')
        .maybeSingle();
      if (error) throw error;
      return data as AffiliateConfig | null;
    },
    enabled: !!user?.id,
  });

  const upsertConfig = useMutation({
    mutationFn: async (values: { app_id: string; client_secret: string; redirect_uri: string }) => {
      if (config?.id) {
        const { error } = await (supabase as any)
          .from('affiliate_config')
          .update({
            app_id: values.app_id,
            client_secret: values.client_secret,
            redirect_uri: values.redirect_uri,
          })
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('affiliate_config')
          .insert({
            user_id: user!.id,
            platform: 'mercadolivre',
            app_id: values.app_id,
            client_secret: values.client_secret,
            redirect_uri: values.redirect_uri,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate_config', user?.id] });
    },
  });

  return { config, isLoading, upsertConfig };
}
