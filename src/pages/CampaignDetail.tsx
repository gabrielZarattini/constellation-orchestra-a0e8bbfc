import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCampaign, useCampaigns, STATUS_LABELS, STATUS_COLORS, STATUS_TRANSITIONS } from '@/hooks/useCampaigns';
import { useAuth } from '@/hooks/useAuth';
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

interface SEMResult {
  ad_copies: { headline: string; description: string; cta: string }[];
  cpc_estimates: { platform: string; cpc_min_brl: number; cpc_max_brl: number; daily_budget_suggested_brl?: number }[];
  negative_keywords: string[];
  positive_keywords: string[];
  quality_score: number;
  optimizations: string[];
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: campaign, isLoading } = useCampaign(id);
  const { updateCampaign } = useCampaigns();

  const [semOpen, setSemOpen] = useState(false);
  const [semLoading, setSemLoading] = useState(false);
  const [semResult, setSemResult] = useState<SEMResult | null>(null);

  const handleStatus = async (status: CampaignStatus) => {
    try {
      await updateCampaign.mutateAsync({ id: id!, status });
      toast({ title: `Campanha ${STATUS_LABELS[status].toLowerCase()}` });
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const handleAnalyzeSEM = async () => {
    if (!campaign || !session) return;
    setSemLoading(true);
    setSemOpen(true);
    setSemResult(null);
    try {
      const audience = campaign.target_audience as { age_range?: string; location?: string; interests?: string[] } | null;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-sem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          campaign_name: campaign.name,
          objective: campaign.objective,
          target_audience: audience,
          platforms: campaign.platforms,
          budget_cents: campaign.budget_cents,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Erro na análise SEM');
      }
      const data = await resp.json();
      setSemResult(data);
    } catch (e: any) {
      toast({ title: e.message || 'Erro na análise SEM', variant: 'destructive' });
      setSemOpen(false);
    } finally {
      setSemLoading(false);
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
        <Button variant="link" onClick={() => navigate('/dashboard/campaigns')}>Voltar</Button>
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

      {/* Status Actions + SEM */}
      <div className="flex gap-2 flex-wrap">
        {transitions.map((s) => (
          <Button key={s} variant={s === 'active' ? 'default' : 'outline'} size="sm" onClick={() => handleStatus(s)} disabled={updateCampaign.isPending}>
            {ACTION_LABELS[s] || s}
          </Button>
        ))}
        {campaign.budget_cents && campaign.budget_cents > 0 && (
          <Button variant="outline" size="sm" onClick={handleAnalyzeSEM} disabled={semLoading} className="ml-auto">
            <Megaphone className="h-4 w-4 mr-1" />
            Analisar SEM
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Info */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Detalhes</CardTitle></CardHeader>
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
                {campaign.starts_at ? format(new Date(campaign.starts_at), 'dd/MM/yyyy', { locale: ptBR }) : '—'} → {campaign.ends_at ? format(new Date(campaign.ends_at), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Criada em</span>
              <p className="text-foreground mt-0.5">{format(new Date(campaign.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </CardContent>
        </Card>

        {/* Audience & Platforms */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Público & Canais</CardTitle></CardHeader>
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
                    <Badge key={idx} variant="outline" className="text-xs">{i}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Plataformas</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {campaign.platforms?.length ? (
                  campaign.platforms.map((p) => (
                    <Badge key={p} variant="secondary" className="capitalize text-xs">{p}</Badge>
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
          <p className="text-sm text-muted-foreground">📊 Métricas da campanha estarão disponíveis em breve</p>
        </CardContent>
      </Card>

      {/* SEM Dialog */}
      <Dialog open={semOpen} onOpenChange={setSemOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Análise SEM — {campaign.name}
            </DialogTitle>
          </DialogHeader>

          {semLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-sm text-muted-foreground">Analisando com IA...</span>
            </div>
          )}

          {semResult && (
            <div className="space-y-5">
              {/* Quality Score */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Quality Score:</span>
                <Badge variant={semResult.quality_score >= 7 ? 'default' : semResult.quality_score >= 4 ? 'secondary' : 'destructive'} className="text-lg px-3">
                  {semResult.quality_score}/10
                </Badge>
              </div>

              {/* Ad Copies */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Sugestões de Anúncio</h3>
                <div className="grid gap-3">
                  {semResult.ad_copies.map((ad, i) => (
                    <Card key={i}>
                      <CardContent className="p-3 space-y-1">
                        <p className="font-semibold text-sm text-primary">{ad.headline}</p>
                        <p className="text-sm text-foreground">{ad.description}</p>
                        <Badge variant="outline" className="text-xs">{ad.cta}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* CPC Estimates */}
              <div>
                <h3 className="text-sm font-semibold mb-2">CPC Estimado por Plataforma</h3>
                <div className="grid gap-2">
                  {semResult.cpc_estimates.map((est, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                      <span className="capitalize font-medium">{est.platform}</span>
                      <span>R$ {est.cpc_min_brl.toFixed(2)} – R$ {est.cpc_max_brl.toFixed(2)}</span>
                      {est.daily_budget_suggested_brl && (
                        <Badge variant="secondary" className="text-xs">Diário: R$ {est.daily_budget_suggested_brl.toFixed(2)}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-green-500">Keywords Positivas</h3>
                  <div className="flex flex-wrap gap-1">
                    {semResult.positive_keywords.map((k, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{k}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-red-400">Keywords Negativas</h3>
                  <div className="flex flex-wrap gap-1">
                    {semResult.negative_keywords.map((k, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{k}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optimizations */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Otimizações Sugeridas</h3>
                <ul className="space-y-1">
                  {semResult.optimizations.map((o, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span> {o}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
