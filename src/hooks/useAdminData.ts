import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); setLoading(false); });
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

export function useAdminData(): AdminData {
  const { user } = useAuth();
  const [data, setData] = useState<Omit<AdminData, 'loading'>>({
    profiles: [], roles: [], subscriptions: [], auditLogs: [], usageTracking: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('user_roles').select('*'),
      supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('usage_tracking').select('*').order('created_at', { ascending: false }).limit(200),
    ]).then(([p, r, s, a, u]) => {
      setData({
        profiles: p.data || [],
        roles: r.data || [],
        subscriptions: s.data || [],
        auditLogs: a.data || [],
        usageTracking: u.data || [],
      });
      setLoading(false);
    });
  }, [user]);

  return { ...data, loading };
}
