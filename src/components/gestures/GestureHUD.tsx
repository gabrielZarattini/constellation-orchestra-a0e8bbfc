import { Hand, Eye, Loader2, AlertCircle, Video, VideoOff } from 'lucide-react';
import type { GestureType, HandData } from '@/hooks/useHandTracking';

const GESTURE_LABELS: Record<GestureType, string> = {
  none: 'Sem gesto',
  open_palm: '🖐️ Mão aberta — Navegar',
  fist: '✊ Punho — Parar',
  pinch: '🤏 Pinça — Zoom/Selecionar',
  point: '👆 Apontar — Clicar',
  peace: '✌️ Paz — Menu',
};

interface GestureHUDProps {
  handData: HandData;
  isLoading: boolean;
  error: string | null;
  enabled: boolean;
  onToggle: () => void;
}

export function GestureHUD({ handData, isLoading, error, enabled, onToggle }: GestureHUDProps) {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
          enabled
            ? 'bg-primary/20 border-primary/50 text-primary shadow-lg shadow-primary/20'
            : 'bg-card/80 border-border text-muted-foreground hover:border-primary/30'
        } backdrop-blur-sm`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : enabled ? (
          <Video className="w-4 h-4" />
        ) : (
          <VideoOff className="w-4 h-4" />
        )}
        {isLoading ? 'Carregando câmera...' : enabled ? 'Gestos ativos' : 'Ativar gestos'}
      </button>

      {/* Status panel */}
      {enabled && !isLoading && (
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-xs space-y-1 min-w-[200px]">
          {error ? (
            <div className="flex items-center gap-1.5 text-destructive">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-foreground">
                <Hand className="w-3.5 h-3.5 text-primary" />
                <span className={handData.isActive ? 'text-primary' : 'text-muted-foreground'}>
                  {handData.isActive ? 'Mão detectada' : 'Procurando mão...'}
                </span>
              </div>
              {handData.isActive && (
                <div className="flex items-center gap-1.5 text-foreground">
                  <Eye className="w-3.5 h-3.5 text-accent-foreground" />
                  <span>{GESTURE_LABELS[handData.gesture]}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
