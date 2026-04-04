import { motion } from 'framer-motion';
import {
  Bot, Calendar, BarChart3, Palette, Music, Video,
  Share2, Shield, Zap, Globe, Brain, RefreshCw,
} from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'Agentes de IA Autônomos',
    description: 'Escritores, designers, produtores de áudio e vídeo — todos trabalhando em conjunto automaticamente.',
  },
  {
    icon: Share2,
    title: '8 Redes Sociais',
    description: 'LinkedIn, Instagram, Facebook, X/Twitter, TikTok, YouTube, Pinterest e WordPress integrados.',
  },
  {
    icon: Palette,
    title: 'Conteúdo Multimodal',
    description: 'Gere textos, imagens, áudios, músicas e vídeos com IA de ponta — tudo na mesma plataforma.',
  },
  {
    icon: Calendar,
    title: 'Agendamento Inteligente',
    description: 'Publique no melhor horário para cada rede com base em dados reais de engajamento.',
  },
  {
    icon: BarChart3,
    title: 'Analytics em Tempo Real',
    description: 'Dashboard unificado com métricas de todas as plataformas, ROI e insights acionáveis.',
  },
  {
    icon: Brain,
    title: 'Auto-Otimização',
    description: 'A IA aprende com cada campanha e ajusta automaticamente tom, horário e formato.',
  },
  {
    icon: RefreshCw,
    title: 'Auto-Cura',
    description: 'Tokens expirados, posts bloqueados, APIs fora do ar — o sistema corrige sozinho.',
  },
  {
    icon: Globe,
    title: 'SEO & SEM',
    description: 'Otimize para Google com palavras-chave, schema markup e campanhas de ads inteligentes.',
  },
  {
    icon: Music,
    title: 'Áudio & Música com IA',
    description: 'Narração profissional, jingles e trilhas sonoras geradas automaticamente.',
  },
  {
    icon: Video,
    title: 'Vídeos Automáticos',
    description: 'Reels, Shorts e TikToks criados a partir de imagens, áudio e texto animado.',
  },
  {
    icon: Shield,
    title: 'Segurança Enterprise',
    description: 'Tokens criptografados, audit log completo, RLS por usuário e roles configuráveis.',
  },
  {
    icon: Zap,
    title: 'Grafo 3D Interativo',
    description: 'Visualize a orquestração dos agentes em tempo real num grafo tridimensional imersivo.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Tudo que você precisa para <span className="text-gradient-primary">dominar o marketing</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Uma suíte completa de agentes de IA que geram, publicam e otimizam conteúdo em todas as plataformas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="glass-panel rounded-xl p-6 hover:border-primary/30 transition-colors group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
