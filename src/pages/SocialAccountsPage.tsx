import { useState } from 'react';
import { useSocialAccounts, SUPPORTED_PLATFORMS } from '@/hooks/useSocialAccounts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link2, Unlink, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SocialPlatform = Database['public']['Enums']['social_platform'];

export default function SocialAccountsPage() {
  const { accounts, isLoading, disconnectAccount, initiateOAuth, isTokenExpired } = useSocialAccounts();
  const { toast } = useToast();
  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);

  const handleConnect = async (platform: SocialPlatform) => {
    setConnectingPlatform(platform);
    try {
      await initiateOAuth(platform);
    } catch (err: any) {
      toast({ title: 'Erro ao conectar', description: err.message, variant: 'destructive' });
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (id: string, name: string) => {
    try {
      await disconnectAccount.mutateAsync(id);
      toast({ title: 'Desconectado', description: `${name} foi desconectado com sucesso.` });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível desconectar.', variant: 'destructive' });
    }
  };

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Redes Sociais</h1>
        <p className="text-muted-foreground mt-1">
          Conecte suas contas para publicar conteúdo diretamente pela plataforma.
        </p>
      </div>

      {/* Connected accounts */}
      {accounts.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Contas Conectadas</CardTitle>
            <CardDescription>Gerencie suas redes sociais vinculadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.map((account) => {
              const platformInfo = SUPPORTED_PLATFORMS.find((p) => p.id === account.platform);
              const expired = isTokenExpired(account);
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platformInfo?.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">
                        {platformInfo?.name}
                        {account.platform_username && (
                          <span className="text-muted-foreground ml-1">@{account.platform_username}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {expired ? (
                          <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Token expirado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-xs">
                            Ativa
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expired && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConnect(account.platform)}
                        disabled={connectingPlatform === account.platform}
                      >
                        Reconectar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDisconnect(account.id, platformInfo?.name ?? account.platform)}
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Available platforms */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Plataformas Disponíveis</CardTitle>
          <CardDescription>Conecte novas redes sociais à sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUPPORTED_PLATFORMS.map((platform) => {
              const isConnected = connectedPlatforms.has(platform.id);
              const isConnecting = connectingPlatform === platform.id;
              return (
                <div
                  key={platform.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <span className="font-medium text-foreground">{platform.name}</span>
                  </div>
                  {isConnected ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Conectado</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-1" /> Conectar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
