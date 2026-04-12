import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Users, Megaphone, Orbit, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingWizardProps {
  userId: string;
  onComplete: () => void;
}

const STEPS = [
  { icon: Sparkles, title: 'Bem-vindo ao Magic Constellation!', description: 'Vamos configurar sua conta em poucos passos.' },
  { icon: Users, title: 'Conecte uma Rede Social', description: 'Conecte suas redes para publicar automaticamente.' },
  { icon: Megaphone, title: 'Crie sua Primeira Campanha', description: 'Organize seu conteúdo com campanhas inteligentes.' },
  { icon: Orbit, title: 'Explore a Constelação', description: 'Visualize e gerencie seus agentes de IA em 3D.' },
];

export function OnboardingWizard({ userId, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const markComplete = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId);
    setSaving(false);
    onComplete();
  };

  const handleNext = async () => {
    if (step === 0 && (fullName || company)) {
      const updates: Record<string, string> = {};
      if (fullName) updates.full_name = fullName;
      if (company) updates.company = company;
      await supabase.from('profiles').update(updates).eq('id', userId);
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await markComplete();
      toast.success('Onboarding completo! Aproveite a plataforma.');
    }
  };

  const handleSkip = async () => {
    await markComplete();
  };

  const handleAction = (idx: number) => {
    if (idx === 1) navigate('/dashboard/social');
    if (idx === 2) navigate('/dashboard/campaigns/new');
    if (idx === 3) navigate('/dashboard/constellation');
  };

  const StepIcon = STEPS[step].icon;

  return (
    <Dialog open onOpenChange={() => handleSkip()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StepIcon className="h-5 w-5 text-primary" />
            {STEPS[step].title}
          </DialogTitle>
          <DialogDescription>{STEPS[step].description}</DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-2 w-2 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 py-2"
          >
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Seu nome</Label>
                  <Input id="fullName" placeholder="Ex: João Silva" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa (opcional)</Label>
                  <Input id="company" placeholder="Ex: Minha Agência" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
              </>
            )}
            {step >= 1 && (
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <StepIcon className="h-8 w-8 text-primary" />
                </div>
                <Button variant="outline" onClick={() => handleAction(step)}>
                  {step === 1 && 'Ir para Redes Sociais'}
                  {step === 2 && 'Criar Campanha'}
                  {step === 3 && 'Abrir Constelação'}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={handleSkip} disabled={saving}>
            Pular
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
            )}
            <Button size="sm" onClick={handleNext} disabled={saving}>
              {step === STEPS.length - 1 ? (
                <><Check className="h-4 w-4 mr-1" /> Concluir</>
              ) : (
                <>Próximo <ChevronRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
