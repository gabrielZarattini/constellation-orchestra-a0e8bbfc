import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function SocialCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Conectando sua conta...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Autorização negada: ${searchParams.get('error_description') || error}`);
      setTimeout(() => navigate('/dashboard/social'), 3000);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setMessage('Parâmetros de callback inválidos.');
      setTimeout(() => navigate('/dashboard/social'), 3000);
      return;
    }

    (async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('social-auth-callback', {
          body: { code, state },
        });

        if (fnError) throw fnError;
        setStatus('success');
        setMessage(`${data?.platform ?? 'Conta'} conectada com sucesso!`);
        setTimeout(() => navigate('/dashboard/social'), 2000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Erro ao processar callback.');
        setTimeout(() => navigate('/dashboard/social'), 3000);
      }
    })();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        {status === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />}
        {status === 'success' && <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />}
        {status === 'error' && <XCircle className="h-12 w-12 text-destructive mx-auto" />}
        <p className="text-lg text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
}
