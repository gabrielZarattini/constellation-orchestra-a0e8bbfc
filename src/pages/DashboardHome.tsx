import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Zap,
  BarChart3,
  Megaphone,
  Share2,
  CalendarCheck,
  Activity,
  Clock,
  TrendingUp,
  Send,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Sparkles,
  ArrowUpRight,
  Loader2,
  HeartPulse,
  Shield,
  History,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { format, parseISO, startOfDay, endOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { ConstellationWidget } from '@/components/dashboard/ConstellationWidget';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'hsl(210, 80%, 55%)',
  instagram: 'hsl(330, 70%, 55%)',
  facebook: 'hsl(220, 60%, 50%)',
  twitter: 'hsl(200, 80%, 55%)',
  tiktok: 'hsl(0, 0%, 10%)',
  youtube: 'hsl(0, 80%, 55%)',
  pinterest: 'hsl(0, 65%, 48%)',
  wordpress: 'hsl(205, 65%, 45%)',
};

const engagementData = [
  { day: 'Seg', engajamento: 120, impressoes: 2400 },
  { day: 'Ter', engajamento: 180, impressoes: 3100 },
  { day: 'Qua', engajamento: 150, impressoes: 2800 },
  { day: 'Qui', engajamento: 260, impressoes: 4200 },
  { day: 'Sex', engajamento: 320, impressoes: 5100 },
  { day: 'Sáb', engajamento: 210, impressoes: 3600 },
  { day: 'Dom', engajamento: 190, impressoes: 3200 },
];

const platformData = [
  { name: 'Instagram', value: 35 },
  { name: 'LinkedIn', value: 25 },
  { name: 'Facebook', value: 20 },
  { name: 'Twitter', value: 12 },
  { name: 'TikTok', value: 8 },
];

const PIE_COLORS = ['hsl(330, 70%, 55%)', 'hsl(210, 80%, 55%)', 'hsl(220, 60%, 50%)', 'hsl(200, 80%, 55%)', 'hsl(0, 0%, 40%)'];

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="glass-panel hover:border-primary/30 transition-colors">
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
              <p className="font-heading text-2xl font-bold mt-1 text-foreground">{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const IMPACT_COLORS: Record<string, string> = {
  high: 'text-green-400 bg-green-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  low: 'text-muted-foreground bg-muted/50',
};
const CATEGORY_LABELS: Record<string, string> = {
  schedule: '📅 Horários',
  platform: '📱 Plataformas',
  content: '📝 Conteúdo',
  budget: '💰 Orçamento',
};

interface OptimizationResult {
  score: number;
  summary: string;
  recommendations: Array<{ category: string; title: string; description: string; impact: string; action: string }>;
  best_times: Array<{ day: string; hour: string; platform: string }>;
  top_platforms: string[];
  content_mix: Array<{ type: string; percentage: number }>;
}

interface HealingResult {
  total_issues: number;
  resolved: number;
  needs_attention: number;
  actions: Array<{
    issue_type: string;
    issue_details: string;
    action_taken: string;
    success: boolean;
    related_resource_type?: string;
  }>;
}

interface OptimizationHistoryItem {
  id: string;
  action_type: string;
  action_details: any;
  context: any;
  applied: boolean;
  created_at: string;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const {
    credits,
    subscription,
    totalPosts,
    totalCampaigns,
    socialAccounts,
    recentNotifications,
    recentActivity,
    loading,
  } = useDashboardData();

  const now = new Date();
  const { data: upcomingPosts } = useScheduledPosts({ from: startOfDay(now), to: endOfDay(addDays(now, 7)) });

  const [optimizing, setOptimizing] = useState(false);
  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);
  const [healing, setHealing] = useState(false);
  const [healResult, setHealResult] = useState<HealingResult | null>(null);
  const [optHistory, setOptHistory] = useState<OptimizationHistoryItem[]>([]);

  // Fetch optimization history
  useEffect(() => {
    if (!user) return;
    supabase
      .from('optimization_policy')
      .select('id, action_type, action_details, context, applied, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setOptHistory(data as OptimizationHistoryItem[]);
      });
  }, [user, optResult]); // refetch after new optimization

  const planLabel = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : 'Free';

  const statusBadge: Record<string, string> = {
    active: 'bg-status-active/20 text-green-400',
    trialing: 'bg-status-waiting/20 text-amber-400',
    past_due: 'bg-destructive/20 text-destructive',
    canceled: 'bg-muted text-muted-foreground',
  };

  const runOptimization = async () => {
    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('self-optimize');
      if (error) throw error;
      setOptResult(data as OptimizationResult);
      toast.success('Análise concluída!');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao otimizar');
    } finally {
      setOptimizing(false);
    }
  };

  const runHealing = async () => {
    setHealing(true);
    try {
      const { data, error } = await supabase.functions.invoke('self-heal');
      if (error) throw error;
      setHealResult(data as HealingResult);
      if ((data as HealingResult).total_issues === 0) {
        toast.success('Nenhum problema encontrado! Tudo funcionando.');
      } else {
        toast.success(`Diagnóstico concluído: ${(data as HealingResult).resolved} resolvidos, ${(data as HealingResult).needs_attention} pendentes`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro no diagnóstico');
    } finally {
      setHealing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Visão Geral</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Plano {planLabel}{' '}
          <Badge variant="outline" className={statusBadge[subscription?.status || 'trialing'] || ''}>
            {subscription?.status === 'trialing' ? 'Trial' : subscription?.status || 'trial'}
          </Badge>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Zap} label="Créditos de IA" value={credits?.balance ?? 0} sub={`${credits?.lifetime_spent ?? 0} gastos no total`} color="bg-primary/15 text-primary" delay={0} />
        <KpiCard icon={CalendarCheck} label="Posts Agendados" value={totalPosts} color="bg-accent/15 text-accent" delay={0.08} />
        <KpiCard icon={Megaphone} label="Campanhas" value={totalCampaigns} color="bg-status-waiting/15 text-amber-400" delay={0.16} />
        <KpiCard icon={Share2} label="Redes Conectadas" value={socialAccounts} sub="de 8 disponíveis" color="bg-status-active/15 text-green-400" delay={0.24} />
      </div>

      {/* Self-Optimization + Self-Healing row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Self-Optimization Widget */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <Card className="glass-panel border-primary/20 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Auto-otimização IA
                <Badge variant="outline" className="ml-auto text-[10px]">Fase 16</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!optResult ? (
                <div className="flex flex-col items-center py-6 gap-4">
                  <Sparkles className="h-10 w-10 text-primary/60" />
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Analise suas métricas com IA para recomendações personalizadas.
                  </p>
                  <Button onClick={runOptimization} disabled={optimizing} className="gap-2">
                    {optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                    {optimizing ? 'Analisando...' : 'Analisar e Otimizar'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">{optResult.score}</p>
                      <p className="text-[10px] text-muted-foreground">Score</p>
                    </div>
                    <div className="flex-1">
                      <Progress value={optResult.score} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{optResult.summary}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={runOptimization} disabled={optimizing} className="gap-1">
                      {optimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUpRight className="h-3 w-3" />}
                      Reanalisar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recomendações</p>
                    {optResult.recommendations.slice(0, 4).map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30 text-sm">
                        <span className="text-xs mt-0.5">{CATEGORY_LABELS[rec.category] || rec.category}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-xs">{rec.title}</p>
                          <p className="text-[11px] text-muted-foreground">{rec.description}</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${IMPACT_COLORS[rec.impact] || ''}`}>
                          {rec.impact}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Self-Healing Widget */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <Card className="glass-panel border-accent/20 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-accent" />
                Self-Healing
                <Badge variant="outline" className="ml-auto text-[10px]">Fase 17</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!healResult ? (
                <div className="flex flex-col items-center py-6 gap-4">
                  <Shield className="h-10 w-10 text-accent/60" />
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Detecta posts falhos, tokens expirados e publicações travadas — corrige automaticamente.
                  </p>
                  <Button onClick={runHealing} disabled={healing} variant="outline" className="gap-2 border-accent/30 hover:bg-accent/10">
                    {healing ? <Loader2 className="h-4 w-4 animate-spin" /> : <HeartPulse className="h-4 w-4" />}
                    {healing ? 'Diagnosticando...' : 'Executar Diagnóstico'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-center gap-4">
                    <div className="grid grid-cols-3 gap-3 flex-1">
                      <div className="text-center p-2 rounded-lg bg-secondary/30">
                        <p className="text-xl font-bold text-foreground">{healResult.total_issues}</p>
                        <p className="text-[10px] text-muted-foreground">Problemas</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-green-500/10">
                        <p className="text-xl font-bold text-green-400">{healResult.resolved}</p>
                        <p className="text-[10px] text-muted-foreground">Resolvidos</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-destructive/10">
                        <p className="text-xl font-bold text-destructive">{healResult.needs_attention}</p>
                        <p className="text-[10px] text-muted-foreground">Pendentes</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={runHealing} disabled={healing} className="gap-1">
                      {healing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Rediagnosticar
                    </Button>
                  </div>

                  {/* Actions */}
                  {healResult.total_issues === 0 ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 font-medium">Tudo funcionando corretamente!</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {healResult.actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30 text-xs">
                          {action.success ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{action.issue_details}</p>
                            <p className="text-muted-foreground">{action.action_taken}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Optimization History */}
      {optHistory.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Histórico de Otimizações
                <Badge variant="outline" className="ml-auto text-[10px]">{optHistory.length} registros</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {optHistory.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30 text-sm">
                    <span className="text-xs mt-0.5">{CATEGORY_LABELS[item.action_type] || item.action_type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-xs">{item.action_details?.title || item.action_type}</p>
                      <p className="text-[11px] text-muted-foreground">{item.action_details?.description || ''}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${item.applied ? 'text-green-400 bg-green-400/10' : 'text-muted-foreground bg-muted/50'}`}
                      >
                        {item.applied ? 'Aplicado' : 'Pendente'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(parseISO(item.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Engajamento Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={engagementData}>
                  <defs>
                    <linearGradient id="fillEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(185, 80%, 55%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(185, 80%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis dataKey="day" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 25%)', borderRadius: '8px', color: 'hsl(210, 40%, 92%)', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="engajamento" stroke="hsl(185, 80%, 55%)" fill="url(#fillEngagement)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-panel h-full">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent" />
                Por Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={platformData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {platformData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 30%, 25%)', borderRadius: '8px', color: 'hsl(210, 40%, 92%)', fontSize: '12px' }} formatter={(value: number) => [`${value}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {platformData.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    {p.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <ConstellationWidget />

      {upcomingPosts && upcomingPosts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Próximas Publicações
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {upcomingPosts.filter(p => p.status === 'queued').length} na fila
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingPosts.slice(0, 5).map((post) => (
                  <div key={post.id} className="flex items-center gap-3 text-sm p-2 rounded-md bg-secondary/30">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${
                      post.status === 'published' ? 'bg-green-500' :
                      post.status === 'failed' ? 'bg-destructive' :
                      post.status === 'publishing' ? 'bg-amber-500 animate-pulse' :
                      'bg-primary'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground font-medium capitalize text-xs">{post.platform}</span>
                      <p className="text-[10px] text-muted-foreground">
                        {format(parseISO(post.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {post.status === 'published' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                      {post.status === 'failed' && <AlertTriangle className="h-3 w-3 text-destructive" />}
                      <Badge variant="outline" className="text-[10px]">{post.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Bottom row: activity + notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma atividade registrada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground/90 truncate">
                          <span className="font-medium">{a.action}</span>{' '}
                          <span className="text-muted-foreground">em {a.resource_type}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma notificação no momento.</p>
              ) : (
                <div className="space-y-3">
                  {recentNotifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 text-sm">
                      <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-muted-foreground/40' : 'bg-primary'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground/90 font-medium truncate">{n.title}</p>
                        {n.message && <p className="text-xs text-muted-foreground truncate">{n.message}</p>}
                        <p className="text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
