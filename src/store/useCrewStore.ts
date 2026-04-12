import { create } from 'zustand';

export type AgentStatus = 'active' | 'thinking' | 'waiting' | 'error' | 'idle';

export interface Agent {
  id: string;
  dbId?: string;
  name: string;
  role: string;
  avatar: string;
  provider: string;
  model: string;
  status: AgentStatus;
  position: [number, number, number];
  systemPrompt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  status: 'active' | 'waiting' | 'error' | 'idle';
  label?: string;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  eventType: 'info' | 'error' | 'start' | 'toolCall' | 'complete';
  message: string;
}

export interface Provider {
  id: string;
  name: string;
  endpoint: string;
  model: string;
  connected: boolean;
}

interface CrewState {
  agents: Agent[];
  edges: Edge[];
  logs: LogEntry[];
  providers: Provider[];
  loaded: boolean;
  selectedAgentId: string | null;
  configOpen: boolean;
  logsOpen: boolean;
  setAgents: (agents: Agent[]) => void;
  setEdges: (edges: Edge[]) => void;
  setLoaded: (loaded: boolean) => void;
  setSelectedAgent: (id: string | null) => void;
  setConfigOpen: (open: boolean) => void;
  setLogsOpen: (open: boolean) => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  updateAgentStatus: (id: string, status: AgentStatus) => void;
  updateEdgeStatus: (id: string, status: Edge['status']) => void;
  addEdge: (edge: Omit<Edge, 'id' | 'createdAt'>) => void;
  removeEdge: (id: string) => void;
}

const INITIAL_PROVIDERS: Provider[] = [
  { id: 'openai', name: 'OpenAI', endpoint: 'https://api.openai.com/v1', model: 'gpt-4-turbo', connected: true },
  { id: 'anthropic', name: 'Anthropic', endpoint: 'https://api.anthropic.com/v1', model: 'claude-3-opus', connected: true },
  { id: 'google', name: 'Google Gemini', endpoint: 'https://generativelanguage.googleapis.com', model: 'gemini-pro', connected: false },
  { id: 'mistral', name: 'Mistral AI', endpoint: 'https://api.mistral.ai/v1', model: 'mistral-large', connected: false },
];

let logCounter = 0;

export const useCrewStore = create<CrewState>((set) => ({
  agents: [],
  edges: [],
  logs: [],
  providers: INITIAL_PROVIDERS,
  loaded: false,
  selectedAgentId: null,
  configOpen: false,
  logsOpen: false,
  setAgents: (agents) => set({ agents }),
  setEdges: (edges) => set({ edges }),
  setLoaded: (loaded) => set({ loaded }),
  setSelectedAgent: (id) => set({ selectedAgentId: id }),
  setConfigOpen: (open) => set({ configOpen: open }),
  setLogsOpen: (open) => set({ logsOpen: open }),
  addLog: (log) => set((s) => ({
    logs: [{ ...log, id: `log-${++logCounter}`, timestamp: Date.now() }, ...s.logs].slice(0, 200),
  })),
  updateAgentStatus: (id, status) => set((s) => ({
    agents: s.agents.map((a) => (a.id === id ? { ...a, status } : a)),
  })),
  updateEdgeStatus: (id, status) => set((s) => ({
    edges: s.edges.map((e) => (e.id === id ? { ...e, status } : e)),
  })),
  addEdge: (edge) => set((s) => ({
    edges: [...s.edges, { ...edge, id: `e-${Date.now()}`, createdAt: Date.now() }],
  })),
  removeEdge: (id) => set((s) => ({
    edges: s.edges.filter((e) => e.id !== id),
  })),
}));
