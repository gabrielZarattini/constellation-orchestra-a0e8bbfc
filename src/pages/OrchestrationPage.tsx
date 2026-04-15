import { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Loader2, Rocket, CheckCircle2, XCircle, Globe, Linkedin, Twitter, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type StepStatus = 'pending' | 'in_progress' | 'done' | 'error';

interface Step {
  name: string;
  label: string;
  status: StepStatus;
  data?: any;
}

const PLATFORM_OPTIONS = [
  { id: 'wordpress', label: 'WordPress', icon: Globe },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'twitter', label: 'X / Twitter', icon: Twitter },
];

const STEP_LABELS: Record<string, string> = {
  article_generation: 'Gerando Artigo SEO',
  wordpress_publish: 'Publicando no WordPress',
  linkedin_post: 'Criando Post LinkedIn',
  twitter_thread: 'Criando Thread X',
};

export default function OrchestrationPage() {
  const [topic, setTopic] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['wordpress', 'linkedin', 'twitter']);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const togglePlatform = (id: string) => {
    setPlatforms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const runOrchestration = async () => {
    if (!topic.trim()) { toast.error('Informe um tópico'); return; }
    if (platforms.length === 0) { toast.error('Selecione ao menos uma plataforma'); return; }

    setRunning(true);
    setSteps(platforms.map((p) => {
      if (p === 'wordpress') return [
        { name: 'article_generation', label: STEP_LABELS.article_generation, status: 'pending' as StepStatus },
        { name: 'wordpress_publish', label: STEP_LABELS.wordpress_publish, status: 'pending' as StepStatus },
      ];
      if (p === 'linkedin') return [{ name: 'linkedin_post', label: STEP_LABELS.linkedin_post, status: 'pending' as StepStatus }];
      return [{ name: 'twitter_thread', label: STEP_LABELS.twitter_thread, status: 'pending' as StepStatus }];
    }).flat());
    setSummary(null);

    try {
      const { data, error } = await supabase.functions.invoke('orchestrate-content', {
        body: { topic, platforms, affiliate_url: affiliateUrl || undefined },
      });

      if (error) throw error;

      // Map results back to steps
      const resultSteps = (data?.steps || []) as Step[];
      setSteps(resultSteps.map((s: any) => ({
        name: s.name,
        label: STEP_LABELS[s.name] || s.name,
        status: s.status,
        data: s.data,
      })));
      setSummary(data?.summary);

      const errors = resultSteps.filter((s: any) => s.status === 'error');
      if (errors.length > 0) {
        toast.warning(`Orquestração concluída com ${errors.length} erro(s)`);
      } else {
        toast.success('Orquestração concluída com sucesso!');
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro na orquestração');
    } finally {
      setRunning(false);
    }
  };

  const completedSteps = steps.filter((s) => s.status === 'done').length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  return (
    <>
      <Helmet>
        <title>Orquestração | Magic Constellation</title>
      </Helmet>
      <div className="space-y-6 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Orquestração de Conteúdo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gere artigo SEO + posts sociais automaticamente com IA
          </p>
        </motion.div>

        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Novo Lançamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Tópico / Tema</label>
              <Input
                placeholder="Ex: Como a orquestração de agentes 3D está gerando ROI de 400%"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={running}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                URL do Produto Mercado Livre <span className="text-muted-foreground font-normal">(Opcional — Para Monetização)</span>
              </label>
              <Input
                placeholder="https://produto.mercadolivre.com.br/..."
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                disabled={running}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Plataformas</label>
              <div className="flex gap-4">
                {PLATFORM_OPTIONS.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={platforms.includes(p.id)}
                      onCheckedChange={() => togglePlatform(p.id)}
                      disabled={running}
                    />
                    <p.icon className="h-4 w-4" />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={runOrchestration} disabled={running} className="w-full">
              {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
              {running ? 'Orquestrando…' : 'Orquestrar Campanha'}
            </Button>
          </CardContent>
        </Card>

        {/* Progress */}
        {steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Progresso
                <Badge variant={progress === 100 ? 'default' : 'secondary'}>
                  {completedSteps}/{steps.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={progress} className="h-2" />
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  {s.status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />}
                  {s.status === 'error' && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                  {s.status === 'in_progress' && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
                  {s.status === 'pending' && <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />}
                  <span className={s.status === 'done' ? 'text-foreground' : 'text-muted-foreground'}>{s.label}</span>
                  {s.data?.error && <span className="text-xs text-red-400 ml-auto">{s.data.error}</span>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {summary && (
          <Card className="border-green-500/20">
            <CardHeader>
              <CardTitle className="text-base text-green-400">✅ Resumo</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><strong>Tópico:</strong> {summary.topic}</p>
              <p><strong>Plataformas:</strong> {summary.platforms_processed?.join(', ')}</p>
              {summary.wordpress_url && (
                <p><strong>WordPress:</strong>{' '}
                  <a href={summary.wordpress_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {summary.wordpress_url}
                  </a>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Posts sociais foram agendados e serão publicados automaticamente.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
