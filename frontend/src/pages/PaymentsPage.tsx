import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { MemberBalance } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Wallet, Users, CheckCircle, ArrowRight } from "lucide-react";

import { formatAdenaPreview } from "@/lib/adena";

export function PaymentsPage() {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const { data: balances, isLoading } = useQuery<MemberBalance[]>({
    queryKey: ["payments", "balance"],
    queryFn: async () => {
      const { data } = await api.get("/drops/balance");
      return data;
    },
  });

  const bulkPayMutation = useMutation({
    mutationFn: async (payload: { dropId: string; participantIds: string[] }[]) => {
      const { data } = await api.post("/drops/bulk-pay", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["drops"] });
      setSelectedItems({});
    },
  });

  const toggleSelection = (participantId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [participantId]: !prev[participantId],
    }));
  };

  const selectAllFromMember = (member: MemberBalance, checked: boolean) => {
    const updated = { ...selectedItems };
    member.drops.forEach((d) => {
      updated[d.participantId] = checked;
    });
    setSelectedItems(updated);
  };

  const isMemberFullySelected = (member: MemberBalance) => {
    return member.drops.every((d) => selectedItems[d.participantId]);
  };

  const handleBulkPay = () => {
    const payloadMap: Record<string, { dropId: string; participantIds: string[] }> = {};

    Object.entries(selectedItems).forEach(([participantId, isSelected]) => {
      if (!isSelected) return;
      balances?.forEach((member) => {
        const drop = member.drops.find((d) => d.participantId === participantId);
        if (drop) {
          if (!payloadMap[drop.dropId]) {
            payloadMap[drop.dropId] = { dropId: drop.dropId, participantIds: [] };
          }
          payloadMap[drop.dropId].participantIds.push(participantId);
        }
      });
    });

    const payload = Object.values(payloadMap);
    if (payload.length === 0) return;
    bulkPayMutation.mutate(payload);
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  const totalSelectedValue = balances?.reduce((sum, member) => {
    const memberSelected = member.drops
      .filter((d) => selectedItems[d.participantId])
      .reduce((s, d) => s + d.splitValue, 0);
    return sum + memberSelected;
  }, 0) ?? 0;

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
          <Wallet className="h-6 w-6 text-primary" />
          Pagamentos
        </h1>
        <p className="text-muted-foreground">Gerencie os pagamentos dos membros da CP</p>
      </div>

      {balances && balances.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Selecionados</p>
                <p className="text-2xl font-bold">{selectedCount} participantes</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-primary">{formatAdenaPreview(totalSelectedValue)}</p>
              </div>
              <Button
                onClick={handleBulkPay}
                disabled={selectedCount === 0 || bulkPayMutation.isPending}
                className="gap-2"
              >
                {bulkPayMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCircle className="h-4 w-4" />
                Pagar Selecionados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {balances?.map((member) => (
          <Card key={member.userId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isMemberFullySelected(member)}
                    onCheckedChange={(checked) => selectAllFromMember(member, checked as boolean)}
                  />
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {member.drops.length} drops pendentes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-destructive">{formatAdenaPreview(member.totalPending)}</p>
                  <p className="text-xs text-muted-foreground">Saldo pendente</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                size="sm"
                className="mb-2"
                onClick={() =>
                  setExpandedMember(expandedMember === member.userId ? null : member.userId)
                }
              >
                {expandedMember === member.userId ? "Ocultar" : "Ver drops"}
                <ArrowRight className={`h-4 w-4 ml-1 transition-transform ${expandedMember === member.userId ? "rotate-90" : ""}`} />
              </Button>

              {expandedMember === member.userId && (
                <div className="rounded-md border mt-2">
                  <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                    Drops Pendentes
                  </div>
                  <div className="divide-y">
                    {member.drops.map((d) => (
                      <div
                        key={d.participantId}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Checkbox
                            checked={!!selectedItems[d.participantId]}
                            onCheckedChange={() => toggleSelection(d.participantId)}
                          />
                          <span className="truncate">{d.dropTitle}</span>
                        </div>
                        <Badge variant="outline">{formatAdenaPreview(d.splitValue)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {balances?.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Nenhum saldo pendente</p>
            <p className="text-sm">Todos os participantes estão pagos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
