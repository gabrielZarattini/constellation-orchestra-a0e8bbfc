import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { supabase } from '@/integrations/supabase/client';
import { useScheduledPosts, useCreateScheduledPost, useUpdateScheduledPost, useDeleteScheduledPost, type ScheduledPost } from '@/hooks/useScheduledPosts';
import { useContentLibrary } from '@/hooks/useContentLibrary';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, LayoutList, Loader2, Copy, GripVertical, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type SocialPlatform = Database['public']['Enums']['social_platform'];

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-500',
  instagram: 'bg-pink-500',
  facebook: 'bg-indigo-500',
  twitter: 'bg-sky-400',
  tiktok: 'bg-foreground',
  youtube: 'bg-red-500',
  pinterest: 'bg-red-400',
  wordpress: 'bg-blue-700',
};

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter/X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  wordpress: 'WordPress',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  queued: 'outline',
  publishing: 'secondary',
  published: 'default',
  failed: 'destructive',
  cancelled: 'secondary',
};

function DraggablePost({ post, children }: { post: ScheduledPost; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: post.id, data: { post } });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : undefined } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function DroppableDay({ day, children }: { day: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: day });
  return (
    <div ref={setNodeRef} className={cn('transition-colors', isOver && 'ring-2 ring-primary/50 bg-primary/5')}>
      {children}
    </div>
  );
}

export default function CalendarPage() {
  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activePost, setActivePost] = useState<ScheduledPost | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const rangeStart = view === 'month'
    ? startOfWeek(startOfMonth(currentDate), { locale: ptBR })
    : startOfWeek(currentDate, { locale: ptBR });
  const rangeEnd = view === 'month'
    ? endOfWeek(endOfMonth(currentDate), { locale: ptBR })
    : endOfWeek(currentDate, { locale: ptBR });

  const { data: posts, isLoading } = useScheduledPosts({ from: rangeStart, to: rangeEnd });
  const { data: contents } = useContentLibrary();
  const { accounts } = useSocialAccounts();
  const createPost = useCreateScheduledPost();
  const updatePost = useUpdateScheduledPost();
  const deletePost = useDeleteScheduledPost();

  const days = useMemo(() => eachDayOfInterval({ start: rangeStart, end: rangeEnd }), [rangeStart.getTime(), rangeEnd.getTime()]);

  const postsByDay = useMemo(() => {
    const map: Record<string, ScheduledPost[]> = {};
    posts?.forEach((p) => {
      const key = format(parseISO(p.scheduled_at), 'yyyy-MM-dd');
      (map[key] ??= []).push(p);
    });
    return map;
  }, [posts]);

  const [formPlatform, setFormPlatform] = useState<SocialPlatform>('linkedin');
  const [formContentId, setFormContentId] = useState('');
  const [formTime, setFormTime] = useState('12:00');
  const [formAccountId, setFormAccountId] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ datetime: string; score: number; reason: string }>>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleSuggestTimes = async () => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/optimize-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ platform: formPlatform, content_type: 'general' }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const applySuggestion = (datetime: string) => {
    const d = new Date(datetime);
    setSelectedDate(d);
    setFormTime(format(d, 'HH:mm'));
    setSuggestions([]);
  };

  const navigate = (dir: number) => {
    setCurrentDate(view === 'month' ? (dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1)) : (dir > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1)));
  };

  const openNewPost = (day: Date) => {
    setSelectedDate(day);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    if (!selectedDate) return;
    const [h, m] = formTime.split(':').map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(h, m, 0, 0);
    createPost.mutate({
      platform: formPlatform,
      scheduled_at: scheduledAt.toISOString(),
      content_id: formContentId || null,
      social_account_id: formAccountId || null,
    }, { onSuccess: () => setDialogOpen(false) });
  };

  const handleDuplicate = (post: ScheduledPost) => {
    createPost.mutate({
      platform: post.platform,
      scheduled_at: post.scheduled_at,
      content_id: post.content_id,
      social_account_id: post.social_account_id,
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActivePost(event.active.data.current?.post ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePost(null);
    const { active, over } = event;
    if (!over || !active.data.current?.post) return;
    const post = active.data.current.post as ScheduledPost;
    const targetDay = over.id as string;
    const originalTime = format(parseISO(post.scheduled_at), 'HH:mm:ss');
    const newScheduledAt = `${targetDay}T${originalTime}`;
    if (post.scheduled_at.startsWith(targetDay)) return;
    updatePost.mutate({ id: post.id, scheduled_at: new Date(newScheduledAt).toISOString() });
  };

  const filteredAccounts = accounts?.filter((a) => a.platform === formPlatform) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-heading font-bold text-foreground">Calendário de Publicações</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setView(view === 'month' ? 'week' : 'month')}>
              {view === 'month' ? <LayoutList className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium min-w-[140px] text-center capitalize">
              {view === 'month' ? format(currentDate, 'MMMM yyyy', { locale: ptBR }) : `Semana de ${format(rangeStart, "dd 'de' MMM", { locale: ptBR })}`}
            </span>
            <Button variant="outline" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => openNewPost(new Date())} className="gap-1">
              <Plus className="h-4 w-4" /> Agendar
            </Button>
          </div>
        </div>

        {/* DnD Context */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {view === 'month' ? (
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayPosts = postsByDay[key] ?? [];
                const isToday = isSameDay(day, new Date());
                const inMonth = isSameMonth(day, currentDate);

                return (
                  <DroppableDay key={key} day={key}>
                    <div
                      className={cn('bg-card min-h-[100px] p-1.5 cursor-pointer hover:bg-accent/30 transition-colors', !inMonth && 'opacity-40')}
                      onClick={() => openNewPost(day)}
                    >
                      <span className={cn('text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full', isToday && 'bg-primary text-primary-foreground')}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayPosts.slice(0, 3).map((p) => (
                          <DraggablePost key={p.id} post={p}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 group/post" onClick={(e) => e.stopPropagation()}>
                                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', PLATFORM_COLORS[p.platform])} />
                                  <span className="text-[10px] truncate text-foreground">{format(parseISO(p.scheduled_at), 'HH:mm')}</span>
                                  <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover/post:opacity-100 ml-auto" onClick={() => handleDuplicate(p)}>
                                    <Copy className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">{PLATFORM_LABELS[p.platform]} — {p.status}</p>
                              </TooltipContent>
                            </Tooltip>
                          </DraggablePost>
                        ))}
                        {dayPosts.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{dayPosts.length - 3} mais</span>
                        )}
                      </div>
                    </div>
                  </DroppableDay>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayPosts = postsByDay[key] ?? [];
                const isToday = isSameDay(day, new Date());

                return (
                  <DroppableDay key={key} day={key}>
                    <Card className={cn('min-h-[200px] lg:min-h-[300px]', isToday && 'ring-2 ring-primary')}>
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-medium capitalize">
                          {format(day, 'EEE dd', { locale: ptBR })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-2">
                        {dayPosts.map((p) => (
                          <DraggablePost key={p.id} post={p}>
                            <div className="p-2 rounded-md bg-secondary/50 space-y-1 group relative cursor-grab active:cursor-grabbing">
                              <div className="flex items-center gap-1">
                                <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                                <span className={cn('w-2 h-2 rounded-full', PLATFORM_COLORS[p.platform])} />
                                <span className="text-xs font-medium capitalize">{p.platform}</span>
                                <Badge variant={STATUS_VARIANT[p.status]} className="ml-auto text-[10px] h-4">{p.status}</Badge>
                              </div>
                              <span className="text-[10px] text-muted-foreground">{format(parseISO(p.scheduled_at), 'HH:mm')}</span>
                              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); handleDuplicate(p); }}>
                                  <Copy className="h-3 w-3 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); deletePost.mutate(p.id); }}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </DraggablePost>
                        ))}
                        <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => openNewPost(day)}>
                          <Plus className="h-3 w-3 mr-1" /> Agendar
                        </Button>
                      </CardContent>
                    </Card>
                  </DroppableDay>
                );
              })}
            </div>
          )}

          <DragOverlay>
            {activePost && (
              <div className="p-2 rounded-md bg-primary/20 border border-primary shadow-lg text-xs font-medium capitalize">
                {activePost.platform} — {format(parseISO(activePost.scheduled_at), 'HH:mm')}
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* New Post Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendar Publicação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Data</Label>
                <Input type="date" value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''} onChange={(e) => setSelectedDate(new Date(e.target.value + 'T12:00:00'))} />
              </div>
              <div>
                <Label>Horário</Label>
                <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
              </div>
              <div>
                <Label>Plataforma</Label>
                <Select value={formPlatform} onValueChange={(v) => { setFormPlatform(v as SocialPlatform); setFormAccountId(''); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {filteredAccounts.length > 0 && (
                <div>
                  <Label>Conta</Label>
                  <Select value={formAccountId} onValueChange={setFormAccountId}>
                    <SelectTrigger><SelectValue placeholder="Selecionar conta" /></SelectTrigger>
                    <SelectContent>
                      {filteredAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.platform_username || a.platform}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {contents && contents.length > 0 && (
                <div>
                  <Label>Conteúdo (opcional)</Label>
                  <Select value={formContentId} onValueChange={setFormContentId}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {contents.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.title || `${c.type} - ${c.id.slice(0, 8)}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={createPost.isPending}>
                {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Agendar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
