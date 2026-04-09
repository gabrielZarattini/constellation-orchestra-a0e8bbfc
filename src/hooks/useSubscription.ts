import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useSubscription() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkout = async (priceId: string) => {
    if (!user) {
      toast.error('Faça login para assinar um plano');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const openPortal = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Portal error:', err);
      toast.error('Erro ao abrir portal de assinatura.');
    } finally {
      setLoading(false);
    }
  };

  return { checkout, openPortal, loading };
}
