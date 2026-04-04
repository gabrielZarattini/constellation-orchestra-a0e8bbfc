import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Mariana Costa',
    role: 'Head de Marketing, TechStart',
    avatar: 'MC',
    quote: 'O Magic Crew triplicou nosso engajamento no Instagram em 2 meses. A IA realmente entende o tom de cada rede social.',
    stars: 5,
  },
  {
    name: 'Rafael Oliveira',
    role: 'CEO, Digital Agency Pro',
    avatar: 'RO',
    quote: 'Gerenciávamos 15 contas manualmente. Com o Magic Crew, automatizamos tudo e ainda melhoramos os resultados.',
    stars: 5,
  },
  {
    name: 'Camila Santos',
    role: 'Social Media Manager',
    avatar: 'CS',
    quote: 'A geração de vídeos e áudios com IA é incrível. Economizo 20 horas por semana que antes gastava criando conteúdo.',
    stars: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Quem usa, <span className="text-gradient-primary">recomenda</span>
          </h2>
          <p className="text-muted-foreground text-lg">Veja o que nossos clientes estão dizendo.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="glass-panel rounded-xl p-6 flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground text-sm leading-relaxed flex-1 mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-heading font-semibold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-heading font-medium text-foreground text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
