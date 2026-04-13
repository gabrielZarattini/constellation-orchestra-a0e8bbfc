import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, MousePointerClick, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface ROIData {
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  apiCostCredits: number;
  estimatedRevenue: number;
  roi: number;
}

const AVG_PLAN_VALUE = 79; // Pro plan average $79

export function ROIWidget() {
  const { user } = useAuth();
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [metrics, usage] = await Promise.all([
        supabase.from('campaign_metrics').select('clicks, impressions, conversions').eq('user_id', user.id),
        supabase.from('usage_tracking').select('credits_consumed').eq('user_id', user.id),
      ]);

      const totalClicks = (metrics.data || []).reduce((s, m) => s + (m.clicks || 0), 0);
      const totalImpressions = (metrics.data || []).reduce((s, m) => s + (m.impressions || 0), 0);
      const totalConversions = (metrics.data || []).reduce((s, m) => s + (m.conversions || 0), 0);
      const apiCostCredits = (usage.data || []).reduce((s, u) => s + (u.credits_consumed || 0), 0);
      const estimatedRevenue = totalConversions * AVG_PLAN_VALUE;
      const apiCostDollars = apiCostCredits * 0.01; // 1 credit ≈ $0.01
      const roi = apiCostDollars > 0 ? ((estimatedRevenue - apiCostDollars) / apiCostDollars) * 100 : 0;

      setData({ totalClicks, totalImpressions, totalConversions, apiCostCredits, estimatedRevenue, roi });
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!data) return null;

  const stats = [
    { icon: MousePointerClick, label: 'Cliques Totais', value: data.totalClicks.toLocaleString(), color: 'text-blue-400' },
    { icon: ArrowUpRight, label: 'Conversões', value: data.totalConversions.toLocaleString(), color: 'text-green-400' },
    { icon: DollarSign, label: 'Receita Estimada', value: `$${data.estimatedRevenue.toLocaleString()}`, color: 'text-yellow-400' },
    { icon: TrendingUp, label: 'ROI', value: `${data.roi.toFixed(0)}%`, color: data.roi > 0 ? 'text-green-400' : 'text-red-400' },
  ];

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          ROI da Orquestração
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.color} shrink-0`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Custo API: {data.apiCostCredits} créditos · {data.totalImpressions.toLocaleString()} impressões
        </div>
      </CardContent>
    </Card>
  );
}
