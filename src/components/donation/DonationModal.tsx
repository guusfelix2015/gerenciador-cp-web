import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Check, Heart } from "lucide-react";

const PIX_CODE = "00020126580014BR.GOV.BCB.PIX013644aa5c16-7355-487d-ac53-f8738e144f7c520400005303986540510.005802BR5919Gustavo Silva Felix6009SAO PAULO62140510QRUqCKG5G8630459E5";
const PIX_KEY = "44aa5c16-7355-487d-ac53-f8738e144f7c";
const GAME_NICK = "IRUMA";
const QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(PIX_CODE)}`;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
      <span className="text-sm font-mono flex-1 truncate">{label}</span>
      <Button variant="ghost" size="sm" onClick={handleCopy} className="shrink-0">
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export function DonationContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Heart className="h-8 w-8 text-red-500 mx-auto" />
        <h3 className="text-lg font-semibold">Apoie o Projeto</h3>
      </div>

      {/* Description PT-BR */}
      <div className="text-sm text-muted-foreground text-center leading-relaxed">
        Este sistema é totalmente gratuito! Mas se quiser contribuir para manter o projeto no ar, você pode fazer uma doação via PIX ou em adena no jogo para <strong className="text-foreground">IRUMA</strong>.
      </div>

      {/* Description ES */}
      <div className="text-sm text-muted-foreground text-center leading-relaxed border-t pt-4">
        <span className="text-xs uppercase tracking-wider text-muted-foreground/70 block mb-1">Español</span>
        ¡Este sistema es totalmente gratuito! Pero si deseas contribuir para mantener el proyecto en línea, puedes hacer una donación vía PIX o en adena en el juego para <strong className="text-foreground">IRUMA</strong>.
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-2">
        <img
          src={QR_CODE_URL}
          alt="QR Code PIX"
          className="rounded-lg border"
          width={200}
          height={200}
        />
        <span className="text-xs text-muted-foreground">Escaneie com seu app bancário</span>
      </div>

      {/* Copy fields */}
      <div className="space-y-3">
        <CopyButton text={PIX_KEY} label={`Chave PIX: ${PIX_KEY}`} />
        <CopyButton text={GAME_NICK} label={`Nick no jogo: ${GAME_NICK}`} />
      </div>
    </div>
  );
}

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DonationModal({ open, onOpenChange }: DonationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="text-center">Doação</DialogTitle>
      </DialogHeader>
      <DonationContent />
      <div className="mt-6 flex justify-center">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Fechar / Cerrar
        </Button>
      </div>
    </Dialog>
  );
}
