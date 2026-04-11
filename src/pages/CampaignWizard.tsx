import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCampaigns, CAMPAIGN_TEMPLATES } from '@/hooks/useCampaigns';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type SocialPlatform = Database['public']['Enums']['social_platform'];

const ALL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'wordpress', label: 'WordPress' },
];

const STEPS = ['Objetivo', 'Público-Alvo', 'Canais', 'Orçamento', 'Cronograma'];

interface WizardData {
  name: string;
  description: string;
  objective: string;
  target_audience: { age_range: string; location: string; interests: string[] };
  platforms: SocialPlatform[];
  budget_cents: number;
  starts_at: Date | undefined;
  ends_at: Date | undefined;
}

const initialData: WizardData = {
  name: '',
  description: '',
  objective: '',
  target_audience: { age_range: '18-45', location: '', interests: [] },
  platforms: [],
  budget_cents: 0,
  starts_at: undefined,
  ends_at: undefined,
};

export default function CampaignWizard() {
  const navigate = useNavigate();
  const { createCampaign } = useCampaigns();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [interestInput, setInterestInput] = useState('');
  const [saving, setSaving] = useState(false);

  const applyTemplate = (tpl: (typeof CAMPAIGN_TEMPLATES)[0]) => {
    setData((d) => ({
      ...d,
      objective: tpl.defaults.objective ?? '',
      platforms: (tpl.defaults.platforms as SocialPlatform[]) ?? [],
      target_audience: {
        ...d.target_audience,
        ...(tpl.defaults.target_audience as any),
      },
    }));
    toast({ title: `Template "${tpl.name}" aplicado!` });
  };

  const addInterest = () => {
    if (interestInput.trim()) {
      setData((d) => ({
        ...d,
        target_audience: {
          ...d.target_audience,
          interests: [...d.target_audience.interests, interestInput.trim()],
        },
      }));
      setInterestInput('');
    }
  };

  const removeInterest = (idx: number) => {
    setData((d) => ({
      ...d,
      target_audience: {
        ...d.target_audience,
        interests: d.target_audience.interests.filter((_, i) => i !== idx),
      },
    }));
  };

  const togglePlatform = (p: SocialPlatform) => {
    setData((d) => ({
      ...d,
      platforms: d.platforms.includes(p)
        ? d.platforms.filter((x) => x !== p)
        : [...d.platforms, p],
    }));
  };

  const canProceed = () => {
    if (step === 0) return data.name.trim().length > 0;
    if (step === 2) return data.platforms.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await createCampaign.mutateAsync({
        name: data.name,
        description: data.description || null,
        objective: data.objective || null,
        target_audience: data.target_audience,
        platforms: data.platforms,
        budget_cents: data.budget_cents,
        starts_at: data.starts_at?.toISOString() ?? null,
        ends_at: data.ends_at?.toISOString() ?? null,
        status: 'draft',
      });
      toast({ title: 'Campanha criada com sucesso!' });
      navigate('/dashboard/campaigns');
    } catch {
      toast({ title: 'Erro ao criar campanha', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/campaigns')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">Nova Campanha</h1>
          <p className="text-sm text-muted-foreground">Passo {step + 1} de {STEPS.length}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={cn(
                'flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold shrink-0 transition-colors',
                i < step
                  ? 'bg-primary text-primary-foreground'
                  : i === step
                  ? 'bg-primary/20 text-primary border-2 border-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-1 rounded',
                  i < step ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{STEPS[step]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 0 && (
                <>
                  {/* Templates */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Templates rápidos</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {CAMPAIGN_TEMPLATES.map((tpl) => (
                        <Button
                          key={tpl.objective}
                          variant="outline"
                          size="sm"
                          className="justify-start gap-2 h-auto py-2"
                          onClick={() => applyTemplate(tpl)}
                        >
                          <span>{tpl.icon}</span>
                          <span className="text-left text-xs">{tpl.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome da campanha *</Label>
                    <Input
                      value={data.name}
                      onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                      placeholder="Ex: Black Friday 2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={data.description}
                      onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))}
                      placeholder="Descreva o objetivo principal da campanha..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Objetivo</Label>
                    <Input
                      value={data.objective}
                      onChange={(e) => setData((d) => ({ ...d, objective: e.target.value }))}
                      placeholder="Ex: awareness, engajamento, vendas"
                    />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>Faixa etária</Label>
                    <Input
                      value={data.target_audience.age_range}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          target_audience: { ...d.target_audience, age_range: e.target.value },
                        }))
                      }
                      placeholder="Ex: 25-45"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Localização</Label>
                    <Input
                      value={data.target_audience.location}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          target_audience: { ...d.target_audience, location: e.target.value },
                        }))
                      }
                      placeholder="Ex: Brasil, São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Interesses</Label>
                    <div className="flex gap-2">
                      <Input
                        value={interestInput}
                        onChange={(e) => setInterestInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                        placeholder="Adicionar interesse..."
                      />
                      <Button type="button" size="sm" onClick={addInterest}>
                        +
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {data.target_audience.interests.map((int, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeInterest(idx)}
                        >
                          {int} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Selecione as plataformas para esta campanha
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {ALL_PLATFORMS.map((p) => (
                      <label
                        key={p.value}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                          data.platforms.includes(p.value)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30'
                        )}
                      >
                        <Checkbox
                          checked={data.platforms.includes(p.value)}
                          onCheckedChange={() => togglePlatform(p.value)}
                        />
                        <span className="text-sm font-medium">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label>Orçamento total (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={data.budget_cents ? (data.budget_cents / 100).toFixed(2) : ''}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          budget_cents: Math.round(parseFloat(e.target.value || '0') * 100),
                        }))
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco ou zero se não houver orçamento definido
                    </p>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de início</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !data.starts_at && 'text-muted-foreground')}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {data.starts_at ? format(data.starts_at, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={data.starts_at} onSelect={(d) => setData((prev) => ({ ...prev, starts_at: d }))} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Data de término</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !data.ends_at && 'text-muted-foreground')}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {data.ends_at ? format(data.ends_at, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={data.ends_at} onSelect={(d) => setData((prev) => ({ ...prev, ends_at: d }))} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Review */}
                  <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> Resumo da Campanha
                    </h4>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p><strong className="text-foreground">Nome:</strong> {data.name}</p>
                      {data.objective && <p><strong className="text-foreground">Objetivo:</strong> {data.objective}</p>}
                      <p><strong className="text-foreground">Canais:</strong> {data.platforms.join(', ') || 'Nenhum'}</p>
                      {data.budget_cents > 0 && (
                        <p><strong className="text-foreground">Orçamento:</strong> R$ {(data.budget_cents / 100).toFixed(2)}</p>
                      )}
                      {data.starts_at && (
                        <p><strong className="text-foreground">Período:</strong> {format(data.starts_at, 'dd/MM/yyyy', { locale: ptBR })} {data.ends_at ? `— ${format(data.ends_at, 'dd/MM/yyyy', { locale: ptBR })}` : ''}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => (step === 0 ? navigate('/dashboard/campaigns') : setStep(step - 1))}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {step === 0 ? 'Cancelar' : 'Voltar'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Próximo <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={saving || !canProceed()}>
            {saving ? 'Criando...' : 'Criar Campanha'} <Check className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
