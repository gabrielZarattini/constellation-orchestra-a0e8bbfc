import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCampaign, useCampaigns, STATUS_LABELS, STATUS_COLORS, STATUS_TRANSITIONS } from '@/hooks/useCampaigns';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type CampaignStatus = Database['public']['Enums']['campaign_status'];

const ACTION_LABELS: Record<string, string> = {
  active: 'Ativar',
  paused: 'Pausar',
  completed: 'Concluir',
  archived: 'Arquivar',
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: campaign, isLoading } = useCampaign(id);
  const { updateCampaign } = useCampaigns();

  const handleStatus = async (status: CampaignStatus) => {
    try {
      await updateCampaign.mutateAsync({ id: id!, status });
      toast({ title: `Campanha ${STATUS_LABELS[status].toLowerCase()}` });
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Campanha não encontrada</p>
        <Button variant="link" onClick={() => navigate('/dashboard/campaigns')}>
          Voltar
        </Button>
      </div>
    );
  }

  const transitions = STATUS_TRANSITIONS[campaign.status];
  const audience = campaign.target_audience as { age_range?: string; location?: string; interests?: string[] } | null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/campaigns')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-heading font-bold text-foreground truncate">{campaign.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={STATUS_COLORS[campaign.status]} variant="secondary">
              {STATUS_LABELS[campaign.status]}
            </Badge>
            {campaign.objective && (
              <span className="text-xs text-muted-foreground">• {campaign.objective}</span>
            )}
          </div>
        </div>
      </div>

      {/* Status Actions */}
      {transitions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {transitions.map((s) => (
            <Button
              key={s}
              variant={s === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatus(s)}
              disabled={updateCampaign.isPending}
            >
              {ACTION_LABELS[s] || s}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {campaign.description && (
              <div>
                <span className="text-muted-foreground">Descrição</span>
                <p className="text-foreground mt-0.5">{campaign.description}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Orçamento</span>
              <p className="text-foreground mt-0.5">
                {campaign.budget_cents ? `R$ ${(campaign.budget_cents / 100).toFixed(2)}` : 'Não definido'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Período</span>
              <p className="text-foreground mt-0.5">
                {campaign.starts_at
                  ? format(new Date(campaign.starts_at), 'dd/MM/yyyy', { locale: ptBR })
                  : '—'}{' '}
                →{' '}
                {campaign.ends_at
                  ? format(new Date(campaign.ends_at), 'dd/MM/yyyy', { locale: ptBR })
                  : '—'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Criada em</span>
              <p className="text-foreground mt-0.5">
                {format(new Date(campaign.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Audience & Platforms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Público & Canais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {audience?.age_range && (
              <div>
                <span className="text-muted-foreground">Faixa etária</span>
                <p className="text-foreground mt-0.5">{audience.age_range}</p>
              </div>
            )}
            {audience?.location && (
              <div>
                <span className="text-muted-foreground">Localização</span>
                <p className="text-foreground mt-0.5">{audience.location}</p>
              </div>
            )}
            {audience?.interests && audience.interests.length > 0 && (
              <div>
                <span className="text-muted-foreground">Interesses</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {audience.interests.map((i, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {i}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Plataformas</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {campaign.platforms?.length ? (
                  campaign.platforms.map((p) => (
                    <Badge key={p} variant="secondary" className="capitalize text-xs">
                      {p}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">Nenhuma</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics placeholder */}
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            📊 Métricas da campanha estarão disponíveis em breve
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
