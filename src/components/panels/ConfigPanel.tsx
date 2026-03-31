import { useCrewStore } from '@/store/useCrewStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Wifi, WifiOff, Settings, Bot } from 'lucide-react';

export function ConfigPanel() {
  const { configOpen, setConfigOpen, agents, providers } = useCrewStore();

  if (!configOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-96 glass-panel z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="p-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configuration
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setConfigOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Providers */}
        <section className="mb-6">
          <h3 className="font-heading text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">AI Providers</h3>
          <div className="space-y-2">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                <div>
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  <span className="text-xs text-muted-foreground block">{p.model}</span>
                </div>
                <Badge variant={p.connected ? 'default' : 'secondary'} className="gap-1">
                  {p.connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {p.connected ? 'Connected' : 'Offline'}
                </Badge>
              </div>
            ))}
          </div>
        </section>

        {/* Agents */}
        <section>
          <h3 className="font-heading text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Agents ({agents.length})</h3>
          <div className="space-y-2">
            {agents.map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{a.avatar}</span>
                  <div>
                    <span className="text-sm font-medium text-foreground">{a.name}</span>
                    <span className="text-xs text-muted-foreground block">{a.role}</span>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs capitalize">
                    {a.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Bot className="w-3 h-3" />
                  {a.provider} / {a.model}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
