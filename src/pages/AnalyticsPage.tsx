import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  Eye,
  MousePointerClick,
  Heart,
  TrendingUp,
  Loader2,
} from "lucide-react";

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "hsl(210, 80%, 55%)",
  instagram: "hsl(330, 70%, 55%)",
  facebook: "hsl(220, 60%, 50%)",
  twitter: "hsl(200, 80%, 55%)",
  tiktok: "hsl(170, 60%, 45%)",
  youtube: "hsl(0, 80%, 55%)",
  pinterest: "hsl(0, 65%, 48%)",
  wordpress: "hsl(205, 65%, 45%)",
};

const PERIOD_OPTIONS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

interface MetricsData {
  platform: string | null;
  impressions: number | null;
  clicks: number | null;
  engagements: number | null;
  ctr: number | null;
  measured_at: string;
}

interface PostData {
  platform: string;
  published_at: string | null;
  status: string;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [metrics, setMetrics] = useState<MetricsData[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - parseInt(period));

      const [metricsRes, postsRes] = await Promise.all([
        supabase
          .from("campaign_metrics")
          .select("platform, impressions, clicks, engagements, ctr, measured_at")
          .eq("user_id", user.id)
          .gte("measured_at", since.toISOString())
          .order("measured_at", { ascending: true }),
        supabase
          .from("scheduled_posts")
          .select("platform, published_at, status")
          .eq("user_id", user.id)
          .gte("created_at", since.toISOString()),
      ]);

      setMetrics((metricsRes.data as MetricsData[]) || []);
      setPosts((postsRes.data as PostData[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [user, period]);

  const filtered = platformFilter === "all"
    ? metrics
    : metrics.filter((m) => m.platform === platformFilter);

  // KPIs
  const totalImpressions = filtered.reduce((s, m) => s + (m.impressions || 0), 0);
  const totalClicks = filtered.reduce((s, m) => s + (m.clicks || 0), 0);
  const totalEngagements = filtered.reduce((s, m) => s + (m.engagements || 0), 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  // Platform breakdown
  const platformMap = new Map<string, { impressions: number; clicks: number; engagements: number }>();
  filtered.forEach((m) => {
    const p = m.platform || "other";
    const cur = platformMap.get(p) || { impressions: 0, clicks: 0, engagements: 0 };
    cur.impressions += m.impressions || 0;
    cur.clicks += m.clicks || 0;
    cur.engagements += m.engagements || 0;
    platformMap.set(p, cur);
  });
  const platformData = Array.from(platformMap.entries()).map(([name, data]) => ({
    name,
    ...data,
    fill: PLATFORM_COLORS[name] || "hsl(var(--primary))",
  }));

  // Posts timeline (published by day)
  const publishedPosts = posts.filter((p) => p.status === "published" && p.published_at);
  const dayMap = new Map<string, number>();
  publishedPosts.forEach((p) => {
    const day = p.published_at!.slice(0, 10);
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  });
  const timelineData = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, posts: count }));

  // Platform distribution for pie
  const postPlatformMap = new Map<string, number>();
  posts.forEach((p) => {
    postPlatformMap.set(p.platform, (postPlatformMap.get(p.platform) || 0) + 1);
  });
  const pieData = Array.from(postPlatformMap.entries()).map(([name, value]) => ({
    name,
    value,
    fill: PLATFORM_COLORS[name] || "hsl(var(--primary))",
  }));

  const uniquePlatforms = [...new Set(metrics.map((m) => m.platform).filter(Boolean))] as string[];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground">Métricas de desempenho das publicações</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uniquePlatforms.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Eye} label="Impressões" value={totalImpressions.toLocaleString("pt-BR")} />
        <KPICard icon={MousePointerClick} label="Cliques" value={totalClicks.toLocaleString("pt-BR")} />
        <KPICard icon={Heart} label="Engajamentos" value={totalEngagements.toLocaleString("pt-BR")} />
        <KPICard icon={TrendingUp} label="CTR Médio" value={`${avgCTR}%`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform metrics bar chart */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Métricas por Plataforma</CardTitle></CardHeader>
          <CardContent className="h-72">
            {platformData.length === 0 ? (
              <EmptyChart message="Sem dados de métricas para este período" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="impressions" name="Impressões" fill="hsl(210, 80%, 55%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" name="Cliques" fill="hsl(150, 60%, 50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="engagements" name="Engajamentos" fill="hsl(280, 60%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Posts timeline area chart */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Timeline de Publicações</CardTitle></CardHeader>
          <CardContent className="h-72">
            {timelineData.length === 0 ? (
              <EmptyChart message="Sem publicações neste período" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="posts" name="Posts" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Platform distribution pie */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Distribuição por Plataforma</CardTitle></CardHeader>
          <CardContent className="h-72">
            {pieData.length === 0 ? (
              <EmptyChart message="Sem posts agendados neste período" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Summary stats */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Resumo do Período</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total de posts</span>
              <Badge variant="secondary">{posts.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Publicados</span>
              <Badge variant="secondary">{publishedPosts.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Na fila</span>
              <Badge variant="outline">{posts.filter((p) => p.status === "queued").length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Falhas</span>
              <Badge variant="destructive">{posts.filter((p) => p.status === "failed").length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Plataformas ativas</span>
              <Badge variant="secondary">{uniquePlatforms.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Dados de métricas</span>
              <Badge variant="secondary">{metrics.length} registros</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
      {message}
    </div>
  );
}
