import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Preciso de experiência com IA para usar o Magic Crew?',
    a: 'Não! A plataforma é feita para ser intuitiva. Você define seus objetivos e os agentes de IA cuidam do resto — desde a criação do conteúdo até a publicação e otimização.',
  },
  {
    q: 'Quais redes sociais são suportadas?',
    a: 'LinkedIn, Instagram, Facebook, X/Twitter, TikTok, YouTube, Pinterest e WordPress. Conecte quantas contas quiser dentro do limite do seu plano.',
  },
  {
    q: 'O que são créditos de IA?',
    a: 'Créditos são usados para gerar conteúdo (textos, imagens, áudios, vídeos). Cada tipo de conteúdo consome uma quantidade diferente de créditos. Créditos não usados acumulam para o próximo mês.',
  },
  {
    q: 'O trial de 14 dias é realmente gratuito?',
    a: 'Sim, 100% gratuito. Não pedimos cartão de crédito. Você tem acesso completo ao plano escolhido durante 14 dias.',
  },
  {
    q: 'A IA realmente publica automaticamente?',
    a: 'Sim. Após conectar suas contas e configurar as preferências, os agentes geram, agendam e publicam conteúdo automaticamente. Você pode revisar antes se preferir.',
  },
  {
    q: 'Posso usar o Magic Crew para clientes (agência)?',
    a: 'Sim! Os planos Pro e Enterprise permitem gerenciar múltiplas contas e convidar membros de equipe com diferentes permissões.',
  },
];

export function FAQSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Perguntas frequentes
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="glass-panel rounded-lg px-6 border-none"
              >
                <AccordionTrigger className="text-left font-heading font-medium text-foreground hover:text-primary hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
