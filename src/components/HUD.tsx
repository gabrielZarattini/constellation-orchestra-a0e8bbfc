import { useCrewStore } from '@/store/useCrewStore';
import { Button } from '@/components/ui/button';
import { Settings, Terminal, Orbit } from 'lucide-react';

export function HUD() {
  const { setConfigOpen, setLogsOpen, agents, configOpen, logsOpen } = useCrewStore();
  
  const activeCount = agents.filter((a) => a.status === 'active' || a.status === 'thinking').length;
  const errorCount = agents.filter((a) => a.status === 'error').length;

  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
      {/* Status badges */}
      <div className="glass-panel rounded-full px-4 py-2 flex items-center gap-3 mr-2">
        <div className="flex items-center gap-1.5">
          <Orbit className="w-4 h-4 text-primary" />
          <span className="font-heading text-xs font-semibold text-foreground">Magic Constellation</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-status-active" />
          <span className="text-xs text-muted-foreground">{activeCount} active</span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-error animate-pulse" />
            <span className="text-xs text-destructive">{errorCount} error</span>
          </div>
        )}
      </div>

      <Button
        variant={logsOpen ? 'default' : 'secondary'}
        size="icon"
        className="rounded-full glow-primary"
        onClick={() => setLogsOpen(!logsOpen)}
      >
        <Terminal className="w-4 h-4" />
      </Button>
      <Button
        variant={configOpen ? 'default' : 'secondary'}
        size="icon"
        className="rounded-full glow-primary"
        onClick={() => setConfigOpen(!configOpen)}
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
}
