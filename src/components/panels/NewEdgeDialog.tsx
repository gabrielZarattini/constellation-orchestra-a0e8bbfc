import { useState, useEffect } from 'react';
import { useCrewStore } from '@/store/useCrewStore';
import { useCreateEdge } from '@/hooks/useAgentMutations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export function NewEdgeDialog() {
  const { connectingFrom, agents, setConnectingFrom, setConnectionMode } = useCrewStore();
  const [toAgentId, setToAgentId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('Conexão');
  const [status, setStatus] = useState('idle');
  const createEdge = useCreateEdge();

  const fromAgent = agents.find((a) => a.id === connectingFrom);
  const toAgent = agents.find((a) => a.id === toAgentId);

  // Listen for second click in connection mode
  useEffect(() => {
    const unsub = useCrewStore.subscribe((state, prev) => {
      if (state.connectingFrom && prev.connectingFrom && state.connectingFrom !== prev.connectingFrom) {
        // Second agent clicked
        setToAgentId(state.connectingFrom);
        state.setConnectingFrom(prev.connectingFrom); // restore first
        setOpen(true);
      }
    });
    return unsub;
  }, []);

  // Actually we need a simpler approach: store both from and to
  // The CrewGraph/AgentNode will handle clicks in connection mode

  const handleCreate = () => {
    if (!fromAgent || !toAgent) return;
    createEdge.mutate({
      from_agent_key: fromAgent.id,
      to_agent_key: toAgent.id,
      label,
      status,
    }, {
      onSuccess: () => {
        setOpen(false);
        setConnectingFrom(null);
        setToAgentId(null);
        setLabel('Conexão');
        setStatus('idle');
      },
    });
  };

  // Expose a way for external code to open the dialog
  useEffect(() => {
    (window as any).__openEdgeDialog = (fromId: string, toId: string) => {
      const store = useCrewStore.getState();
      const from = store.agents.find(a => a.id === fromId);
      const to = store.agents.find(a => a.id === toId);
      if (from && to) {
        useCrewStore.setState({ connectingFrom: fromId });
        setToAgentId(toId);
        setOpen(true);
      }
    };
    return () => { delete (window as any).__openEdgeDialog; };
  }, []);

  if (!fromAgent || !toAgent) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setConnectingFrom(null); setToAgentId(null); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova Conexão</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="text-center">
              <span className="text-2xl">{fromAgent.avatar}</span>
              <p className="text-xs text-muted-foreground">{fromAgent.name}</p>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="text-center">
              <span className="text-2xl">{toAgent.avatar}</span>
              <p className="text-xs text-muted-foreground">{toAgent.name}</p>
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Data request" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="waiting">Aguardando</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={createEdge.isPending}>
            {createEdge.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Criar Conexão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
