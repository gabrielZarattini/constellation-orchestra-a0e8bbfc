import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useContentLibrary, useUpdateContent } from '@/hooks/useContentLibrary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, GripVertical, Film, Mic, Type, Clock, FileDown, Save, Loader2, Clapperboard, MonitorPlay, MessageSquare } from 'lucide-react';

interface Scene {
  id: string;
  type: string;
  label: string;
  narration: string;
  onScreen: string;
  duration: string;
}

const SCENE_ICONS: Record<string, React.ElementType> = {
  CENA: Film,
  INTRO: Clapperboard,
  HOOK: MonitorPlay,
  ENCERRAMENTO: MessageSquare,
  CTA: MessageSquare,
  DEFAULT: Film,
};

const SCENE_COLORS: Record<string, string> = {
  CENA: 'border-l-primary',
  INTRO: 'border-l-green-500',
  HOOK: 'border-l-amber-500',
  ENCERRAMENTO: 'border-l-purple-500',
  CTA: 'border-l-red-500',
  DEFAULT: 'border-l-muted-foreground',
};

function parseScenes(body: string): Scene[] {
  const lines = body.split('\n');
  const scenes: Scene[] = [];
  let current: Scene | null = null;
  let currentSection = '';

  for (const line of lines) {
    const sceneMatch = line.match(/^\[?(CENA|INTRO|HOOK|ENCERRAMENTO|CTA)\s*\d*\]?[:\s-]*(.*)/i);
    if (sceneMatch) {
      if (current) scenes.push(current);
      const type = sceneMatch[1].toUpperCase();
      current = {
        id: `scene-${scenes.length}`,
        type,
        label: sceneMatch[2]?.trim() || `${type} ${scenes.length + 1}`,
        narration: '',
        onScreen: '',
        duration: '10s',
      };
      currentSection = '';
      continue;
    }

    if (!current && line.trim()) {
      current = {
        id: `scene-${scenes.length}`,
        type: 'CENA',
        label: `Cena ${scenes.length + 1}`,
        narration: '',
        onScreen: '',
        duration: '10s',
      };
    }

    if (!current) continue;

    const lower = line.toLowerCase().trim();
    if (lower.startsWith('narração:') || lower.startsWith('narrador:') || lower.startsWith('áudio:')) {
      currentSection = 'narration';
      current.narration += line.replace(/^(narração|narrador|áudio):\s*/i, '') + '\n';
    } else if (lower.startsWith('texto em tela:') || lower.startsWith('visual:') || lower.startsWith('tela:')) {
      currentSection = 'onScreen';
      current.onScreen += line.replace(/^(texto em tela|visual|tela):\s*/i, '') + '\n';
    } else if (lower.startsWith('duração:') || lower.startsWith('tempo:')) {
      current.duration = line.replace(/^(duração|tempo):\s*/i, '').trim();
    } else if (line.trim()) {
      if (currentSection === 'onScreen') {
        current.onScreen += line + '\n';
      } else {
        current.narration += line + '\n';
      }
    }
  }
  if (current) scenes.push(current);

  return scenes.map((s) => ({
    ...s,
    narration: s.narration.trim(),
    onScreen: s.onScreen.trim(),
  }));
}

function scenesToText(scenes: Scene[]): string {
  return scenes.map((s) => {
    let text = `[${s.type}] ${s.label}\n`;
    if (s.narration) text += `Narração: ${s.narration}\n`;
    if (s.onScreen) text += `Texto em tela: ${s.onScreen}\n`;
    text += `Duração: ${s.duration}`;
    return text;
  }).join('\n\n');
}

function SortableScene({
  scene,
  onChange,
}: {
  scene: Scene;
  onChange: (updated: Scene) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const Icon = SCENE_ICONS[scene.type] || SCENE_ICONS.DEFAULT;
  const colorClass = SCENE_COLORS[scene.type] || SCENE_COLORS.DEFAULT;

  return (
    <Card ref={setNodeRef} style={style} className={`border-l-4 ${colorClass}`}>
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
        <Icon className="h-4 w-4 text-primary" />
        <Input
          value={scene.label}
          onChange={(e) => onChange({ ...scene, label: e.target.value })}
          className="h-7 text-sm font-medium border-none shadow-none p-0 focus-visible:ring-0"
        />
        <Badge variant="outline" className="ml-auto text-[10px] shrink-0 gap-1">
          <Clock className="h-2.5 w-2.5" />
          <Input
            value={scene.duration}
            onChange={(e) => onChange({ ...scene, duration: e.target.value })}
            className="h-5 w-12 text-[10px] border-none shadow-none p-0 text-center focus-visible:ring-0"
          />
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Mic className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Narração</span>
          </div>
          <Textarea
            value={scene.narration}
            onChange={(e) => onChange({ ...scene, narration: e.target.value })}
            rows={2}
            className="text-xs resize-none"
            placeholder="Texto da narração..."
          />
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Type className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Texto em Tela</span>
          </div>
          <Textarea
            value={scene.onScreen}
            onChange={(e) => onChange({ ...scene, onScreen: e.target.value })}
            rows={2}
            className="text-xs resize-none"
            placeholder="Texto exibido na tela..."
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function VideoEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contents, isLoading } = useContentLibrary();
  const updateContent = useUpdateContent();

  const content = useMemo(() => contents?.find((c) => c.id === id), [contents, id]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (content?.body) {
      setScenes(parseScenes(content.body));
    }
  }, [content?.id]);

  const handleSceneChange = useCallback((updated: Scene) => {
    setScenes((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setScenes((prev) => {
      const oldIdx = prev.findIndex((s) => s.id === active.id);
      const newIdx = prev.findIndex((s) => s.id === over.id);
      const copy = [...prev];
      const [moved] = copy.splice(oldIdx, 1);
      copy.splice(newIdx, 0, moved);
      return copy;
    });
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateContent.mutateAsync({ id, body: scenesToText(scenes) });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-muted-foreground">Conteúdo não encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/content')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const totalDuration = scenes.reduce((acc, s) => {
    const match = s.duration.match(/(\d+)/);
    return acc + (match ? parseInt(match[1]) : 0);
  }, 0);

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 no-print">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/content')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-heading font-bold text-foreground">{content.title || 'Editor de Roteiro'}</h1>
              <p className="text-xs text-muted-foreground">
                {scenes.length} cenas · ~{totalDuration}s total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1">
              <FileDown className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="no-print flex items-center gap-1 overflow-x-auto pb-2">
          {scenes.map((s, i) => {
            const Icon = SCENE_ICONS[s.type] || SCENE_ICONS.DEFAULT;
            return (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 text-xs">
                  <Icon className="h-3 w-3 text-primary" />
                  <span className="text-foreground font-medium">{s.label}</span>
                  <span className="text-muted-foreground">{s.duration}</span>
                </div>
                {i < scenes.length - 1 && <div className="w-4 h-px bg-border" />}
              </div>
            );
          })}
        </div>

        {/* Scenes Editor */}
        <div className="space-y-3 print-area">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={scenes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {scenes.map((scene) => (
                <SortableScene key={scene.id} scene={scene} onChange={handleSceneChange} />
              ))}
            </SortableContext>
          </DndContext>

          {scenes.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Film className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma cena detectada no roteiro. Use marcações como [CENA], [INTRO], [HOOK] para estruturar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
