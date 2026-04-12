import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  BarChart3, Eye, MousePointerClick, Heart, TrendingUp,
  DollarSign, Target, Info, GitCompareArrows,
} from "lucide-react";

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "hsl(210, 80%, 55%)", instagram: "hsl(330, 70%, 55%)",
  facebook: "hsl(220, 60%, 50%)", twitter: "hsl(200, 80%, 55%)",
  tiktok: "hsl(170, 60%, 45%)", youtube: "hsl(0, 80%, 55%)",
  pinterest: "hsl(0, 65%, 48%)", wordpress: "hsl(205, 65%, 45%)",
};

const PERIOD_OPTIONS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

const DEMO_METRICS = [
  { platform: "instagram", impressions: 12400, clicks: 620, engagements: 1850, ctr: 5.0, spend_cents: 15000, conversions: 42, measured_at: "", campaign_id: "demo-a" },
  { platform: "facebook", impressions: 8200, clicks: 410, engagements: 980, ctr: 5.0, spend_cents: 12000, conversions: 28, measured_at: "", campaign_id: "demo-a" },
  { platform: "linkedin", impressions: 4500, clicks: 315, engagements: 540, ctr: 7.0, spend_cents: 8000, conversions: 18, measured_at: "", campaign_id: "demo-b" },
  { platform: "twitter", impressions: 6800, clicks: 204, engagements: 720, ctr: 3.0, spend_cents: 5000, conversions: 12, measured_at: "", campaign_id: "demo-b" },
  { platform: "tiktok", impressions: 18000, clicks: 900, engagements: 3200, ctr: 5.0, spend_cents: 10000, conversions: 35, measured_at: "", campaign_id: "demo-a" },
];

const DEMO_CAMPAIGNS = [
  { id: "demo-a", name: "Campanha Demo Alpha" },
  { id: "demo-b", name: "Campanha Demo Beta" },
];

function generateDemoTimeline() {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    data.push({ date: d.toISOString().slice(0, 10), posts: Math.floor(Math.random() * 5) + 1 });
  }
  return data;
}

const DEMO_POSTS = [
  { platform: "instagram", published_at: new Date().toISOString(), status: "published" },
  { platform: "facebook", published_at: new Date().toISOString(), status: "published" },
  { platform: "linkedin", published_at: null, status: "queued" },
  { platform: "twitter", published_at: new Date().toISOString(), status: "published" },
  { platform: "tiktok", published_at: null, status: "failed" },
];

interface MetricsData {
  platform: string | null; impressions: number | null; clicks: number | null;
  engagements: number | null; ctr: number | null; spend_cents?: number | null;
  conversions?: number | null; measured_at: string; campaign_id?: string;
}

interface PostData { platform: string; published_at: string | null; status: string; }
interface CampaignRef { id: string; name: string; }

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [metrics, setMetrics] = useState<MetricsData[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRef[]>([]);
  const [loading, setLoading] = useState(true);

  // Comparison state
  const [campA, setCampA] = useState("");
  const [campB, setCampB] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const since = new Date(); since.setDate(since.getDate() - parseInt(period));
      const [metricsRes, postsRes, campaignsRes] = await Promise.all([
        supabase.from("campaign_metrics")
          .select("platform, impressions, clicks, engagements, ctr, spend_cents, conversions, measured_at, campaign_id")
          .eq("user_id", user.id).gte("measured_at", since.toISOString()).order("measured_at", { ascending: true }),
        supabase.from("scheduled_posts").select("platform, published_at, status")
          .eq("user_id", user.id).gte("created_at", since.toISOString()),
        supabase.from("campaigns").select("id, name").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(50),
      ]);
      setMetrics((metricsRes.data as MetricsData[]) || []);
      setPosts((postsRes.data as PostData[]) || []);
      setCampaigns((campaignsRes.data as CampaignRef[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [user, period]);

  const isDemo = metrics.length === 0 && posts.length === 0;
  const activeMetrics = isDemo ? DEMO_METRICS : metrics;
  const activePosts = isDemo ? DEMO_POSTS : posts;
  const activeCampaigns = isDemo ? DEMO_CAMPAIGNS : campaigns;

  const filtered = platformFilter === "all" ? activeMetrics : activeMetrics.filter((m) => m.platform === platformFilter);

  const totalImpressions = filtered.reduce((s, m) => s + (m.impressions || 0), 0);
  const totalClicks = filtered.reduce((s, m) => s + (m.clicks || 0), 0);
  const totalEngagements = filtered.reduce((s, m) => s + (m.engagements || 0), 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
  const totalSpend = filtered.reduce((s, m) => s + ((m as any).spend_cents || 0), 0);
  const totalConversions = filtered.reduce((s, m) => s + ((m as any).conversions || 0), 0);
  const cpa = totalConversions > 0 ? (totalSpend / 100 / totalConversions).toFixed(2) : "—";
  const roas = totalSpend > 0 ? ((totalConversions * 50) / (totalSpend / 100)).toFixed(2) : "—";

  const platformMap = new Map<string, { impressions: number; clicks: number; engagements: number }>();
  filtered.forEach((m) => {
    const p = m.platform || "other";
    const cur = platformMap.get(p) || { impressions: 0, clicks: 0, engagements: 0 };
    cur.impressions += m.impressions || 0; cur.clicks += m.clicks || 0; cur.engagements += m.engagements || 0;
    platformMap.set(p, cur);
  });
  const platformData = Array.from(platformMap.entries()).map(([name, data]) => ({ name, ...data, fill: PLATFORM_COLORS[name] || "hsl(var(--primary))" }));

  const timelineData = useMemo(() => {
    if (isDemo) return generateDemoTimeline();
    const pub = activePosts.filter((p) => p.status === "published" && p.published_at);
    const dayMap = new Map<string, number>();
    pub.forEach((p) => { const day = p.published_at!.slice(0, 10); dayMap.set(day, (dayMap.get(day) || 0) + 1); });
    return Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, posts: count }));
  }, [isDemo, activePosts]);

  const publishedPosts = activePosts.filter((p) => p.status === "published" && p.published_at);
  const postPlatformMap = new Map<string, number>();
  activePosts.forEach((p) => { postPlatformMap.set(p.platform, (postPlatformMap.get(p.platform) || 0) + 1); });
  const pieData = Array.from(postPlatformMap.entries()).map(([name, value]) => ({ name, value, fill: PLATFORM_COLORS[name] || "hsl(var(--primary))" }));
  const uniquePlatforms = [...new Set(activeMetrics.map((m) => m.platform).filter(Boolean))] as string[];

  // Comparison data
  const compData = useMemo(() => {
    if (!campA || !campB) return null;
    const agg = (cid: string) => {
      const rows = activeMetrics.filter(m => m.campaign_id === cid);
      return {
        impressions: rows.reduce((s, m) => s + (m.impressions || 0), 0),
        clicks: rows.reduce((s, m) => s + (m.clicks || 0), 0),
        engagements: rows.reduce((s, m) => s + (m.engagements || 0), 0),
        spend: rows.reduce((s, m) => s + ((m as any).spend_cents || 0), 0) / 100,
        conversions: rows.reduce((s, m) => s + ((m as any).conversions || 0), 0),
      };
    };
    const a = agg(campA); const b = agg(campB);
    const nameA = activeCampaigns.find(c => c.id === campA)?.name || campA;
    const nameB = activeCampaigns.find(c => c.id === campB)?.name || campB;
    return {
      chart: [
        { metric: "Impressões", [nameA]: a.impressions, [nameB]: b.impressions },
        { metric: "Cliques", [nameA]: a.clicks, [nameB]: b.clicks },
        { metric: "Engajamentos", [nameA]: a.engagements, [nameB]: b.engagements },
        { metric: "Conversões", [nameA]: a.conversions, [nameB]: b.conversions },
      ],
      nameA, nameB, a, b,
    };
  }, [campA, campB, activeMetrics, activeCampaigns]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {isDemo && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span className="text-foreground"><strong>Dados de demonstração</strong> — publique conteúdo e conecte plataformas para ver métricas reais.</span>
          <Badge variant="outline" className="ml-auto text-xs">Demo</Badge>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Analytics
            {isDemo && <Badge variant="secondary" className="text-xs">Demo</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">Métricas de desempenho das publicações</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uniquePlatforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>{PERIOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1"><BarChart3 className="h-3 w-3" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="compare" className="gap-1"><GitCompareArrows className="h-3 w-3" /> Comparativo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard icon={Eye} label="Impressões" value={totalImpressions.toLocaleString("pt-BR")} />
            <KPICard icon={MousePointerClick} label="Cliques" value={totalClicks.toLocaleString("pt-BR")} />
            <KPICard icon={Heart} label="Engajamentos" value={totalEngagements.toLocaleString("pt-BR")} />
            <KPICard icon={TrendingUp} label="CTR Médio" value={`${avgCTR}%`} />
            <KPICard icon={DollarSign} label="Investimento" value={`R$ ${(totalSpend / 100).toFixed(0)}`} />
            <KPICard icon={Target} label="CPA" value={cpa === "—" ? "—" : `R$ ${cpa}`} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Métricas por Plataforma</CardTitle></CardHeader>
              <CardContent className="h-72">
                {platformData.length === 0 ? <EmptyChart message="Sem dados de métricas para este período" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Bar dataKey="impressions" name="Impressões" fill="hsl(210, 80%, 55%)" radius={[4,4,0,0]} />
                      <Bar dataKey="clicks" name="Cliques" fill="hsl(150, 60%, 50%)" radius={[4,4,0,0]} />
                      <Bar dataKey="engagements" name="Engajamentos" fill="hsl(280, 60%, 55%)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Timeline de Publicações</CardTitle></CardHeader>
              <CardContent className="h-72">
                {timelineData.length === 0 ? <EmptyChart message="Sem publicações neste período" /> : (
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

            <Card>
              <CardHeader><CardTitle className="text-sm">Distribuição por Plataforma</CardTitle></CardHeader>
              <CardContent className="h-72">
                {pieData.length === 0 ? <EmptyChart message="Sem posts neste período" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Resumo do Período</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SummaryRow label="Total de posts" value={<Badge variant="secondary">{activePosts.length}</Badge>} />
                <SummaryRow label="Publicados" value={<Badge variant="secondary">{publishedPosts.length}</Badge>} />
                <SummaryRow label="Na fila" value={<Badge variant="outline">{activePosts.filter(p => p.status === "queued").length}</Badge>} />
                <SummaryRow label="Falhas" value={<Badge variant="destructive">{activePosts.filter(p => p.status === "failed").length}</Badge>} />
                <SummaryRow label="Plataformas ativas" value={<Badge variant="secondary">{uniquePlatforms.length}</Badge>} />
                <SummaryRow label="ROAS estimado" value={<Badge variant="secondary">{roas === "—" ? "—" : `${roas}x`}</Badge>} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compare" className="space-y-6 mt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Campanha A:</span>
              <Select value={campA} onValueChange={setCampA}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{activeCampaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <GitCompareArrows className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Campanha B:</span>
              <Select value={campB} onValueChange={setCampB}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{activeCampaigns.filter(c => c.id !== campA).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {compData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">Comparativo de Métricas</CardTitle></CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compData.chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Legend />
                      <Bar dataKey={compData.nameA} fill="hsl(210, 80%, 55%)" radius={[4,4,0,0]} />
                      <Bar dataKey={compData.nameB} fill="hsl(330, 70%, 55%)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Resumo Comparativo</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <CompRow label="Impressões" a={compData.a.impressions.toLocaleString("pt-BR")} b={compData.b.impressions.toLocaleString("pt-BR")} nameA={compData.nameA} nameB={compData.nameB} />
                  <CompRow label="Cliques" a={compData.a.clicks.toLocaleString("pt-BR")} b={compData.b.clicks.toLocaleString("pt-BR")} nameA={compData.nameA} nameB={compData.nameB} />
                  <CompRow label="Engajamentos" a={compData.a.engagements.toLocaleString("pt-BR")} b={compData.b.engagements.toLocaleString("pt-BR")} nameA={compData.nameA} nameB={compData.nameB} />
                  <CompRow label="Investimento" a={`R$ ${compData.a.spend.toFixed(0)}`} b={`R$ ${compData.b.spend.toFixed(0)}`} nameA={compData.nameA} nameB={compData.nameB} />
                  <CompRow label="Conversões" a={String(compData.a.conversions)} b={String(compData.b.conversions)} nameA={compData.nameA} nameB={compData.nameB} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <GitCompareArrows className="h-10 w-10 opacity-40" />
              <p className="text-sm">Selecione duas campanhas para comparar métricas lado a lado.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-primary/10 p-2.5"><Icon className="h-4 w-4 text-primary" /></div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">{label}</span>{value}</div>;
}

function CompRow({ label, a, b, nameA, nameB }: { label: string; a: string; b: string; nameA: string; nameB: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <div className="flex justify-between text-sm">
        <span className="text-foreground">{nameA}: <strong>{a}</strong></span>
        <span className="text-foreground">{nameB}: <strong>{b}</strong></span>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">{message}</div>;
}
