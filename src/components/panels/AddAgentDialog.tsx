import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAgent } from '@/hooks/useAgentMutations';
import { Loader2 } from 'lucide-react';

const AVATARS = ['🤖', '👔', '📊', '💻', '📈', '🎧', '✍️', '🎨', '🔬', '🛡️', '📱', '🧠'];
const PROVIDERS = ['openai', 'anthropic', 'google', 'mistral'];
const MODELS: Record<string, string[]> = {
  openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3', 'claude-3-opus', 'claude-3-sonnet'],
  google: ['gemini-pro', 'gemini-2.5-flash'],
  mistral: ['mistral-large', 'mistral-medium'],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAgentDialog({ open, onOpenChange }: Props) {
  const createAgent = useCreateAgent();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4');
  const [priority, setPriority] = useState('medium');
  const [systemPrompt, setSystemPrompt] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    createAgent.mutate({
      agent_key: `agent-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      avatar,
      provider,
      model,
      system_prompt: systemPrompt,
      priority,
      position: [
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 6,
      ],
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setName(''); setRole(''); setAvatar('🤖'); setProvider('openai'); setModel('gpt-4'); setPriority('medium'); setSystemPrompt('');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Agente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Avatar</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  className={`text-xl p-1 rounded ${avatar === a ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'}`}
                  onClick={() => setAvatar(a)}
                >{a}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Assistente" />
            </div>
            <div>
              <Label>Função</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Analista" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(v) => { setProvider(v); setModel(MODELS[v][0]); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modelo</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(MODELS[provider] ?? []).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={setPriority}>
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
            <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="Instruções do agente..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || createAgent.isPending}>
            {createAgent.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Criar Agente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
