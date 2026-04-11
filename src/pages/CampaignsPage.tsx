import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Copy, Archive, MoreHorizontal, Megaphone, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCampaigns,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_TRANSITIONS,
} from '@/hooks/useCampaigns';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type CampaignStatus = Database['public']['Enums']['campaign_status'];

const STATUS_TABS: { label: string; value: CampaignStatus | 'all' }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Rascunho', value: 'draft' },
  { label: 'Ativas', value: 'active' },
  { label: 'Pausadas', value: 'paused' },
  { label: 'Concluídas', value: 'completed' },
  { label: 'Arquivadas', value: 'archived' },
];

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<CampaignStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const { campaigns, isLoading, updateCampaign, duplicateCampaign, deleteCampaign } = useCampaigns(
    activeTab === 'all' ? undefined : activeTab
  );

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = async (id: string, status: CampaignStatus) => {
    try {
      await updateCampaign.mutateAsync({ id, status });
      toast({ title: `Campanha ${STATUS_LABELS[status].toLowerCase()}` });
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (campaign: (typeof campaigns)[0]) => {
    try {
      await duplicateCampaign.mutateAsync(campaign);
      toast({ title: 'Campanha duplicada!' });
    } catch {
      toast({ title: 'Erro ao duplicar', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Campanhas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie suas campanhas de marketing
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/campaigns/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campanhas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={activeTab === tab.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.value)}
              className="whitespace-nowrap"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-foreground mb-1">Nenhuma campanha encontrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie sua primeira campanha para começar
            </p>
            <Button onClick={() => navigate('/dashboard/campaigns/new')} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nova Campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((campaign, i) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:border-primary/40 transition-colors group"
                onClick={() => navigate(`/dashboard/campaigns/${campaign.id}`)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">{campaign.name}</h3>
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {campaign.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        {STATUS_TRANSITIONS[campaign.status].map((s) => (
                          <DropdownMenuItem key={s} onClick={() => handleStatusChange(campaign.id, s)}>
                            {s === 'active' ? 'Ativar' : s === 'paused' ? 'Pausar' : s === 'completed' ? 'Concluir' : 'Arquivar'}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem onClick={() => handleDuplicate(campaign)}>
                          <Copy className="h-3.5 w-3.5 mr-2" /> Duplicar
                        </DropdownMenuItem>
                        {campaign.status === 'draft' && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteCampaign.mutate(campaign.id)}
                          >
                            <Archive className="h-3.5 w-3.5 mr-2" /> Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={STATUS_COLORS[campaign.status]} variant="secondary">
                      {STATUS_LABELS[campaign.status]}
                    </Badge>
                    {campaign.platforms?.map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px] capitalize">
                        {p}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <span>
                      {campaign.budget_cents
                        ? `R$ ${(campaign.budget_cents / 100).toFixed(2)}`
                        : 'Sem orçamento'}
                    </span>
                    <span>
                      {new Date(campaign.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
