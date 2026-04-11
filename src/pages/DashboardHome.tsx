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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { ConstellationWidget } from '@/components/dashboard/ConstellationWidget';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
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

// Mock engagement data for demo
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

export default function DashboardHome() {
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

  const planLabel = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : 'Free';

  const statusBadge: Record<string, string> = {
    active: 'bg-status-active/20 text-green-400',
    trialing: 'bg-status-waiting/20 text-amber-400',
    past_due: 'bg-destructive/20 text-destructive',
    canceled: 'bg-muted text-muted-foreground',
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
      {/* Page header */}
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Visão Geral</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Plano {planLabel}{' '}
          <Badge variant="outline" className={statusBadge[subscription?.status || 'trialing'] || ''}>
            {subscription?.status === 'trialing' ? 'Trial' : subscription?.status || 'trial'}
          </Badge>
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Zap}
          label="Créditos de IA"
          value={credits?.balance ?? 0}
          sub={`${credits?.lifetime_spent ?? 0} gastos no total`}
          color="bg-primary/15 text-primary"
          delay={0}
        />
        <KpiCard
          icon={CalendarCheck}
          label="Posts Agendados"
          value={totalPosts}
          color="bg-accent/15 text-accent"
          delay={0.08}
        />
        <KpiCard
          icon={Megaphone}
          label="Campanhas"
          value={totalCampaigns}
          color="bg-status-waiting/15 text-amber-400"
          delay={0.16}
        />
        <KpiCard
          icon={Share2}
          label="Redes Conectadas"
          value={socialAccounts}
          sub="de 8 disponíveis"
          color="bg-status-active/15 text-green-400"
          delay={0.24}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Engagement over time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 40%, 10%)',
                      border: '1px solid hsl(222, 30%, 25%)',
                      borderRadius: '8px',
                      color: 'hsl(210, 40%, 92%)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="engajamento"
                    stroke="hsl(185, 80%, 55%)"
                    fill="url(#fillEngagement)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Platform distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
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
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {platformData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 40%, 10%)',
                      border: '1px solid hsl(222, 30%, 25%)',
                      borderRadius: '8px',
                      color: 'hsl(210, 40%, 92%)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Share']}
                  />
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

      {/* Bottom row: activity + notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Nenhuma atividade registrada ainda.
                </p>
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

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Nenhuma notificação no momento.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentNotifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 text-sm">
                      <div
                        className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                          n.read ? 'bg-muted-foreground/40' : 'bg-primary'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground/90 font-medium truncate">{n.title}</p>
                        {n.message && (
                          <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                        )}
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
