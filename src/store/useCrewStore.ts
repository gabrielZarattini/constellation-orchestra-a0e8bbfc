import { create } from 'zustand';

export type AgentStatus = 'active' | 'thinking' | 'waiting' | 'error' | 'idle';

export interface Agent {
  id: string;
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
  selectedAgentId: string | null;
  configOpen: boolean;
  logsOpen: boolean;
  setSelectedAgent: (id: string | null) => void;
  setConfigOpen: (open: boolean) => void;
  setLogsOpen: (open: boolean) => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  updateAgentStatus: (id: string, status: AgentStatus) => void;
  updateEdgeStatus: (id: string, status: Edge['status']) => void;
  addEdge: (edge: Omit<Edge, 'id' | 'createdAt'>) => void;
  removeEdge: (id: string) => void;
}

const INITIAL_AGENTS: Agent[] = [
  { id: 'ceo', name: 'CEO', role: 'Chief Executive Officer', avatar: '👔', provider: 'openai', model: 'gpt-4', status: 'active', position: [0, 2, 0], systemPrompt: 'You are a visionary CEO.', priority: 'high' },
  { id: 'sales', name: 'Sales Director', role: 'Sales & Revenue', avatar: '📊', provider: 'openai', model: 'gpt-4', status: 'thinking', position: [-3, 0, 1], systemPrompt: 'You drive revenue growth.', priority: 'high' },
  { id: 'dev', name: 'Senior Dev', role: 'Engineering Lead', avatar: '💻', provider: 'anthropic', model: 'claude-3', status: 'active', position: [3, 0, -1], systemPrompt: 'You write clean code.', priority: 'medium' },
  { id: 'analyst', name: 'Data Analyst', role: 'Analytics & Insights', avatar: '📈', provider: 'google', model: 'gemini-pro', status: 'waiting', position: [-1, -2, 2], systemPrompt: 'You analyze data patterns.', priority: 'medium' },
  { id: 'support', name: 'Support Agent', role: 'Customer Success', avatar: '🎧', provider: 'openai', model: 'gpt-4', status: 'idle', position: [2, -2, -2], systemPrompt: 'You help customers.', priority: 'low' },
  { id: 'writer', name: 'Content Writer', role: 'Content & Marketing', avatar: '✍️', provider: 'anthropic', model: 'claude-3', status: 'thinking', position: [-2, 1, -3], systemPrompt: 'You craft compelling content.', priority: 'low' },
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e1', from: 'ceo', to: 'sales', status: 'active', label: 'Strategy brief', createdAt: Date.now() },
  { id: 'e2', from: 'sales', to: 'analyst', status: 'waiting', label: 'Data request', createdAt: Date.now() },
  { id: 'e3', from: 'ceo', to: 'dev', status: 'active', label: 'Feature spec', createdAt: Date.now() },
  { id: 'e4', from: 'dev', to: 'support', status: 'idle', label: 'Bug report', createdAt: Date.now() },
  { id: 'e5', from: 'writer', to: 'ceo', status: 'active', label: 'Content draft', createdAt: Date.now() },
];

const INITIAL_PROVIDERS: Provider[] = [
  { id: 'openai', name: 'OpenAI', endpoint: 'https://api.openai.com/v1', model: 'gpt-4-turbo', connected: true },
  { id: 'anthropic', name: 'Anthropic', endpoint: 'https://api.anthropic.com/v1', model: 'claude-3-opus', connected: true },
  { id: 'google', name: 'Google Gemini', endpoint: 'https://generativelanguage.googleapis.com', model: 'gemini-pro', connected: false },
  { id: 'mistral', name: 'Mistral AI', endpoint: 'https://api.mistral.ai/v1', model: 'mistral-large', connected: false },
];

let logCounter = 0;

export const useCrewStore = create<CrewState>((set) => ({
  agents: INITIAL_AGENTS,
  edges: INITIAL_EDGES,
  logs: [],
  providers: INITIAL_PROVIDERS,
  selectedAgentId: null,
  configOpen: false,
  logsOpen: false,
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
