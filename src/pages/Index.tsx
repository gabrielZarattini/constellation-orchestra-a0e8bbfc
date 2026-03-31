import { CrewGraph } from '@/components/graph/CrewGraph';
import { HUD } from '@/components/HUD';
import { ConfigPanel } from '@/components/panels/ConfigPanel';
import { LogsPanel } from '@/components/panels/LogsPanel';
import { AgentDetail } from '@/components/panels/AgentDetail';
import { Legend } from '@/components/Legend';
import { useSimulation } from '@/hooks/useSimulation';

const Index = () => {
  useSimulation();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <CrewGraph />
      <HUD />
      <AgentDetail />
      <ConfigPanel />
      <LogsPanel />
      <Legend />
    </div>
  );
};

export default Index;
