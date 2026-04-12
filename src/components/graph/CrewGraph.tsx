import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useCrewStore } from '@/store/useCrewStore';
import { AgentNode } from './AgentNode';
import { AgentEdge } from './AgentEdge';
import { useCallback } from 'react';

function Scene() {
  const agents = useCrewStore((s) => s.agents);
  const edges = useCrewStore((s) => s.edges);
  const selectedAgentId = useCrewStore((s) => s.selectedAgentId);
  const setSelectedAgent = useCrewStore((s) => s.setSelectedAgent);
  const connectionMode = useCrewStore((s) => s.connectionMode);
  const connectingFrom = useCrewStore((s) => s.connectingFrom);
  const setConnectingFrom = useCrewStore((s) => s.setConnectingFrom);

  const agentMap = new Map(agents.map((a) => [a.id, a]));

  const handleNodeClick = useCallback((agentId: string) => {
    if (connectionMode) {
      if (!connectingFrom) {
        setConnectingFrom(agentId);
      } else if (connectingFrom !== agentId) {
        // Open edge dialog via window bridge
        (window as any).__openEdgeDialog?.(connectingFrom, agentId);
      } else {
        setConnectingFrom(null);
      }
    } else {
      setSelectedAgent(agentId === selectedAgentId ? null : agentId);
    }
  }, [connectionMode, connectingFrom, selectedAgentId, setSelectedAgent, setConnectingFrom]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#38bdf8" />
      <pointLight position={[-10, -5, -10]} intensity={0.5} color="#a855f7" />
      <Stars radius={50} depth={50} count={1500} factor={3} saturation={0} fade speed={0.5} />

      {edges.map((edge) => {
        const fromAgent = agentMap.get(edge.from);
        const toAgent = agentMap.get(edge.to);
        if (!fromAgent || !toAgent) return null;
        return (
          <AgentEdge
            key={edge.id}
            fromPos={fromAgent.position}
            toPos={toAgent.position}
            status={edge.status}
          />
        );
      })}

      {agents.map((agent) => (
        <AgentNode
          key={agent.id}
          id={agent.id}
          name={agent.name}
          avatar={agent.avatar}
          status={agent.status}
          position={agent.position}
          selected={selectedAgentId === agent.id}
          connecting={connectionMode && connectingFrom === agent.id}
          connectionMode={connectionMode}
          onClick={() => handleNodeClick(agent.id)}
        />
      ))}
    </>
  );
}

export function CrewGraph() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 3, 10], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={4}
          maxDistance={25}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}
