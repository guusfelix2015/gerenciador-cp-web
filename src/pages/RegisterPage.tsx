import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DonationModal } from "@/components/donation/DonationModal";

const schema = z.object({
  cpName: z.string().min(2, "Nome da CP deve ter pelo menos 2 caracteres"),
  leaderName: z.string().min(2, "Nome do líder deve ter pelo menos 2 caracteres"),
  leaderEmail: z.string().email("Email inválido"),
  leaderPassword: z.string().min(4, "Senha deve ter pelo menos 4 caracteres"),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { registerCp } = useAuth();
  const [error, setError] = useState("");
  const [showDonation, setShowDonation] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setError("");
      await registerCp(data);
      toast.success("CP criada com sucesso!");
      setShowDonation(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao cadastrar CP";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleDonationClose = () => {
    setShowDonation(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Cadastrar CP</CardTitle>
          <CardDescription>Crie o workspace da sua CP</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpName">Nome da CP</Label>
              <Input id="cpName" placeholder="Ex: Red Dragons" {...register("cpName")} />
              {errors.cpName && <p className="text-xs text-destructive">{errors.cpName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaderName">Seu nome</Label>
              <Input id="leaderName" placeholder="Ex: Gustavo" {...register("leaderName")} />
              {errors.leaderName && <p className="text-xs text-destructive">{errors.leaderName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaderEmail">Email</Label>
              <Input id="leaderEmail" type="email" placeholder="gustavo@red-dragons.com" {...register("leaderEmail")} />
              {errors.leaderEmail && <p className="text-xs text-destructive">{errors.leaderEmail.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaderPassword">Senha</Label>
              <Input id="leaderPassword" type="password" placeholder="••••••" {...register("leaderPassword")} />
              {errors.leaderPassword && <p className="text-xs text-destructive">{errors.leaderPassword.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar CP"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <a href="/login" className="text-primary hover:underline">
              Entrar
            </a>
          </p>
        </CardContent>
      </Card>
      <DonationModal open={showDonation} onOpenChange={handleDonationClose} />
    </div>
  );
}
