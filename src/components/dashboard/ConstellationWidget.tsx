import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useCrewStore } from '@/store/useCrewStore';
import { AgentNode } from '@/components/graph/AgentNode';
import { AgentEdge } from '@/components/graph/AgentEdge';
import { useSimulation } from '@/hooks/useSimulation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function MiniScene() {
  const agents = useCrewStore((s) => s.agents);
  const edges = useCrewStore((s) => s.edges);
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#38bdf8" />
      <pointLight position={[-10, -5, -10]} intensity={0.5} color="#a855f7" />
      <Stars radius={50} depth={50} count={800} factor={2} saturation={0} fade speed={0.5} />

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
          agent={agent}
          isSelected={false}
          onClick={() => {}}
        />
      ))}
    </>
  );
}

export function ConstellationWidget() {
  useSimulation();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Constelação de Agentes
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={() => navigate('/dashboard/constellation')}
            title="Expandir"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[280px] w-full relative cursor-grab">
            <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
              <MiniScene />
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={1.5}
                maxPolarAngle={Math.PI / 1.5}
                minPolarAngle={Math.PI / 3}
              />
            </Canvas>
            {/* Gradient overlay bottom for visual polish */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
