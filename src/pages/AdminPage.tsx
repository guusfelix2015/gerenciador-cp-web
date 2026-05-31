import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Crown, Users, Package, Boxes, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";

interface WorkspaceWithUsers {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  users: User[];
  counts: {
    users: number;
    drops: number;
    items: number;
  };
}

export function AdminPage() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: workspaces, isLoading } = useQuery<WorkspaceWithUsers[]>({
    queryKey: ["admin", "workspaces"],
    queryFn: async () => {
      const { data } = await api.get("/admin/workspaces");
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/workspaces/${id}/toggle`),
    onSuccess: () => {
      toast.success("Status da CP atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin", "workspaces"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao atualizar status da CP");
    },
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Crown className="h-6 w-6 text-primary" />
          Painel Super Admin
        </h1>
        <p className="text-muted-foreground">Gerencie todas as CPs do sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workspaces?.map((ws) => (
          <Card key={ws.id} className={!ws.isActive ? "opacity-70" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{ws.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{ws.slug}</p>
                </div>
                <Badge variant={ws.isActive ? "default" : "destructive"}>
                  {ws.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-muted p-2">
                  <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-bold">{ws.counts.users}</div>
                  <div className="text-[10px] text-muted-foreground">Membros</div>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <Boxes className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-bold">{ws.counts.drops}</div>
                  <div className="text-[10px] text-muted-foreground">Drops</div>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <Package className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-bold">{ws.counts.items}</div>
                  <div className="text-[10px] text-muted-foreground">Itens</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => toggleExpand(ws.id)}
                >
                  {expanded[ws.id] ? "Ocultar" : "Ver"} membros
                </Button>
                <Button
                  variant={ws.isActive ? "destructive" : "default"}
                  className="flex-1 gap-2"
                  disabled={toggleMutation.isPending}
                  onClick={() => {
                    if (confirm(`Deseja ${ws.isActive ? "desativar" : "ativar"} a CP "${ws.name}"?`)) {
                      toggleMutation.mutate(ws.id);
                    }
                  }}
                >
                  {ws.isActive ? (
                    <>
                      <PowerOff className="h-4 w-4" /> Desativar
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4" /> Ativar
                    </>
                  )}
                </Button>
              </div>

              {expanded[ws.id] && (
                <div className="rounded-md border mt-2">
                  <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                    Membros da CP
                  </div>
                  <div className="divide-y">
                    {ws.users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                        <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                          {u.role}
                        </Badge>
                      </div>
                    ))}
                    {ws.users.length === 0 && (
                      <p className="px-3 py-2 text-sm text-muted-foreground">
                        Nenhum membro
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!workspaces?.length && (
        <EmptyState title="Nenhuma CP cadastrada" description="Ainda não há workspaces no sistema." />
      )}
    </div>
  );
}
