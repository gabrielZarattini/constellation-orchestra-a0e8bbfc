import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-heading font-bold text-foreground">Magic Crew</span>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
          <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
          <a href="#" className="hover:text-foreground transition-colors">Contato</a>
        </div>

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Magic Crew. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
