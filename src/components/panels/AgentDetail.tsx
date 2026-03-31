import { useCrewStore } from '@/store/useCrewStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Zap, Bot } from 'lucide-react';

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  thinking: 'secondary',
  waiting: 'outline',
  error: 'destructive',
  idle: 'secondary',
};

export function AgentDetail() {
  const { selectedAgentId, agents, edges, setSelectedAgent } = useCrewStore();
  const agent = agents.find((a) => a.id === selectedAgentId);

  if (!agent) return null;

  const connections = edges.filter((e) => e.from === agent.id || e.to === agent.id);

  return (
    <div className="absolute top-4 left-4 w-80 glass-panel rounded-xl z-30 animate-in slide-in-from-left duration-300">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{agent.avatar}</span>
            <div>
              <h3 className="font-heading text-sm font-semibold text-foreground">{agent.name}</h3>
              <p className="text-xs text-muted-foreground">{agent.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSelectedAgent(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE_VARIANT[agent.status]} className="capitalize">{agent.status}</Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <Bot className="w-3 h-3" />{agent.provider}
            </Badge>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">System Prompt</p>
            <p className="text-xs text-foreground bg-secondary/50 rounded p-2">{agent.systemPrompt}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Connections ({connections.length})
            </p>
            {connections.map((c) => {
              const otherAgent = agents.find((a) => a.id === (c.from === agent.id ? c.to : c.from));
              return (
                <div key={c.id} className="text-xs text-foreground flex items-center gap-1 py-0.5">
                  <span className="w-2 h-2 rounded-full" style={{
                    backgroundColor: c.status === 'active' ? '#22c55e' : c.status === 'error' ? '#ef4444' : c.status === 'waiting' ? '#f59e0b' : '#60a5fa',
                  }} />
                  {c.from === agent.id ? '→' : '←'} {otherAgent?.name} — {c.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
