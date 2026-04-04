import { motion } from 'framer-motion';
import { UserPlus, Settings, Rocket, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Crie sua conta',
    description: 'Cadastre-se gratuitamente e conecte suas redes sociais em minutos.',
  },
  {
    icon: Settings,
    step: '02',
    title: 'Configure os agentes',
    description: 'Defina objetivos, público-alvo e canais. A IA monta a equipe ideal de agentes.',
  },
  {
    icon: Rocket,
    step: '03',
    title: 'Lance campanhas',
    description: 'Os agentes geram conteúdo, agendam e publicam automaticamente em todas as redes.',
  },
  {
    icon: TrendingUp,
    step: '04',
    title: 'Escale com dados',
    description: 'A IA otimiza continuamente com base em métricas reais. Você só acompanha os resultados.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Como funciona
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Do zero a campanhas otimizadas em 4 passos simples.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="text-center relative"
            >
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="text-xs font-mono text-primary/60 mb-2">{step.step}</div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
