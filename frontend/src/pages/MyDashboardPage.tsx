import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChartComponent } from "@/components/ui/bar-chart";
import { Loader2, TrendingUp, Wallet, Clock, Boxes, BarChart3, Crown, CheckCircle, XCircle } from "lucide-react";

import { formatAdenaPreview } from "@/lib/adena";

interface MyDrop {
  id: string;
  title: string;
  type: "FARM" | "BOSS" | "PRIME";
  dropDate: string;
  totalValue: number;
  splitValue: number;
  myStatus: "PENDING" | "PAID";
  items: any[];
}

interface MyDashboardData {
  drops: MyDrop[];
  stats: {
    totalDrops: number;
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
  };
  earningsByDay: { date: string; value: number }[];
}

export function MyDashboardPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<MyDashboardData>({
    queryKey: ["my-drops"],
    queryFn: async () => {
      const { data } = await api.get("/drops/my");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha Dashboard</h1>
        <p className="text-muted-foreground">Seus ganhos e participações na CP</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ganho</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatAdenaPreview(stats?.totalEarned ?? 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Drops Participados</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDrops ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pendente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatAdenaPreview(stats?.totalPending ?? 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatAdenaPreview(stats?.totalPaid ?? 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Meus Ganhos por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={
                data?.earningsByDay.map((d) => ({
                  label: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
                  value: d.value,
                })) ?? []
              }
              color="#10b981"
              yAxisFormatter={formatAdena}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Resumo de Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Pagos</span>
              </div>
              <span className="font-bold text-green-700">{formatAdenaPreview(stats?.totalPaid ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium">Pendentes</span>
              </div>
              <span className="font-bold text-red-700">{formatAdenaPreview(stats?.totalPending ?? 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            Meus Drops
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Meu Split</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.drops.length ? (
                data.drops.map((drop) => (
                  <TableRow
                    key={drop.id}
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => navigate(`/drops/${drop.id}`)}
                  >
                    <TableCell className="font-medium">{drop.title}</TableCell>
                    <TableCell>
                      <Badge variant={drop.type === "BOSS" ? "destructive" : "secondary"}>
                        {drop.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(drop.dropDate).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{formatAdenaPreview(drop.totalValue)}</TableCell>
                    <TableCell className="font-medium">{formatAdenaPreview(drop.splitValue)}</TableCell>
                    <TableCell>
                      {drop.myStatus === "PAID" ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" /> Pago
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" /> Pendente
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Você ainda não participou de nenhum drop.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
