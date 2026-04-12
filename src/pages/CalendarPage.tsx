import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useScheduledPosts, useCreateScheduledPost, useDeleteScheduledPost, type ScheduledPost } from '@/hooks/useScheduledPosts';
import { useContentLibrary } from '@/hooks/useContentLibrary';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, LayoutList, Loader2 } from 'lucide-react';
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

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  queued: 'outline',
  publishing: 'secondary',
  published: 'default',
  failed: 'destructive',
  cancelled: 'secondary',
};

export default function CalendarPage() {
  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  // New post form state
  const [formPlatform, setFormPlatform] = useState<SocialPlatform>('linkedin');
  const [formContentId, setFormContentId] = useState('');
  const [formTime, setFormTime] = useState('12:00');
  const [formAccountId, setFormAccountId] = useState('');

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
    }, {
      onSuccess: () => setDialogOpen(false),
    });
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

      {/* Calendar Grid */}
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
              <div
                key={key}
                className={cn(
                  'bg-card min-h-[100px] p-1.5 cursor-pointer hover:bg-accent/30 transition-colors',
                  !inMonth && 'opacity-40',
                )}
                onClick={() => openNewPost(day)}
              >
                <span className={cn(
                  'text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full',
                  isToday && 'bg-primary text-primary-foreground',
                )}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayPosts.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center gap-1">
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', PLATFORM_COLORS[p.platform])} />
                      <span className="text-[10px] truncate text-foreground">{format(parseISO(p.scheduled_at), 'HH:mm')}</span>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{dayPosts.length - 3} mais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Weekly View */
        <div className="grid grid-cols-7 gap-3">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayPosts = postsByDay[key] ?? [];
            const isToday = isSameDay(day, new Date());

            return (
              <Card key={key} className={cn('min-h-[300px]', isToday && 'ring-2 ring-primary')}>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs font-medium capitalize">
                    {format(day, 'EEE dd', { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  {dayPosts.map((p) => (
                    <div key={p.id} className="p-2 rounded-md bg-secondary/50 space-y-1 group relative">
                      <div className="flex items-center gap-1">
                        <span className={cn('w-2 h-2 rounded-full', PLATFORM_COLORS[p.platform])} />
                        <span className="text-xs font-medium capitalize">{p.platform}</span>
                        <Badge variant={STATUS_VARIANT[p.status]} className="ml-auto text-[10px] h-4">{p.status}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{format(parseISO(p.scheduled_at), 'HH:mm')}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); deletePost.mutate(p.id); }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => openNewPost(day)}>
                    <Plus className="h-3 w-3 mr-1" /> Agendar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
                  {Object.keys(PLATFORM_COLORS).map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
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
  );
}
