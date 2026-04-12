import { useAdminData, useIsAdmin } from '@/hooks/useAdminData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Users, FileText, BarChart3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Navigate } from 'react-router-dom';

function fmt(d: string) {
  try { return format(parseISO(d), "dd/MM/yy HH:mm", { locale: ptBR }); } catch { return d; }
}

export default function AdminPage() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { profiles, roles, subscriptions, auditLogs, usageTracking, loading } = useAdminData();

  if (roleLoading) return <div className="flex justify-center py-20"><Skeleton className="h-8 w-48" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const getRoles = (userId: string) => roles.filter((r: any) => r.user_id === userId).map((r: any) => r.role);
  const getSub = (userId: string) => subscriptions.find((s: any) => s.user_id === userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-heading font-bold text-foreground">Administração</h1>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Usuários</TabsTrigger>
          <TabsTrigger value="audit"><FileText className="h-4 w-4 mr-1" />Auditoria</TabsTrigger>
          <TabsTrigger value="usage"><BarChart3 className="h-4 w-4 mr-1" />Uso</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader><CardTitle>Usuários ({profiles.length})</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-40 w-full" /> : (
                <div className="overflow-auto max-h-[60vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((p: any) => {
                        const sub = getSub(p.id);
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.full_name || '—'}</TableCell>
                            <TableCell>{p.company || '—'}</TableCell>
                            <TableCell>
                              {getRoles(p.id).map((r: string) => (
                                <Badge key={r} variant={r === 'admin' ? 'default' : 'secondary'} className="mr-1">{r}</Badge>
                              ))}
                            </TableCell>
                            <TableCell>{sub?.plan || '—'}</TableCell>
                            <TableCell><Badge variant="outline">{sub?.status || '—'}</Badge></TableCell>
                            <TableCell className="text-muted-foreground text-xs">{fmt(p.created_at)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader><CardTitle>Logs de Auditoria ({auditLogs.length})</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-40 w-full" /> : (
                <div className="overflow-auto max-h-[60vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ação</TableHead>
                        <TableHead>Recurso</TableHead>
                        <TableHead>Detalhes</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((l: any) => (
                        <TableRow key={l.id}>
                          <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{l.resource_type}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs">{JSON.stringify(l.details)}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{fmt(l.created_at)}</TableCell>
                        </TableRow>
                      ))}
                      {auditLogs.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum log encontrado</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader><CardTitle>Rastreamento de Uso ({usageTracking.length})</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-40 w-full" /> : (
                <div className="overflow-auto max-h-[60vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recurso</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Créditos</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usageTracking.map((u: any) => (
                        <TableRow key={u.id}>
                          <TableCell><Badge variant="secondary">{u.resource_type}</Badge></TableCell>
                          <TableCell>{u.quantity}</TableCell>
                          <TableCell>{u.credits_consumed}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{fmt(u.created_at)}</TableCell>
                        </TableRow>
                      ))}
                      {usageTracking.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum uso registrado</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
