import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from './DashboardSidebar';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  constellation: 'Constelação',
  campaigns: 'Campanhas',
  new: 'Nova',
  content: 'Conteúdo',
  calendar: 'Calendário',
  analytics: 'Analytics',
  social: 'Redes Sociais',
  blog: 'Blog',
  admin: 'Administração',
  'video-editor': 'Editor de Vídeo',
  notifications: 'Notificações',
  billing: 'Assinatura',
  settings: 'Configurações',
};

export function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isConstellation = location.pathname.includes('/constellation');
  const [open, setOpen] = useState(!isConstellation);

  useEffect(() => {
    if (isConstellation) setOpen(false);
    else setOpen(true);
  }, [isConstellation]);

  // Build breadcrumbs
  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: BREADCRUMB_MAP[seg] || seg,
    path: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <nav className="hidden sm:flex items-center gap-1 text-sm">
                {crumbs.map((c, i) => (
                  <span key={c.path} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    {c.isLast ? (
                      <span className="font-semibold text-foreground">{c.label}</span>
                    ) : (
                      <Link to={c.path} className="text-muted-foreground hover:text-foreground transition-colors">{c.label}</Link>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-destructive rounded-full text-[9px] font-bold flex items-center justify-center text-destructive-foreground">
                  3
                </span>
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
