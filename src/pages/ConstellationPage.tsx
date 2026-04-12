import { CrewGraph } from '@/components/graph/CrewGraph';
import { HUD } from '@/components/HUD';
import { ConfigPanel } from '@/components/panels/ConfigPanel';
import { LogsPanel } from '@/components/panels/LogsPanel';
import { AgentDetail } from '@/components/panels/AgentDetail';
import { Legend } from '@/components/Legend';
import { useSimulation } from '@/hooks/useSimulation';
import { useCrewData } from '@/hooks/useCrewData';
import { useHandTracking } from '@/hooks/useHandTracking';
import { GestureParticleOverlay } from '@/components/gestures/GestureParticles';
import { GestureHUD } from '@/components/gestures/GestureHUD';
import { GestureController } from '@/components/gestures/GestureController';
import { AddAgentDialog } from '@/components/panels/AddAgentDialog';
import { Button } from '@/components/ui/button';
import { Minimize2, Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCrewStore } from '@/store/useCrewStore';

export default function ConstellationPage() {
  const { isLoading: crewLoading } = useCrewData();
  const loaded = useCrewStore((s) => s.loaded);
  useSimulation();
  const navigate = useNavigate();
  const [gesturesEnabled, setGesturesEnabled] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const { handData, isLoading, error } = useHandTracking(gesturesEnabled);

  if (crewLoading || !loaded) {
    return (
      <div className="relative w-full h-[calc(100vh-3.5rem)] flex items-center justify-center bg-background rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background rounded-lg">
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

      {/* Top-right actions */}
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="glass-panel border-border/50 gap-1.5"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Agente
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="glass-panel border-border/50 gap-1.5"
          onClick={() => navigate('/dashboard')}
        >
          <Minimize2 className="h-3.5 w-3.5" />
          Minimizar
        </Button>
      </div>

      <AddAgentDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
