import { useState } from 'react';
import { useCrewStore } from '@/store/useCrewStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { X, Zap, Bot, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useUpdateAgent, useDeleteAgent } from '@/hooks/useAgentMutations';

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
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editProvider, setEditProvider] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editPrompt, setEditPrompt] = useState('');

  if (!agent) return null;

  const connections = edges.filter((e) => e.from === agent.id || e.to === agent.id);

  const openEdit = () => {
    setEditName(agent.name);
    setEditRole(agent.role);
    setEditAvatar(agent.avatar);
    setEditProvider(agent.provider);
    setEditModel(agent.model);
    setEditPriority(agent.priority);
    setEditPrompt(agent.systemPrompt);
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!agent.dbId) return;
    updateAgent.mutate({
      dbId: agent.dbId,
      name: editName,
      role: editRole,
      avatar: editAvatar,
      provider: editProvider,
      model: editModel,
      priority: editPriority,
      system_prompt: editPrompt,
    }, { onSuccess: () => setEditOpen(false) });
  };

  const handleDelete = () => {
    deleteAgent.mutate(agent.id, {
      onSuccess: () => {
        setSelectedAgent(null);
        setDeleteOpen(false);
      },
    });
  };

  return (
    <>
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
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openEdit}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedAgent(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
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
                <Zap className="w-3 h-3" /> Conexões ({connections.length})
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Agente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <Label>Função</Label>
                <Input value={editRole} onChange={(e) => setEditRole(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Avatar (emoji)</Label>
              <Input value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} className="w-20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Provider</Label>
                <Input value={editProvider} onChange={(e) => setEditProvider(e.target.value)} />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input value={editModel} onChange={(e) => setEditModel(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={editPriority} onValueChange={setEditPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>System Prompt</Label>
              <Textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={updateAgent.isPending}>
              {updateAgent.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover agente?</AlertDialogTitle>
            <AlertDialogDescription>
              O agente "{agent.name}" e todas as suas conexões serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteAgent.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
