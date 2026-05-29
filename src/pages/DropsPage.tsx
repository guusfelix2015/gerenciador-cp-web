import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { PaginatedDrops } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Boxes, Search, ChevronLeft, ChevronRight, Pencil, FileDown } from "lucide-react";

export function DropsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();

  const [filterTitle, setFilterTitle] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: paginated, isLoading } = useQuery<PaginatedDrops>({
    queryKey: ["drops", page, limit, filterTitle, filterStartDate, filterEndDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (filterTitle) params.set("title", filterTitle);
      if (filterStartDate) params.set("startDate", filterStartDate);
      if (filterEndDate) params.set("endDate", filterEndDate);
      const { data } = await api.get(`/drops?${params.toString()}`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/drops/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const formatAdena = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}kk`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
    return String(v);
  };

  const clearFilters = () => {
    setFilterTitle("");
    setFilterStartDate("");
    setFilterEndDate("");
    setPage(1);
  };

  const exportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStartDate) params.set("startDate", filterStartDate);
      if (filterEndDate) params.set("endDate", filterEndDate);
      const response = await api.get(`/drops/export/csv?${params.toString()}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "drops.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Error handled by axios interceptor
    }
  };

  const totalPages = paginated?.totalPages ?? 1;

  const getPaymentBadge = (drop: any) => {
    if (!drop.participants || drop.participants.length === 0) return null;
    const paidCount = drop.participants.filter((p: any) => p.paymentStatus === "PAID").length;
    const total = drop.participants.length;
    if (paidCount === total) {
      return <Badge variant="default" className="text-[10px]">Pago</Badge>;
    }
    if (paidCount === 0) {
      return <Badge variant="destructive" className="text-[10px]">Pendente</Badge>;
    }
    return <Badge variant="secondary" className="text-[10px]">{paidCount}/{total}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drops</h1>
          <p className="text-muted-foreground">Registros de drops da CP</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} className="gap-2">
            <FileDown className="h-4 w-4" /> Exportar CSV
          </Button>
          {isAdmin && (
            <Button onClick={() => navigate("/drops/new")} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Drop
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-xs">Título</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
                  value={filterTitle}
                  onChange={(e) => { setFilterTitle(e.target.value); setPage(1); }}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-1 min-w-[180px]">
              <Label className="text-xs">Data Início</Label>
              <DatePicker
                value={filterStartDate}
                onChange={(v) => { setFilterStartDate(v); setPage(1); }}
                placeholder="Data inicial"
              />
            </div>
            <div className="space-y-1 min-w-[180px]">
              <Label className="text-xs">Data Fim</Label>
              <DatePicker
                value={filterEndDate}
                onChange={(v) => { setFilterEndDate(v); setPage(1); }}
                placeholder="Data final"
              />
            </div>
            <Button variant="outline" onClick={clearFilters} className="mb-0.5">
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            Lista de Drops
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Split</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated?.data.map((drop) => (
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
                      <TableCell>{formatAdena(drop.totalValue)}</TableCell>
                      <TableCell>{formatAdena(drop.splitValue ?? 0)}</TableCell>
                      <TableCell>{getPaymentBadge(drop)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/drops/${drop.id}/edit`)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Excluir drop?")) deleteMutation.mutate(drop.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {paginated && paginated.total > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {paginated.data.length} de {paginated.total} drops
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
