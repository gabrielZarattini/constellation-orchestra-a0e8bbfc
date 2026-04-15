import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, ShoppingBag, ExternalLink } from 'lucide-react';
import { useAffiliateConfig } from '@/hooks/useAffiliateConfig';
import { toast } from 'sonner';

export default function AffiliatesPage() {
  const { config, isLoading, upsertConfig } = useAffiliateConfig();

  const [appId, setAppId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');

  useEffect(() => {
    if (config) {
      setAppId(config.app_id ?? '');
      setClientSecret(config.client_secret ?? '');
      setRedirectUri(config.redirect_uri ?? '');
    }
  }, [config]);

  const handleSave = async () => {
    if (!appId.trim()) {
      toast.error('App ID é obrigatório');
      return;
    }
    try {
      await upsertConfig.mutateAsync({ app_id: appId, client_secret: clientSecret, redirect_uri: redirectUri });
      toast.success('Credenciais salvas com sucesso!');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Afiliados | Magic Constellation</title>
      </Helmet>
      <div className="space-y-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Monetização — Afiliados
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure suas credenciais do Mercado Livre para monetização automática
          </p>
        </motion.div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Mercado Livre</CardTitle>
                <CardDescription>Credenciais da API de Afiliados</CardDescription>
              </div>
              <Badge variant={config?.is_active ? 'default' : 'secondary'}>
                {config?.is_active ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app-id">App ID</Label>
              <Input
                id="app-id"
                placeholder="Ex: 1234567890"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-secret">Client Secret</Label>
              <Input
                id="client-secret"
                type="password"
                placeholder="••••••••••••"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirect-uri">Redirect URI</Label>
              <Input
                id="redirect-uri"
                placeholder="https://seu-dominio.com/callback"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="https://developers.mercadolivre.com.br/pt_br/registre-o-seu-aplicativo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Como obter credenciais
              </a>
              <Button onClick={handleSave} disabled={upsertConfig.isPending}>
                {upsertConfig.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Credenciais
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
