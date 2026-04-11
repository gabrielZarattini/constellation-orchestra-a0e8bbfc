import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { Helmet } from 'react-helmet-async';

export default function Landing() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Magic Constellation',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Plataforma SaaS de marketing omnichannel com IA. Gere conteúdo multimodal, publique em 8 redes sociais e otimize campanhas automaticamente.',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '147',
      highPrice: '997',
      priceCurrency: 'BRL',
      offerCount: 3,
    },
    featureList: [
      'Agentes de IA autônomos',
      'Geração de texto, imagem, áudio, vídeo',
      'Publicação em 8 redes sociais',
      'SEO e SEM inteligentes',
      'Auto-otimização e auto-cura',
    ],
  };

  return (
    <>
      <Helmet>
        <title>Magic Constellation — Marketing com IA | Agentes Autônomos para Redes Sociais</title>
        <meta
          name="description"
          content="Plataforma SaaS de marketing omnichannel com IA. Gere conteúdo multimodal, publique em 8 redes sociais e otimize campanhas automaticamente com agentes de IA."
        />
        <meta property="og:title" content="Magic Constellation — Marketing com IA" />
        <meta
          property="og:description"
          content="Orquestre agentes de IA para gerar e publicar conteúdo em todas as redes sociais. Texto, imagem, áudio, vídeo — tudo automatizado."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://magiccrew.ai" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <div id="faq">
          <FAQSection />
        </div>
        <CTASection />
        <Footer />
      </div>
    </>
  );
}
