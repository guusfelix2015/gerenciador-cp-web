import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { DashboardOverview } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChartComponent } from "@/components/ui/bar-chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { Loader2, TrendingUp, Boxes, CalendarDays, Package, Crown, BarChart3, FileDown } from "lucide-react";

import { formatAdenaPreview } from "@/lib/adena";

export function DashboardPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterType, setFilterType] = useState("");

  const { data, isLoading } = useQuery<DashboardOverview>({
    queryKey: ["dashboard", startDate, endDate, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (filterType) params.set("type", filterType);
      const { data } = await api.get(`/dashboard/overview?${params.toString()}`);
      return data;
    },
  });

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilterType("");
  };

  const exportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
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

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral dos drops da CP</p>
        </div>
        <Button variant="outline" onClick={exportCsv} className="gap-2">
          <FileDown className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 min-w-[180px]">
              <Label className="text-xs">Data Início</Label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Data inicial"
              />
            </div>
            <div className="space-y-1 min-w-[180px]">
              <Label className="text-xs">Data Fim</Label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Data final"
              />
            </div>
            <div className="space-y-1 min-w-[160px]">
              <Label className="text-xs">Tipo</Label>
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">Todos</option>
                <option value="FARM">FARM</option>
                <option value="BOSS">BOSS</option>
                <option value="PRIME">PRIME</option>
              </Select>
            </div>
            <Button variant="outline" onClick={clearFilters} className="mb-0.5">
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Dropado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAdenaPreview(data?.totalValue ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Drops</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalDrops ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dia com Maior Valor</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.dayWithHighestValue
                ? new Date(data.dayWithHighestValue.date).toLocaleDateString("pt-BR")
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.dayWithHighestValue ? formatAdenaPreview(data.dayWithHighestValue.value) : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Item Mais Dropado</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{data?.topItem?.itemName ?? "-"}</div>
            <p className="text-xs text-muted-foreground">
              {data?.topItem ? `${data.topItem.totalQuantity}x` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ranking de Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.itemsRanking.length ? (
                  data.itemsRanking.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell className="text-right">{item.totalQuantity}</TableCell>
                      <TableCell className="text-right">{formatAdenaPreview(item.totalValue)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhum item registrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Drops por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={
                data?.dropsByDay.map((d) => ({
                  label: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
                  value: d.count,
                })) ?? []
              }
              color="#3b82f6"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Valor Dropado por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent
              data={
                data?.valueByDay.map((d) => ({
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
              <CalendarDays className="h-4 w-4" />
              Drops por Dia (Tabela)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Drops</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.dropsByDay.length ? (
                  data.dropsByDay.map((day, idx) => {
                    const value = data.valueByDay.find((v) => v.date === day.date)?.value ?? 0;
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <Badge variant="outline">
                            {new Date(day.date).toLocaleDateString("pt-BR")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{day.count}</TableCell>
                        <TableCell className="text-right">{formatAdenaPreview(value)}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhum drop registrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
