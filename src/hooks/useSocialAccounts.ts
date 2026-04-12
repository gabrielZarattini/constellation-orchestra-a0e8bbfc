import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import type { Database } from '@/integrations/supabase/types';

type SocialAccount = Tables<'social_accounts'>;
type SocialPlatform = Database['public']['Enums']['social_platform'];

export const SUPPORTED_PLATFORMS: { id: SocialPlatform; name: string; icon: string; color: string }[] = [
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'facebook', name: 'Facebook', icon: '👤', color: 'bg-blue-500' },
  { id: 'twitter', name: 'Twitter / X', icon: '𝕏', color: 'bg-zinc-800' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-zinc-900' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', color: 'bg-red-600' },
  { id: 'pinterest', name: 'Pinterest', icon: '📌', color: 'bg-red-500' },
  { id: 'wordpress', name: 'WordPress', icon: '📝', color: 'bg-blue-700' },
];

export function useSocialAccounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: ['social_accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('id, user_id, platform, platform_user_id, platform_username, is_active, token_expires_at, scopes, metadata, created_at, updated_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SocialAccount[];
    },
    enabled: !!user,
  });

  const disconnectAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social_accounts'] }),
  });

  const initiateOAuth = async (platform: SocialPlatform) => {
    const { data, error } = await supabase.functions.invoke('social-auth-init', {
      body: { platform, redirect_uri: `${window.location.origin}/social/callback` },
    });
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    }
    return data;
  };

  const isTokenExpired = (account: SocialAccount) => {
    if (!account.token_expires_at) return false;
    return new Date(account.token_expires_at) < new Date();
  };

  return {
    accounts: accountsQuery.data ?? [],
    isLoading: accountsQuery.isLoading,
    error: accountsQuery.error,
    disconnectAccount,
    initiateOAuth,
    isTokenExpired,
  };
}
