import { CrewGraph } from '@/components/graph/CrewGraph';
import { HUD } from '@/components/HUD';
import { ConfigPanel } from '@/components/panels/ConfigPanel';
import { LogsPanel } from '@/components/panels/LogsPanel';
import { AgentDetail } from '@/components/panels/AgentDetail';
import { Legend } from '@/components/Legend';
import { useSimulation } from '@/hooks/useSimulation';
import { useHandTracking } from '@/hooks/useHandTracking';
import { GestureParticleOverlay } from '@/components/gestures/GestureParticles';
import { GestureHUD } from '@/components/gestures/GestureHUD';
import { GestureController } from '@/components/gestures/GestureController';
import { useState } from 'react';

const Index = () => {
  useSimulation();
  const [gesturesEnabled, setGesturesEnabled] = useState(false);
  const { handData, isLoading, error } = useHandTracking(gesturesEnabled);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <CrewGraph />
      {gesturesEnabled && <GestureParticleOverlay handData={handData} />}
      <GestureController handData={handData} enabled={gesturesEnabled} />
      <HUD />
      <AgentDetail />
      <ConfigPanel />
      <LogsPanel />
      <Legend />
      <GestureHUD
        handData={handData}
        isLoading={isLoading}
        error={error}
        enabled={gesturesEnabled}
        onToggle={() => setGesturesEnabled(!gesturesEnabled)}
      />
    </div>
  );
};

export default Index;
