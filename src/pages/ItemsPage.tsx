import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { Item } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Package, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const grades = ["D", "C", "B", "A", "S", "COMMON"] as const;

const itemSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  grade: z.enum(grades),
});

type ItemForm = z.infer<typeof itemSchema>;

export function ItemsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();

  // Filtros
  const [filterName, setFilterName] = useState("");
  const [filterGrade, setFilterGrade] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ["items", filterName, filterGrade],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterName) params.set("name", filterName);
      if (filterGrade) params.set("grade", filterGrade);
      const { data } = await api.get(`/items?${params.toString()}`);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ItemForm) => api.post("/items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setDialogOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ItemForm }) =>
      api.patch(`/items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setDialogOpen(false);
      setEditing(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", grade: "COMMON" });
    setDialogOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditing(item);
    setValue("name", item.name);
    setValue("grade", item.grade);
    setDialogOpen(true);
  };

  const onSubmit = (data: ItemForm) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const clearFilters = () => {
    setFilterName("");
    setFilterGrade("");
  };

  const gradeColors: Record<string, string> = {
    S: "bg-purple-500 text-white",
    A: "bg-blue-500 text-white",
    B: "bg-green-500 text-white",
    C: "bg-yellow-500 text-black",
    D: "bg-orange-500 text-white",
    COMMON: "bg-gray-500 text-white",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Itens</h1>
          <p className="text-muted-foreground">Gerencie os itens do jogo</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Item
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-xs">Buscar por nome</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome do item..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-1 min-w-[150px]">
              <Label className="text-xs">Grade</Label>
              <Select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
                <option value="">Todas</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
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
            <Package className="h-4 w-4" />
            Lista de Itens
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Grade</TableHead>
                  {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge className={gradeColors[item.grade] ?? "bg-gray-500"}>
                        {item.grade}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Excluir item?")) deleteMutation.mutate(item.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {items?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 3 : 2} className="text-center text-muted-foreground py-8">
                      Nenhum item encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Item" : "Novo Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select {...register("grade")}>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {editing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
