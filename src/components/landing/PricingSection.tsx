import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

const plans = [
  {
    name: 'Starter',
    price: 'R$ 147',
    period: '/mês',
    description: 'Para criadores e pequenos negócios',
    priceId: 'price_1TLAquKZfElfyPErrAuC95bU',
    features: [
      '3 redes sociais',
      '100 posts/mês',
      '50 créditos de IA',
      'Agendamento inteligente',
      'Analytics básico',
      'Suporte por email',
    ],
    cta: 'Começar grátis',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 'R$ 397',
    period: '/mês',
    description: 'Para agências e equipes de marketing',
    priceId: 'price_1TLArCKZfElfyPErQeOTQv52',
    features: [
      '8 redes sociais',
      'Posts ilimitados',
      '500 créditos de IA',
      'Geração de vídeo e áudio',
      'SEO Engine completo',
      'Auto-otimização',
      'Suporte prioritário',
      '5 membros de equipe',
    ],
    cta: 'Começar grátis',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'R$ 997',
    period: '/mês',
    description: 'Para operações em escala',
    priceId: 'price_1TLArZKZfElfyPErTXLBp0ZF',
    features: [
      'Tudo do Pro',
      'Créditos ilimitados',
      'SEM Engine (Google Ads)',
      'Auto-cura avançada',
      'API pública',
      'White-label',
      'Membros ilimitados',
      'SLA 99.9%',
      'Gerente de sucesso dedicado',
    ],
    cta: 'Falar com vendas',
    highlighted: false,
  },
];

export function PricingSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkout, loading } = useSubscription();

  const handlePlanClick = (plan: typeof plans[0]) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (plan.name === 'Enterprise') {
      window.open('mailto:contato@magiccrew.ai?subject=Plano Enterprise', '_blank');
      return;
    }

    if (plan.priceId) {
      checkout(plan.priceId);
    } else {
      // Stripe products not created yet — redirect to auth
      navigate('/auth');
    }
  };

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Planos que <span className="text-gradient-primary">escalam com você</span>
          </h2>
          <p className="text-muted-foreground text-lg">14 dias grátis em todos os planos. Cancele quando quiser.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className={`rounded-xl p-6 md:p-8 flex flex-col ${
                plan.highlighted
                  ? 'glass-panel border-primary/40 ring-1 ring-primary/20 relative'
                  : 'glass-panel'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  Mais popular
                </div>
              )}

              <h3 className="font-heading font-bold text-xl text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="font-heading text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                variant={plan.highlighted ? 'default' : 'outline'}
                className={`w-full ${plan.highlighted ? 'glow-primary' : ''}`}
                onClick={() => handlePlanClick(plan)}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
