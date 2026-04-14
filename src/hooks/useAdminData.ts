import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          setIsAdmin(false);
        } else {
          setIsAdmin(Boolean(data));
        }

        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  return { isAdmin, loading };
}

interface AdminData {
  profiles: any[];
  roles: any[];
  subscriptions: any[];
  auditLogs: any[];
  usageTracking: any[];
  loading: boolean;
}

export function useAdminData(enabled = true): AdminData {
  const { user } = useAuth();
  const [data, setData] = useState<Omit<AdminData, 'loading'>>({
    profiles: [], roles: [], subscriptions: [], auditLogs: [], usageTracking: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!user || !enabled) {
      setData({ profiles: [], roles: [], subscriptions: [], auditLogs: [], usageTracking: [] });
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('user_roles').select('*'),
      supabase
        .from('subscriptions')
        .select('id, user_id, plan, status, cancel_at_period_end, current_period_start, current_period_end, trial_ends_at, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('usage_tracking').select('*').order('created_at', { ascending: false }).limit(200),
    ]).then(([p, r, s, a, u]) => {
      if (!mounted) return;

      setData({
        profiles: p.data || [],
        roles: r.data || [],
        subscriptions: s.data || [],
        auditLogs: a.data || [],
        usageTracking: u.data || [],
      });
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [enabled, user]);

  return { ...data, loading };
}
