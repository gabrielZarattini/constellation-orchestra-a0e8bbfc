import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardData {
  credits: { balance: number; lifetime_earned: number; lifetime_spent: number } | null;
  subscription: { plan: string; status: string; trial_ends_at: string | null } | null;
  totalPosts: number;
  totalCampaigns: number;
  socialAccounts: number;
  recentNotifications: Array<{ id: string; title: string; message: string | null; type: string; read: boolean | null; created_at: string }>;
  recentActivity: Array<{ id: string; action: string; resource_type: string; details: any; created_at: string }>;
  metrics: Array<{ platform: string | null; impressions: number | null; clicks: number | null; engagements: number | null }>;
  loading: boolean;
}

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const [data, setData] = useState<Omit<DashboardData, 'loading'>>({
    credits: null,
    subscription: null,
    totalPosts: 0,
    totalCampaigns: 0,
    socialAccounts: 0,
    recentNotifications: [],
    recentActivity: [],
    metrics: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      setLoading(true);

      const [credits, subscription, posts, campaigns, accounts, notifications, activity, metrics] = await Promise.all([
        supabase.from('credits').select('balance, lifetime_earned, lifetime_spent').eq('user_id', user.id).maybeSingle(),
        supabase.from('subscriptions').select('plan, status, trial_ends_at').eq('user_id', user.id).maybeSingle(),
        supabase.from('scheduled_posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('social_accounts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
        supabase.from('notifications').select('id, title, message, type, read, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('audit_logs').select('id, action, resource_type, details, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('campaign_metrics').select('platform, impressions, clicks, engagements').eq('user_id', user.id),
      ]);

      setData({
        credits: credits.data,
        subscription: subscription.data,
        totalPosts: posts.count || 0,
        totalCampaigns: campaigns.count || 0,
        socialAccounts: accounts.count || 0,
        recentNotifications: notifications.data || [],
        recentActivity: activity.data || [],
        metrics: metrics.data || [],
      });

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  return { ...data, loading };
}
