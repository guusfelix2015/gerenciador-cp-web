import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { parseAdena, formatAdenaPreview } from "@/lib/adena";
import type { Item, User, Drop } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";

const dropTypes = ["FARM", "BOSS", "PRIME"] as const;

function getAdenaMeta(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { preview: "", error: "", parsed: 0 };
  }
  const parsed = parseAdena(trimmed);
  if (parsed < 0) {
    return {
      preview: "",
      error: "Formato inválido. Use números ou sufixos k, kk, b.",
      parsed: -1,
    };
  }
  return {
    preview: `Valor equivalente: ${formatAdenaPreview(parsed)} Adenas`,
    error: "",
    parsed,
  };
}

interface DropFormItem {
  itemId?: string;
  itemName?: string;
  quantity: string;
  unitValue: string;
}

interface DropFormParticipant {
  userId: string;
}

export function DropFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("BOSS");
  const [dropDate, setDropDate] = useState("");
  const [notes, setNotes] = useState("");
  const [formItems, setFormItems] = useState<DropFormItem[]>([
    { quantity: "1", unitValue: "" },
  ]);
  const [formParticipants, setFormParticipants] = useState<DropFormParticipant[]>([
    { userId: "" },
  ]);

  const { data: itemsList } = useQuery<Item[]>({
    queryKey: ["items"],
    queryFn: async () => {
      const { data } = await api.get("/items");
      return data;
    },
  });

  const { data: usersList } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get("/users");
      return data;
    },
  });

  const { data: existingDrop, isLoading: isLoadingDrop } = useQuery<Drop>({
    queryKey: ["drop", id],
    queryFn: async () => {
      const { data } = await api.get(`/drops/${id}`);
      return data;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingDrop) {
      setTitle(existingDrop.title);
      setType(existingDrop.type);
      setDropDate(existingDrop.dropDate.split("T")[0]);
      setNotes(existingDrop.notes || "");
      setFormItems(
        existingDrop.items.map((it) => ({
          itemId: it.itemId || undefined,
          itemName: it.itemName,
          quantity: String(it.quantity),
          unitValue: String(it.unitValue),
        }))
      );
      setFormParticipants(
        existingDrop.participants.map((p) => ({
          userId: p.userId,
        }))
      );
    }
  }, [existingDrop]);

  const itemOptions =
    itemsList?.map((it) => ({
      value: it.id,
      label: it.name,
      subLabel: it.grade,
    })) ?? [];

  const userOptions =
    usersList?.map((u) => ({
      value: u.id,
      label: u.name,
      subLabel: u.role,
    })) ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/drops", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("/drops");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.patch(`/drops/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["drop", id] });
      navigate(`/drops/${id}`);
    },
  });

  const addItem = () => setFormItems([...formItems, { quantity: "1", unitValue: "" }]);
  const removeItem = (idx: number) => setFormItems(formItems.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof DropFormItem, value: string) => {
    const updated = [...formItems];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "itemId") {
      const found = itemsList?.find((i) => i.id === value);
      if (found) {
        updated[idx].itemName = undefined;
      }
    }
    setFormItems(updated);
  };

  const addParticipant = () => setFormParticipants([...formParticipants, { userId: "" }]);
  const removeParticipant = (idx: number) =>
    setFormParticipants(formParticipants.filter((_, i) => i !== idx));
  const updateParticipant = (idx: number, userId: string) => {
    const updated = [...formParticipants];
    updated[idx] = { userId };
    setFormParticipants(updated);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const invalidItem = formItems.find((it) => getAdenaMeta(it.unitValue).parsed < 0);
    if (invalidItem) {
      alert("Corrija os valores de Adena inválidos antes de salvar.");
      return;
    }

    const payload = {
      title,
      type,
      dropDate,
      notes: notes || undefined,
      items: formItems.map((it) => ({
        itemId: it.itemId || undefined,
        itemName: it.itemName || undefined,
        quantity: it.quantity,
        unitValue: it.unitValue,
      })),
      participants: formParticipants.filter((p) => p.userId),
    };

    if (isEditMode) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEditMode && isLoadingDrop) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(isEditMode ? `/drops/${id}` : "/drops")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? "Editar Drop" : "Novo Drop"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? "Atualize os dados do drop" : "Registre um novo drop da CP"}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Farm de RB Valakas"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                  {dropTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dropDate">Data do Drop *</Label>
                <Input
                  id="dropDate"
                  type="date"
                  value={dropDate}
                  onChange={(e) => setDropDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  placeholder="Observações opcionais"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Itens do Drop</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
              <p className="font-semibold mb-2">Como informar o valor da Adena:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                <span className="font-semibold">Valor</span>
                <span className="font-semibold">Nome</span>
                <span>1000</span>
                <span>Thousand</span>
                <span>1000000</span>
                <span>Million</span>
                <span>1000000000</span>
                <span>Billion</span>
                <span>1000000000000</span>
                <span>Trillion</span>
              </div>
              <p className="text-xs text-orange-700 mb-1 font-semibold">Exemplos:</p>
              <ul className="list-disc list-inside text-xs text-orange-700 space-y-0.5">
                <li>1000 = 1 Thousand</li>
                <li>100000 = 100 Thousand</li>
                <li>1000000 = 1 Million</li>
                <li>5000000 = 5 Million</li>
                <li>1000000000 = 1 Billion</li>
                <li>2500000000 = 2.5 Billion</li>
              </ul>
            </div>
            {formItems.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-lg border bg-muted/30"
              >
                <div className="md:col-span-5 space-y-1">
                  <Label className="text-xs">Item cadastrado</Label>
                  <Combobox
                    placeholder="Buscar item..."
                    searchPlaceholder="Digite para buscar..."
                    options={itemOptions}
                    value={item.itemId}
                    onChange={(value) => updateItem(idx, "itemId", value)}
                  />
                </div>

                {!item.itemId && (
                  <div className="md:col-span-5 space-y-1">
                    <Label className="text-xs">Nome do item (se não cadastrado)</Label>
                    <Input
                      placeholder="Coloque o nome de algum item no Lineage 2"
                      value={item.itemName || ""}
                      onChange={(e) => updateItem(idx, "itemName", e.target.value)}
                    />
                  </div>
                )}

                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs">Quantidade *</Label>
                  <Input
                    placeholder="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    required
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <Label className="text-xs">Valor Unitário *</Label>
                  <Input
                    placeholder="Digite o valor do drop"
                    value={item.unitValue}
                    onChange={(e) => updateItem(idx, "unitValue", e.target.value)}
                    required
                  />
                  {(() => {
                    const { preview, error } = getAdenaMeta(item.unitValue);
                    return (
                      <>
                        {preview && (
                          <p className="text-xs text-emerald-600 mt-1">{preview}</p>
                        )}
                        {error && (
                          <p className="text-xs text-destructive mt-1">{error}</p>
                        )}
                        {!preview && !error && (
                          <p className="text-xs text-muted-foreground mt-1">
                            k = mil | kk = milhão | b = bilhão
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="md:col-span-1 flex items-end justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(idx)}
                    disabled={formItems.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Participantes</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addParticipant}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar Participante
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {formParticipants.map((p, idx) => (
              <div
                key={idx}
                className="flex flex-wrap gap-3 items-start p-4 rounded-lg border bg-muted/30"
              >
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label className="text-xs">Membro *</Label>
                  <Combobox
                    placeholder="Buscar membro..."
                    searchPlaceholder="Digite para buscar..."
                    options={userOptions}
                    value={p.userId}
                    onChange={(value) => updateParticipant(idx, value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParticipant(idx)}
                    disabled={formParticipants.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate(isEditMode ? `/drops/${id}` : "/drops")}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            size="lg"
          >
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            {isEditMode ? "Salvar Alterações" : "Criar Drop"}
          </Button>
        </div>
      </form>
    </div>
  );
}
