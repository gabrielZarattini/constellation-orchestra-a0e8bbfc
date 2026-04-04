import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative max-w-3xl mx-auto text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-6">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary font-medium">14 dias grátis</span>
        </div>

        <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
          Pronto para automatizar seu <span className="text-gradient-primary">marketing com IA</span>?
        </h2>

        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Junte-se a centenas de profissionais que já usam o Magic Crew para escalar sua presença digital.
        </p>

        <Button
          size="lg"
          className="text-lg px-10 py-6 glow-primary"
          onClick={() => navigate('/auth')}
        >
          Criar conta gratuita
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </section>
  );
}
