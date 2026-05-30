import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { Drop } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Boxes, Users, Calendar, Tag, FileText, Crown, Coins, CheckCircle, XCircle, Wallet } from "lucide-react";

import { formatAdenaPreview } from "@/lib/adena";

export function DropDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const { data: drop, isLoading } = useQuery<Drop>({
    queryKey: ["drop", id],
    queryFn: async () => {
      const { data } = await api.get(`/drops/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const payMutation = useMutation({
    mutationFn: (participantId: string) =>
      api.post(`/drops/${id}/participants/${participantId}/pay`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drop", id] }),
  });

  const unpayMutation = useMutation({
    mutationFn: (participantId: string) =>
      api.post(`/drops/${id}/participants/${participantId}/unpay`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drop", id] }),
  });

  const payAllMutation = useMutation({
    mutationFn: () => api.post(`/drops/${id}/pay-all`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drop", id] }),
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="space-y-6 w-full">
        <Button variant="ghost" size="sm" onClick={() => navigate("/drops")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <p className="text-muted-foreground">Drop não encontrado.</p>
      </div>
    );
  }

  const splitPerPlayer =
    drop.splitValue ??
    (drop.participants.length > 0
      ? Math.floor(drop.totalValue / drop.participants.length)
      : 0);

  const pendingCount = drop.participants.filter((p) => p.paymentStatus === "PENDING").length;
  const paidCount = drop.participants.filter((p) => p.paymentStatus === "PAID").length;

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/drops")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{drop.title}</h1>
            <p className="text-muted-foreground">Detalhes do drop</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={drop.type === "BOSS" ? "destructive" : "secondary"} className="text-sm">
            {drop.type}
          </Badge>
          {isAdmin && pendingCount > 0 && (
            <Button size="sm" onClick={() => payAllMutation.mutate()} disabled={payAllMutation.isPending}>
              <Wallet className="h-4 w-4 mr-1" />
              Pagar Todos
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Data</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {new Date(drop.dropDate).toLocaleDateString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-primary">{formatAdenaPreview(drop.totalValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Split / Player</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{formatAdenaPreview(splitPerPlayer)}</div>
            <p className="text-xs text-muted-foreground">{drop.participants.length} participantes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pagamento</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              <Badge variant={pendingCount === 0 ? "default" : "destructive"}>
                {paidCount}/{drop.participants.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingCount === 0 ? "Todos pagos" : `${pendingCount} pendentes`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            Itens do Drop
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Unitário</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drop.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatAdenaPreview(item.unitValue)}</TableCell>
                  <TableCell className="text-right font-medium">{formatAdenaPreview(item.totalValue)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell colSpan={3} className="text-right font-bold">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {formatAdenaPreview(drop.totalValue)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {drop.participants.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  p.paymentStatus === "PAID" ? "bg-green-50 border-green-200" : "bg-muted/30"
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {p.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.user.name}</p>
                  <p className="text-xs text-muted-foreground">{formatAdenaPreview(splitPerPlayer)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {p.paymentStatus === "PAID" ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" /> Pago
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" /> Pendente
                    </Badge>
                  )}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        if (p.paymentStatus === "PENDING") {
                          payMutation.mutate(p.id);
                        } else {
                          unpayMutation.mutate(p.id);
                        }
                      }}
                      disabled={payMutation.isPending || unpayMutation.isPending}
                    >
                      {p.paymentStatus === "PENDING" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {drop.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{drop.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
