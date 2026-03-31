import { useEffect } from 'react';
import { useCrewStore, type AgentStatus } from '@/store/useCrewStore';

const STATUS_POOL: AgentStatus[] = ['active', 'thinking', 'waiting', 'idle', 'error'];
const EDGE_STATUS_POOL: Array<'active' | 'waiting' | 'error' | 'idle'> = ['active', 'waiting', 'idle'];

const MESSAGES: Record<string, string[]> = {
  info: ['Processing request...', 'Analyzing data...', 'Generating report...', 'Reviewing strategy...'],
  start: ['Task started', 'Initiating workflow', 'Beginning analysis'],
  toolCall: ['Calling search API', 'Querying database', 'Running sentiment analysis'],
  complete: ['Task completed successfully', 'Analysis finished', 'Report generated'],
  error: ['API rate limit exceeded', 'Connection timeout', 'Invalid response format'],
};

export function useSimulation() {
  const { agents, edges, updateAgentStatus, updateEdgeStatus, addLog } = useCrewStore();

  useEffect(() => {
    const interval = setInterval(() => {
      // Random agent status change
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const newStatus = STATUS_POOL[Math.floor(Math.random() * STATUS_POOL.length)];
      updateAgentStatus(agent.id, newStatus);

      // Log it
      const eventType = newStatus === 'error' ? 'error' : newStatus === 'active' ? 'start' : 'info';
      const msgs = MESSAGES[eventType];
      addLog({
        agentId: agent.id,
        agentName: agent.name,
        eventType: eventType as any,
        message: `${msgs[Math.floor(Math.random() * msgs.length)]} (status → ${newStatus})`,
      });

      // Random edge status change
      if (edges.length > 0) {
        const edge = edges[Math.floor(Math.random() * edges.length)];
        const newEdgeStatus = EDGE_STATUS_POOL[Math.floor(Math.random() * EDGE_STATUS_POOL.length)];
        updateEdgeStatus(edge.id, newEdgeStatus);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [agents, edges, updateAgentStatus, updateEdgeStatus, addLog]);
}
