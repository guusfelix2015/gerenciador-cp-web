import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { PaginatedAuditLogs } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ScrollText, ChevronLeft, ChevronRight, Eye } from "lucide-react";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 border-green-200",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-200",
  DELETE: "bg-red-100 text-red-800 border-red-200",
  PAY: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PAY_ALL: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState("");
  const [entityIdFilter, setEntityIdFilter] = useState("");
  const limit = 20;

  const { data: paginated, isLoading } = useQuery<PaginatedAuditLogs>({
    queryKey: ["audit-logs", page, limit, entityFilter, entityIdFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (entityFilter) params.set("entity", entityFilter);
      if (entityIdFilter) params.set("entityId", entityIdFilter);
      const { data } = await api.get(`/audit-logs?${params.toString()}`);
      return data;
    },
  });

  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const clearFilters = () => {
    setEntityFilter("");
    setEntityIdFilter("");
    setPage(1);
  };

  const totalPages = paginated?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" />
          Logs de Auditoria
        </h1>
        <p className="text-muted-foreground">Histórico de alterações no sistema</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 min-w-[160px]">
              <Label className="text-xs">Entidade</Label>
              <Select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}>
                <option value="">Todas</option>
                <option value="Drop">Drop</option>
                <option value="Item">Item</option>
                <option value="User">Usuário</option>
                <option value="DropParticipant">Pagamento</option>
              </Select>
            </div>
            <div className="space-y-1 min-w-[200px]">
              <Label className="text-xs">ID da Entidade</Label>
              <Input
                placeholder="Filtrar por ID..."
                value={entityIdFilter}
                onChange={(e) => { setEntityIdFilter(e.target.value); setPage(1); }}
              />
            </div>
            <Button variant="outline" onClick={clearFilters} className="mb-0.5">
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-right">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated?.data.map((log) => (
                    <>
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">{log.user.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={actionColors[log.action] || "bg-gray-100 text-gray-800"}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.entity}</TableCell>
                        <TableCell className="font-mono text-xs">{log.entityId.slice(0, 8)}...</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedLog(expandedLog === log.id ? null : log.id)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedLog === log.id && log.changes && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/50">
                            <pre className="text-xs overflow-auto p-2 rounded bg-muted">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                  {paginated?.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum log encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {paginated && paginated.total > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {paginated.data.length} de {paginated.total} logs
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
