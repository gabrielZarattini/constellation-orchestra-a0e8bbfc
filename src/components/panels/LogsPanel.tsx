import { useCrewStore } from '@/store/useCrewStore';
import { Button } from '@/components/ui/button';
import { X, Terminal, AlertCircle, Play, Wrench, CheckCircle } from 'lucide-react';

const EVENT_ICONS: Record<string, typeof Terminal> = {
  info: Terminal,
  error: AlertCircle,
  start: Play,
  toolCall: Wrench,
  complete: CheckCircle,
};

const EVENT_COLORS: Record<string, string> = {
  info: 'text-primary',
  error: 'text-destructive',
  start: 'text-status-active',
  toolCall: 'text-accent',
  complete: 'text-status-active',
};

export function LogsPanel() {
  const { logsOpen, setLogsOpen, logs } = useCrewStore();

  if (!logsOpen) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-64 glass-panel z-30 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          Live Logs
          <span className="text-xs text-muted-foreground">({logs.length})</span>
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setLogsOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="overflow-y-auto h-[calc(100%-2.5rem)] p-2 font-mono text-xs">
        {logs.length === 0 && (
          <div className="text-muted-foreground text-center py-8">Waiting for events...</div>
        )}
        {logs.map((log) => {
          const Icon = EVENT_ICONS[log.eventType] || Terminal;
          const colorClass = EVENT_COLORS[log.eventType] || 'text-foreground';
          return (
            <div key={log.id} className="flex items-start gap-2 py-1 px-2 hover:bg-secondary/30 rounded">
              <span className="text-muted-foreground shrink-0 w-20">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${colorClass}`} />
              <span className="text-primary font-medium shrink-0">[{log.agentName}]</span>
              <span className="text-foreground">{log.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
